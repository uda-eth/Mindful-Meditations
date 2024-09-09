import { Storage } from '@google-cloud/storage';
import { SpeechClient } from '@google-cloud/speech';
import { NextApiRequest, NextApiResponse } from 'next';

// Initialize clients without explicitly providing credentials
const storage = new Storage({
  projectId: process.env.GOOGLE_PROJECT_ID,
});
const speechClient = new SpeechClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('Transcribe API called');
  let responseWasSent = false;

  const sendResponse = (statusCode: number, data: any) => {
    if (!responseWasSent) {
      console.log(`Sending response: ${statusCode}`, data);
      res.status(statusCode).json(data);
      responseWasSent = true;
    } else {
      console.log('Attempted to send response more than once');
    }
  };

  try {
    if (req.method !== 'POST') {
      console.log('Method not allowed');
      res.setHeader('Allow', ['POST']);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    console.log('Processing request body');
    console.log('Request body type:', typeof req.body);
    console.log('Request body length:', req.body.length);
    
    const audioBuffer = req.body;
    
    const bucketName = 'udotong-audio-bucket';
    const fileName = `audio-${Date.now()}.wav`;
    console.log(`Uploading audio to ${fileName}`);
    
    const file = storage.bucket(bucketName).file(fileName);
    await file.save(audioBuffer);
    console.log('Audio file saved to bucket');

    console.log('Starting transcription');
    const [response] = await speechClient.recognize({
      audio: { uri: `gs://${bucketName}/${fileName}` },
      config: {
        encoding: 'LINEAR16',
        sampleRateHertz: 16000,
        languageCode: 'en-US',
      },
    });
    console.log('Transcription completed');

    console.log('Raw API response:', JSON.stringify(response, null, 2));

    if (!response || !response.results || response.results.length === 0) {
      throw new Error('No transcription results received from the API');
    }

    const transcription = response.results
      .filter(result => result && result.alternatives && result.alternatives.length > 0)
      .map(result => result.alternatives![0].transcript)
      .join('\n');

    if (!transcription) {
      throw new Error('Transcription is empty');
    }

    console.log('Transcription:', transcription);

    console.log('Deleting audio file');
    await file.delete();
    console.log('Audio file deleted');

    sendResponse(200, { transcript: transcription });
  } catch (error) {
    console.error('Error in transcribe API:', error);
    if (error instanceof Error) {
      sendResponse(500, { error: 'Server error', details: error.message });
    } else {
      sendResponse(500, { error: 'Server error', details: 'An unknown error occurred' });
    }
  }
}
