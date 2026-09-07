import { Worker, Job, DelayedError } from 'bullmq';
import connection from '../config/redis';
import prisma from '../config/prisma';
import { sendEmail } from '../services/mailer';
import { EMAIL_QUEUE_NAME } from './emailQueue';
import { esClient } from '../config/elasticsearch';

// delay helper
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const startWorker = () => {
  const concurrency = Number(process.env.WORKER_CONCURRENCY) || 5;

  const worker = new Worker(EMAIL_QUEUE_NAME, async (job: Job) => {
    const { emailJobId, recipient, subject, body, userId, delayBetween, hourlyLimit } = job.data;
    
    const existingJob = await prisma.emailJob.findUnique({ where: { id: emailJobId } });
    if (existingJob?.status === 'SENT') return;

    // Update status to PROCESSING
    await prisma.emailJob.update({
      where: { id: emailJobId },
      data: { status: 'PROCESSING' }
    });

    // 1. Rate Limiting Check (Per-Sender)
    const currentHour = Math.floor(Date.now() / (1000 * 60 * 60));
    const rateLimitKey = `rate_limit:${userId}:${currentHour}`;
    
    // Atomically increment the counter
    const count = await connection.incr(rateLimitKey);
    
    if (count === 1) {
      // Set expiry for 2 hours to be safe and clean up memory
      await connection.expire(rateLimitKey, 2 * 60 * 60);
    }

    const maxPerHour = hourlyLimit > 0 ? hourlyLimit : (Number(process.env.MAX_EMAILS_PER_HOUR_PER_SENDER) || 200);

    if (count > maxPerHour) {
      // Limit exceeded.
      // Send Slack Notification
      await sendSlackNotification(userId);

      // Calculate time until next hour
      const nextHourTime = (currentHour + 1) * 60 * 60 * 1000;
      const delayMs = nextHourTime - Date.now();
      
      console.log(`Rate limit reached for user ${userId}. Delaying job ${job.id} by ${delayMs}ms.`);
      
      // Move back to delayed
      await job.moveToDelayed(Date.now() + delayMs, job.token!);
      
      // Update DB status back to SCHEDULED
      await prisma.emailJob.update({
        where: { id: emailJobId },
        data: { status: 'SCHEDULED', scheduledAt: new Date(Date.now() + delayMs) }
      });
      
      throw new DelayedError();
    }

    // 2. Minimum Delay (Provider Throttling mimic)
    if (delayBetween > 0) {
      await sleep(delayBetween * 1000);
    }

    // 3. Send Email
    try {
      await sendEmail(recipient, subject, body);
      
      // 4. Mark as SENT and sync to ES
      await prisma.emailJob.update({
        where: { id: emailJobId },
        data: { status: 'SENT' }
      });
      
      try {
        await esClient.index({
          index: 'emails',
          id: emailJobId,
          document: {
            emailJobId,
            userId,
            recipient,
            subject,
            body,
            status: 'SENT',
            sentAt: new Date()
          }
        });
      } catch (esError) {
        console.error("Elasticsearch indexing failed, but email was sent:", esError);
      }
      
    } catch (error) {
      console.error(`Failed to send email ${emailJobId}:`, error);
      await prisma.emailJob.update({
        where: { id: emailJobId },
        data: { status: 'FAILED' }
      });
      throw error;
    }
    
  }, {
    connection,
    concurrency
  });

  worker.on('failed', (job, err) => {
    if (err && err.name !== 'DelayedError') {
      console.error(`Job ${job?.id} failed:`, err.message);
    }
  });

  return worker;
};

async function sendSlackNotification(userId: string) {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.slackWebhook) return;
    
    // Only send notification once per hour per user
    const currentHour = Math.floor(Date.now() / (1000 * 60 * 60));
    const notifKey = `slack_notif:${userId}:${currentHour}`;
    const alreadySent = await connection.set(notifKey, '1', 'EX', 60 * 60, 'NX');
    
    if (alreadySent) {
      // Fire HTTP request to Slack webhook
      await fetch(user.slackWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: `🚨 Hourly email rate limit exceeded for your account. Future emails have been delayed to the next available hour.` })
      });
    }
  } catch (error) {
    console.error(`Failed to send slack notification for user ${userId}`, error);
  }
}
