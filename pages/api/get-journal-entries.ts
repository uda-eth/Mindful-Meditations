import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const entries = await prisma.journalEntry.findMany({
        orderBy: { createdAt: 'desc' },
      });
      res.status(200).json(entries);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching journal entries' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
