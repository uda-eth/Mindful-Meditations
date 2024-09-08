import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { transcript } = req.body;
      console.log('Received transcript:', transcript);

      if (!transcript || transcript.trim() === '') {
        console.log('Rejecting empty transcript');
        return res.status(400).json({ error: 'Empty transcript not allowed' });
      }

      const journalEntry = await prisma.journalEntry.create({
        data: {
          transcript: transcript.trim(),
        },
      });

      console.log('Saved journal entry:', journalEntry);
      res.status(200).json(journalEntry);
    } catch (error) {
      console.error('Error saving journal entry:', error);
      res.status(500).json({ error: 'Error saving journal entry', details: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      await prisma.$disconnect();
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
