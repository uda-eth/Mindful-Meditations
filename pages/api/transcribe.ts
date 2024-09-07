import { NextApiRequest, NextApiResponse } from 'next';
import { Storage } from '@google-cloud/storage';
import { SpeechClient } from '@google-cloud/speech';
import { ErrorReporting } from '@google-cloud/error-reporting';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import { promisify } from 'util';

// Instantiate Error Reporting
const errors = new ErrorReporting();

const storage = new Storage({ 
  projectId: 'speech-to-text-project-434005',
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
});
       
const speechClient = new SpeechClient({
  projectId: 'speech-to-text-project-434005',
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
});
         
const upload = multer({ dest: '/tmp' });
const runMiddleware = promisify(upload.single('audio'));
      
export const config = {
  api: {
    bodyParser: false,
  },
};
          
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      console.log('Received POST request for transcription');
      await runMiddleware(req, res);
      const file = (req as any).file;

      if (!file) {
        throw new Error('No file uploaded');
      }
      
      console.log('File received:', file.originalname);
      
      const bucket = storage.bucket('udotong-audio-bucket');
      const fileName = `${uuidv4()}.wav`;
    
      // Upload to Google Cloud Storage
      console.log('Uploading to Google Cloud Storage');
      await bucket.upload(file.path, {
        destination: fileName,
      });
      console.log('File uploaded successfully');

      // Start long-running transcription
      console.log('Starting long-running transcription');
      const [operation] = await speechClient.longRunningRecognize({
        audio: { uri: `gs://udotong-audio-bucket/${fileName}` },
        config: {
          encoding: 'LINEAR16',
          sampleRateHertz: 16000,
          languageCode: 'en-US',
          enableAutomaticPunctuation: true,
          model: 'default',
        },
      });

      // Wait for operation to complete
      console.log('Waiting for transcription to complete...');
      const [response] = await operation.promise();
      
      const transcript = response.results
        .map(result => result.alternatives[0].transcript)
        .join('\n');

      console.log('Transcription completed:', transcript);

      res.status(200).json({ transcript });
    } catch (error) {
      console.error('Error processing audio:', error);
      
      // Report the error to Error Reporting
      errors.report(error);

      res.status(500).json({ error: 'Error processing audio' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
