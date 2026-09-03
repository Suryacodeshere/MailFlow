import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import apiRoutes from './routes/api';
import { emailQueue } from './workers/emailQueue';
import { startWorker } from './workers/emailWorker';
import prisma from './config/prisma';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Bull Board setup
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');
createBullBoard({
  queues: [new BullMQAdapter(emailQueue)],
  serverAdapter,
});
app.use('/admin/queues', serverAdapter.getRouter());

app.use('/api', apiRoutes);

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'MailFlow Scheduler API is running' });
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  console.log(`BullMQ Dashboard: http://localhost:${PORT}/admin/queues`);
  
  // Sync DB to queue on startup to recover lost jobs if Redis resets
  const syncJobsToQueue = async () => {
    const scheduledJobs = await prisma.emailJob.findMany({ where: { status: 'SCHEDULED' } });
    for (const dbJob of scheduledJobs) {
      const delayMs = Math.max(0, new Date(dbJob.scheduledAt).getTime() - Date.now());
      await emailQueue.add(
        'send-email',
        {
          emailJobId: dbJob.id,
          recipient: dbJob.recipient,
          subject: dbJob.subject,
          body: dbJob.body,
          userId: dbJob.userId,
          delayBetween: dbJob.delayBetween,
          hourlyLimit: dbJob.hourlyLimit
        },
        { delay: delayMs, jobId: dbJob.id } // jobId ensures idempotency in BullMQ
      );
    }
    if (scheduledJobs.length > 0) {
      console.log(`Synced ${scheduledJobs.length} scheduled jobs to queue for persistence.`);
    }
  };

  syncJobsToQueue().catch(console.error);

  // Start the background worker
  startWorker();
});
