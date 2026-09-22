const fs = require('fs');
let content = fs.readFileSync('backend/src/index.ts', 'utf8');

const importPrisma = "import prisma from './config/prisma';\n";
const code = \

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
      { delay: delayMs, jobId: dbJob.id }
    );
  }
  console.log(\\\Synced \\\ scheduled jobs to queue for persistence.\\\);
};

  // Sync DB to queue on startup
  syncJobsToQueue().catch(console.error);

  // Start the background worker\

content = importPrisma + content;
content = content.replace('// Start the background worker', code);
fs.writeFileSync('backend/src/index.ts', content);
