import { Storage } from '@google-cloud/storage';
import { SpeechClient } from '@google-cloud/speech';
import { NextApiRequest, NextApiResponse } from 'next';

// Initialize clients without explicitly providing credentials
const storage = new Storage({
  projectId: 'speech-to-text-project-434005', // Replace with your actual project ID
});
const speechClient = new SpeechClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      // Your existing code for handling the audio file and transcription
      // ...

      // Example of using the storage client
      const [buckets] = await storage.getBuckets();
      console.log('Buckets:', buckets.map(b => b.name));

      // Your existing code for transcription
      // ...

    } catch (error) {
      console.error('Transcription error:', error);
      res.status(500).json({ error: 'Error during transcription' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
