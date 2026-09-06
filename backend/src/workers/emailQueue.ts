import { Queue } from 'bullmq';
import connection from '../config/redis';

export const EMAIL_QUEUE_NAME = 'email-queue';

export const emailQueue = new Queue(EMAIL_QUEUE_NAME, {
  connection,
  defaultJobOptions: {
    removeOnComplete: 100, // Keep last 100 completed jobs visible in dashboard
    removeOnFail: false,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    }
  },
});
