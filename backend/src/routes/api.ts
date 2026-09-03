import { Router, Request, Response } from 'express';
import { scheduleEmails } from '../controllers/scheduleController';
import { getEmails, getEmailById, deleteEmail, deleteAllEmails, updateEmail } from '../controllers/emailController';
import prisma from '../config/prisma';

const router = Router();

router.post('/schedule', scheduleEmails);
router.get('/emails', getEmails);
router.delete('/emails', deleteAllEmails);
router.get('/emails/:id', getEmailById);
router.delete('/emails/:id', deleteEmail);
router.patch('/emails/:id', updateEmail);

// User upsert endpoint
router.post('/users', async (req: Request, res: Response) => {
  const { email, name, avatar, googleId } = req.body;
  try {
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: { email, name, avatar, googleId }
      });
    } else {
      user = await prisma.user.update({
        where: { email },
        data: { name, avatar, googleId }
      });
    }
    res.json(user);
  } catch (error) {
    console.error('Error upserting user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/users/:email', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({ where: { email: String(req.params.email) } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

import axios from 'axios';

// Real Slack OAuth Flow
router.get('/slack/auth', (req: Request, res: Response) => {
  const { email } = req.query;
  const clientId = process.env.SLACK_CLIENT_ID;
  const redirectUri = `${process.env.BACKEND_URL || 'http://localhost:4000'}/api/slack/callback`;
  const url = `https://slack.com/oauth/v2/authorize?client_id=${clientId}&scope=incoming-webhook&redirect_uri=${redirectUri}&state=${email}`;
  res.redirect(url);
});

router.get('/slack/callback', async (req: Request, res: Response): Promise<void> => {
  const { code, state: email } = req.query;
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  
  try {
    const response = await axios.post('https://slack.com/api/oauth.v2.access', null, {
      params: {
        client_id: process.env.SLACK_CLIENT_ID,
        client_secret: process.env.SLACK_CLIENT_SECRET,
        code,
        redirect_uri: `${process.env.BACKEND_URL || 'http://localhost:4000'}/api/slack/callback`
      }
    });

    if (response.data.ok && response.data.incoming_webhook) {
      const webhookUrl = response.data.incoming_webhook.url;
      await prisma.user.update({
        where: { email: email as string },
        data: { slackWebhook: webhookUrl }
      });
      res.redirect(`${frontendUrl}/dashboard?slack=success`);
    } else {
      console.error('Slack OAuth Error:', response.data);
      res.redirect(`${frontendUrl}/dashboard?slack=error`);
    }
  } catch (err) {
    console.error('Slack OAuth Request Failed:', err);
    res.redirect(`${frontendUrl}/dashboard?slack=error`);
  }
});

router.post('/slack/disconnect', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ error: 'Email required' });
      return;
    }
    await prisma.user.update({
      where: { email },
      data: { slackWebhook: null }
    });
    res.json({ success: true });
  } catch (err) {
    console.error('Failed to disconnect Slack:', err);
    res.status(500).json({ error: 'Failed to disconnect Slack' });
  }
});

export default router;
