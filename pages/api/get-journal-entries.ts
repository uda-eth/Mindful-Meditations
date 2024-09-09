import { PrismaClient } from '@prisma/client';
import { NextApiRequest, NextApiResponse } from 'next';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const journalEntries = await prisma.journalEntry.findMany({
        where: {
          transcript: {
            not: '',
          },
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      console.log('Retrieved entries:', journalEntries); // Add this line
      res.status(200).json(journalEntries);
    } catch (error) {
      console.error('Error fetching journal entries:', error);
      res.status(500).json({ error: 'Error fetching journal entries' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
