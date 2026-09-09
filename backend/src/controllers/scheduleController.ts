import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { emailQueue } from '../workers/emailQueue';

export const scheduleEmails = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userEmail, subject, body, recipients, scheduledAt, delayBetween, hourlyLimit } = req.body;
    
    if (!userEmail || !subject || !body || !recipients || !Array.isArray(recipients) || recipients.length === 0) {
      res.status(400).json({ error: 'Missing required fields or recipients is empty' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email: userEmail } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const userId = user.id;

    let startTime = scheduledAt ? new Date(scheduledAt).getTime() : Date.now();
    
    const emailJobs = [];
    
    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i];
      
      const emailJob = await prisma.emailJob.create({
        data: {
          userId,
          recipient,
          subject,
          body,
          scheduledAt: new Date(startTime),
          delayBetween: delayBetween ? parseInt(delayBetween) : 0,
          hourlyLimit: hourlyLimit ? parseInt(hourlyLimit) : 0,
          status: 'SCHEDULED'
        }
      });
      
      const delayMs = Math.max(0, startTime - Date.now());
      
      const job = await emailQueue.add(
        'send-email',
        {
          emailJobId: emailJob.id,
          recipient,
          subject,
          body,
          userId,
          delayBetween: delayBetween ? parseInt(delayBetween) : 0,
          hourlyLimit: hourlyLimit ? parseInt(hourlyLimit) : 0
        },
        {
          delay: delayMs,
          jobId: emailJob.id // For idempotency
        }
      );
      
      await prisma.emailJob.update({
        where: { id: emailJob.id },
        data: { bullmqJobId: job.id! }
      });
      
      emailJobs.push(emailJob);
    }
    
    res.json({ success: true, message: `Scheduled ${recipients.length} emails` });
  } catch (error) {
    console.error('Failed to schedule emails:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
