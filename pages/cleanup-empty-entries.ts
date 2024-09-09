import { PrismaClient } from '@prisma/client';
import { NextApiRequest, NextApiResponse } from 'next';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const deletedEntries = await prisma.journalEntry.deleteMany({
        where: {
          transcript: {
            equals: '',
          },
        },
      });

      res.status(200).json({ message: `Deleted ${deletedEntries.count} empty entries` });
    } catch (error) {
      console.error('Error cleaning up empty entries:', error);
      res.status(500).json({ error: 'Failed to clean up empty entries' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}