import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { transcript } = req.body;

      if (!transcript || transcript.trim() === '') {
        return res.status(400).json({ error: 'Empty transcript not allowed' });
      }

      const journalEntry = await prisma.journalEntry.create({
        data: {
          transcript,
        },
      });

      res.status(200).json(journalEntry);
    } catch (error) {
      res.status(500).json({ error: 'Failed to save journal entry' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
