import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

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
        },
        take: 50 // Limit to 50 most recent entries
      });
      console.log(`Retrieved ${journalEntries.length} entries`);
      res.status(200).json(journalEntries);
    } catch (error) {
      console.error('Error fetching journal entries:', error);
      res.status(500).json({ error: 'Error fetching journal entries', details: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      await prisma.$disconnect();
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
