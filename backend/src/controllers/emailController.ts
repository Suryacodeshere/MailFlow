import { Request, Response } from 'express';
import { esClient } from '../config/elasticsearch';
import prisma from '../config/prisma';

export const getEmails = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId: userEmail, status, query, sort } = req.query;
    
    if (!userEmail) {
      res.status(400).json({ error: 'userEmail is required' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email: userEmail as string } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const realUserId = user.id;

    if (query) {
      try {
        // Try Elasticsearch first
        const esResult = await esClient.search({
          index: 'emails',
          query: {
            bool: {
              must: [
                { match: { userId: realUserId } },
                { multi_match: { query: query as string, fields: ['recipient', 'subject', 'body'] } }
              ],
              filter: status ? [{ match: { status: status as string } }] : []
            }
          },
          sort: [
            { scheduledAt: { order: sort === 'asc' ? 'asc' : 'desc' } }
          ]
        });
        
        const hits = (esResult.hits.hits as any[]).map(hit => hit._source);
        res.json(hits);
        return;
      } catch (esError: any) {
        console.warn('Elasticsearch failed, falling back to Prisma search:', esError.message);
      }
    }
    
    // Fallback to Prisma if no text search or if ES failed
    const emails = await prisma.emailJob.findMany({
      where: {
        userId: realUserId,
        ...(status && { status: status as any }),
        ...(query && {
          OR: [
            { subject: { contains: query as string, mode: 'insensitive' } },
            { recipient: { contains: query as string, mode: 'insensitive' } },
            { body: { contains: query as string, mode: 'insensitive' } }
          ]
        })
      },
      orderBy: {
        scheduledAt: sort === 'asc' ? 'asc' : 'desc'
      }
    });
    res.json(emails);
  } catch (error) {
    console.error('Failed to get emails:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getEmailById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    if (!id) {
      res.status(400).json({ error: 'Email ID is required' });
      return;
    }

    const email = await prisma.emailJob.findUnique({
      where: { id: id as string },
      include: {
        user: true // To get the sender's name and avatar if needed
      }
    });

    if (!email) {
      res.status(404).json({ error: 'Email not found' });
      return;
    }

    res.json(email);
  } catch (error) {
    console.error('Failed to get email by id:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    if (!id) {
      res.status(400).json({ error: 'Email ID is required' });
      return;
    }

    await prisma.emailJob.delete({
      where: { id: id as string }
    });

    try {
      await esClient.delete({
        index: 'emails',
        id: id as string
      });
    } catch (esError) {
      // Ignore ES delete errors if it wasn't indexed
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Failed to delete email:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { starred, archived } = req.body;
    
    if (!id) {
      res.status(400).json({ error: 'Email ID is required' });
      return;
    }

    const email = await prisma.emailJob.update({
      where: { id: id as string },
      data: {
        ...(starred !== undefined && { starred }),
        ...(archived !== undefined && { archived })
      }
    });

    res.json(email);
  } catch (error) {
    console.error('Failed to update email:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteAllEmails = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, status } = req.query;
    
    if (!userId || !status) {
      res.status(400).json({ error: 'userId and status are required' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email: userId as string } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const statuses: any = status === 'SENT' ? ['SENT', 'FAILED'] : ['SCHEDULED'];

    const jobsToDelete = await prisma.emailJob.findMany({
      where: { userId: user.id, status: { in: statuses } },
      select: { id: true }
    });

    if (jobsToDelete.length > 0) {
      await prisma.emailJob.deleteMany({
        where: { userId: user.id, status: { in: statuses } }
      });

      try {
        const operations = jobsToDelete.flatMap(job => [
          { delete: { _index: 'emails', _id: job.id } }
        ]);
        await esClient.bulk({ refresh: true, operations });
      } catch (e) {
        console.error('ES bulk delete failed', e);
      }
    }

    res.json({ success: true, deletedCount: jobsToDelete.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
