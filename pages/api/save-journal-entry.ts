import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { transcript } = req.body;
      console.log('Received transcript:', transcript); // Add this line

      const journalEntry = await prisma.journalEntry.create({
        data: {
          transcript: transcript.trim(),
        },
      });

      console.log('Saved journal entry:', journalEntry); // Add this line
      res.status(200).json(journalEntry);
    } catch (error) {
      console.error('Error saving journal entry:', error);
      res.status(500).json({ error: 'Error saving journal entry' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
