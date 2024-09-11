import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      console.log('Starting cleanup of empty entries');

      const whereCondition = {
        OR: [
          { transcript: '' },
          { transcript: { equals: '', mode: 'insensitive' } },
          { transcript: { equals: null } },  // This line handles null values
        ],
      };

      const deletedEntries = await prisma.journalEntry.deleteMany({
        where: whereCondition,
      });

      console.log(`Deleted ${deletedEntries.count} empty entries`);

      res.status(200).json({ message: `Deleted ${deletedEntries.count} empty entries` });
    } catch (error) {
      console.error('Error cleaning up empty entries:', error);
      res.status(500).json({ 
        error: 'Failed to clean up empty entries', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      });
    } finally {
      await prisma.$disconnect();
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
