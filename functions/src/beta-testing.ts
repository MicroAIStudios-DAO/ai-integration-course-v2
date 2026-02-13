/**
 * Beta Testing Workflow - Firebase Cloud Functions
 * 
 * These functions handle the automated beta testing workflow:
 * 1. userJotToGithub: Receives UserJot feedback webhooks and creates GitHub issues
 * 2. githubToUserJot: Receives GitHub webhooks when issues are closed
 * 3. betaTesterSync: Syncs new beta testers to HubSpot
 * 
 * Setup Instructions:
 * 1. Configure Firebase environment variables (see firebase_config_simple.sh)
 * 2. Deploy with: firebase deploy --only functions
 * 3. Configure webhooks in UserJot and GitHub with the deployed function URLs
 */

import { onRequest } from 'firebase-functions/v2/https';
import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { defineSecret } from 'firebase-functions/params';
import * as admin from 'firebase-admin';
import axios from 'axios';

// Initialize Firestore
try { admin.initializeApp(); } catch { /* noop */ }
const db = admin.firestore();
const GITHUB_TOKEN = defineSecret('GITHUB_TOKEN');
const GITHUB_OWNER = process.env.GITHUB_OWNER || 'MicroAIStudios-DAO';
const GITHUB_REPO = process.env.GITHUB_REPO || 'ai-integration-course-v2';
const ZAPIER_CRITICAL_BUG_WEBHOOK_URL = process.env.ZAPIER_CRITICAL_BUG_WEBHOOK_URL;
const ZAPIER_ISSUE_CLOSED_WEBHOOK_URL = process.env.ZAPIER_ISSUE_CLOSED_WEBHOOK_URL;
const ZAPIER_BETA_WEBHOOK_URL = process.env.ZAPIER_BETA_WEBHOOK_URL;

/**
 * UserJot to GitHub Integration
 * Receives feedback from UserJot webhook and creates GitHub issues
 */
export const userJotToGithub = onRequest({ secrets: [GITHUB_TOKEN] }, async (req, res) => {
  // Only accept POST requests
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  try {
    const feedback = req.body.feedback || req.body;
    
    // Extract feedback details
    const {
      id: feedbackId,
      title,
      description,
      category,
      votes = 0,
      submittedBy,
      submittedAt,
      url: userJotUrl,
      userAgent,
      browserInfo,
      attachments = []
    } = feedback;

    // Validate required fields
    if (!feedbackId || !title) {
      res.status(400).json({ error: 'Missing required fields: id, title' });
      return;
    }

    // Check if we've already created an issue for this feedback
    const existingMapping = await db
      .collection('userJotToGithubMapping')
      .doc(feedbackId)
      .get();

    if (existingMapping.exists) {
      const githubIssueNumber = existingMapping.data()?.githubIssueNumber;
      res.status(200).json({
        message: 'Issue already exists',
        githubIssueNumber,
        githubUrl: `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/issues/${githubIssueNumber}`
      });
      return;
    }

    // Determine priority based on votes and keywords
    let priority = 'priority-low';
    if (votes >= 20) {
      priority = 'priority-high';
    } else if (votes >= 10) {
      priority = 'priority-medium';
    }

    // Check for critical keywords
    const criticalKeywords = ['crash', 'broken', 'critical', 'urgent', 'payment', 'security', 'data loss'];
    const lowerTitle = title.toLowerCase();
    const lowerDesc = (description || '').toLowerCase();
    
    if (criticalKeywords.some(keyword => lowerTitle.includes(keyword) || lowerDesc.includes(keyword))) {
      priority = 'priority-high';
    }

    // Map category to GitHub label
    const categoryLabels: { [key: string]: string } = {
      'bug': 'bug',
      'feature request': 'feature-request',
      'ux': 'ux',
      'content': 'content',
      'performance': 'performance',
      'praise': 'praise'
    };

    const categoryLabel = categoryLabels[category?.toLowerCase()] || 'feedback';

    // Build GitHub issue body
    let issueBody = `**Submitted by:** ${submittedBy?.email || submittedBy?.name || 'Anonymous'}\n`;
    issueBody += `**Date:** ${submittedAt || new Date().toISOString()}\n`;
    issueBody += `**Category:** ${category || 'General'}\n`;
    issueBody += `**Votes:** ${votes}\n\n`;
    issueBody += `## Description\n\n${description || 'No description provided'}\n\n`;

    // Add browser/device info if available
    if (browserInfo || userAgent) {
      issueBody += `## Technical Context\n\n`;
      if (browserInfo) {
        issueBody += `**Browser:** ${browserInfo.browser} ${browserInfo.version}\n`;
        issueBody += `**OS:** ${browserInfo.os}\n`;
        issueBody += `**Screen Size:** ${browserInfo.screenSize}\n`;
      }
      if (userAgent) {
        issueBody += `**User Agent:** ${userAgent}\n`;
      }
      issueBody += `\n`;
    }

    // Add attachments if available
    if (attachments.length > 0) {
      issueBody += `## Attachments\n\n`;
      attachments.forEach((attachment: any) => {
        if (attachment.type === 'image') {
          issueBody += `![Screenshot](${attachment.url})\n`;
        } else {
          issueBody += `[${attachment.type}](${attachment.url})\n`;
        }
      });
      issueBody += `\n`;
    }

    // Add UserJot link
    if (userJotUrl) {
      issueBody += `## UserJot Link\n\n${userJotUrl}\n\n`;
    }

    // Add developer checklist
    issueBody += `---\n\n`;
    issueBody += `## Developer Checklist\n\n`;
    issueBody += `- [ ] Reproduced the issue\n`;
    issueBody += `- [ ] Identified root cause\n`;
    issueBody += `- [ ] Implemented fix\n`;
    issueBody += `- [ ] Tested fix\n`;
    issueBody += `- [ ] Deployed to production\n`;
    issueBody += `- [ ] Notified submitter\n\n`;
    issueBody += `*Automatically created from beta feedback*`;

    // Create GitHub issue
    const githubToken = process.env.GITHUB_TOKEN || GITHUB_TOKEN.value();
    const githubOwner = GITHUB_OWNER;
    const githubRepo = GITHUB_REPO;
    if (!githubToken || !githubOwner || !githubRepo) {
      res.status(500).json({ error: 'Missing GitHub configuration (GITHUB_TOKEN/OWNER/REPO)' });
      return;
    }

    const githubResponse = await axios.post(
      `https://api.github.com/repos/${githubOwner}/${githubRepo}/issues`,
      {
        title: `[BETA] ${title}`,
        body: issueBody,
        labels: ['beta-feedback', categoryLabel, priority]
      },
      {
        headers: {
          'Authorization': `token ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );

    const githubIssueNumber = githubResponse.data.number;
    const githubIssueUrl = githubResponse.data.html_url;

    // Store mapping in Firestore
    await db.collection('userJotToGithubMapping').doc(feedbackId).set({
      feedbackId,
      githubIssueNumber,
      githubIssueUrl,
      title,
      category,
      priority,
      submittedBy: submittedBy?.email || 'anonymous',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // If critical, send alert via Zapier
    if (priority === 'priority-high') {
      const zapierWebhook = ZAPIER_CRITICAL_BUG_WEBHOOK_URL;
      if (zapierWebhook) {
        await axios.post(zapierWebhook, {
          title,
          description,
          priority,
          submittedBy: submittedBy?.email || 'anonymous',
          githubUrl: githubIssueUrl,
          userJotUrl
        }).catch(err => console.error('Failed to send Zapier alert:', err));
      }
    }

    res.status(200).json({
      success: true,
      githubIssueNumber,
      githubIssueUrl,
      priority
    });
    return;

  } catch (error: any) {
    console.error('Error processing UserJot webhook:', error);
    
    // Log error to Firestore for debugging
    await db.collection('webhookErrors').add({
      type: 'userJotToGithub',
      error: error.message,
      stack: error.stack,
      body: req.body,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
    return;
  }
});

/**
 * GitHub to UserJot Integration
 * Receives GitHub webhooks when issues are closed and notifies submitter
 */
export const githubToUserJot = onRequest(async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  try {
    const { action, issue } = req.body;

    // Only process when issues are closed
    if (action !== 'closed') {
      res.status(200).json({ message: 'Not a close event, ignoring' });
      return;
    }

    // Check if this is a beta feedback issue
    const isBetaFeedback = issue.labels.some((label: any) => label.name === 'beta-feedback');
    if (!isBetaFeedback) {
      res.status(200).json({ message: 'Not a beta feedback issue, ignoring' });
      return;
    }

    // Find the original feedback in our mapping
    const mappingSnapshot = await db
      .collection('userJotToGithubMapping')
      .where('githubIssueNumber', '==', issue.number)
      .limit(1)
      .get();

    if (mappingSnapshot.empty) {
      res.status(404).json({ error: 'No mapping found for this issue' });
      return;
    }

    const mapping = mappingSnapshot.docs[0].data();

    // Trigger Zapier workflow to send notification email
    const zapierWebhook = ZAPIER_ISSUE_CLOSED_WEBHOOK_URL;
    if (zapierWebhook) {
      await axios.post(zapierWebhook, {
        issueTitle: issue.title,
        issueUrl: issue.html_url,
        submittedBy: mapping.submittedBy,
        closedAt: issue.closed_at,
        closedBy: issue.closed_by?.login
      });
    }

    // Update mapping with closure info
    await mappingSnapshot.docs[0].ref.update({
      closedAt: admin.firestore.FieldValue.serverTimestamp(),
      closedBy: issue.closed_by?.login,
      notificationSent: true
    });

    res.status(200).json({
      success: true,
      message: 'Notification sent to submitter'
    });
    return;

  } catch (error: any) {
    console.error('Error processing GitHub webhook:', error);
    
    await db.collection('webhookErrors').add({
      type: 'githubToUserJot',
      error: error.message,
      stack: error.stack,
      body: req.body,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
    return;
  }
});

/**
 * Beta Tester Sync to HubSpot
 * Triggered when a user document is updated with isBetaTester: true
 */
export const betaTesterSync = onDocumentUpdated('users/{userId}', async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!before || !after) {
      return;
    }

    // Only process if user just became a beta tester
    if (!before.isBetaTester && after.isBetaTester) {
      try {
        const zapierWebhook = ZAPIER_BETA_WEBHOOK_URL;
        
        if (!zapierWebhook) {
          console.warn('Zapier beta webhook URL not configured');
          return;
        }

        // Send to Zapier → HubSpot
        await axios.post(zapierWebhook, {
          email: after.email,
          firstName: after.firstName || after.displayName?.split(' ')[0] || '',
          lastName: after.lastName || after.displayName?.split(' ').slice(1).join(' ') || '',
          betaCohort: after.betaCohort || 'Pioneer',
          signupDate: after.betaSignupDate || new Date().toISOString(),
          userId: event.params.userId
        });

        console.log(`Beta tester synced to HubSpot: ${after.email}`);

      } catch (error) {
        console.error('Error syncing beta tester to HubSpot:', error);
      }
    }
  });
