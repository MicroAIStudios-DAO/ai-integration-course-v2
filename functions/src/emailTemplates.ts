const PLAYBOOK_DOWNLOAD_URL = 'https://aiintegrationcourse.com/assets/AI_Prompt_Engineering_Automation_Playbook_FULL.pdf';
const PLAYBOOK_FALLBACK_URL = 'https://ai-integra-course-v2.web.app/assets/AI_Prompt_Engineering_Automation_Playbook_FULL.pdf';

export type LifecycleEmailType =
  | 'welcome_email'
  | 'trial_started_email'
  | 'playbook_delivery'
  | 'trial_day_3_nudge'
  | 'trial_expired_offer'
  | 'checkout_abandonment_email'
  | 'paid_welcome_email';

export type EmailTemplateDefinition = {
  type: LifecycleEmailType;
  campaignId: string;
  templateVersion: string;
  subject: string;
  previewText: string;
  replyTo: string;
  from?: string;
  ctaLabel?: string;
  body: string;
  html: string;
};

export type TemplateRenderContext = Record<string, string | number | null | undefined>;

export type RenderedEmailTemplate = EmailTemplateDefinition & {
  body: string;
  html: string;
  subject: string;
  previewText: string;
};

const TOKEN_PATTERN = /{{\s*([a-zA-Z0-9_]+)\s*}}/g;

const replaceTokens = (input: string, context: TemplateRenderContext): string =>
  input.replace(TOKEN_PATTERN, (_, token) => {
    const value = context[token];
    if (value === null || value === undefined) {
      return '';
    }
    return String(value);
  });

export const welcomeEmailTemplate: EmailTemplateDefinition = {
  type: 'welcome_email',
  campaignId: 'welcome_email_v1_20260410',
  templateVersion: 'v1',
  subject: 'Welcome to AI Integration Course — your first build starts here',
  previewText: 'Start with lesson 1 and get your first working AI workflow moving.',
  replyTo: 'info@aiintegrationcourse.com',
  ctaLabel: 'Start Lesson 1',
  body: `Hi {{firstName}},

Welcome to AI Integration Course.

You’re in.

This platform is built to help you stop collecting AI ideas and start building workflows that actually save time and do real work.

Here’s the best next move:
Start Lesson 1 and complete your first build.

What to do next:
1. Start Lesson 1
2. Follow the setup exactly as shown
3. Finish one working build before you worry about anything advanced

Keep it simple:
Momentum matters more than perfection on day one.

We’ll send your playbook separately so this email stays focused on one thing:
getting you moving.

Start here:
{{ctaUrl}}

You’ve got this.

— AI Integration Course`,
  html: `
    <p>Hi {{firstName}},</p>
    <p>Welcome to <strong>AI Integration Course</strong>.</p>
    <p>You’re in.</p>
    <p>This platform is built to help you stop collecting AI ideas and start building workflows that actually save time and do real work.</p>
    <p><strong>Here’s the best next move:</strong><br/>Start Lesson 1 and complete your first build.</p>
    <p><strong>What to do next:</strong></p>
    <ol>
      <li>Start Lesson 1</li>
      <li>Follow the setup exactly as shown</li>
      <li>Finish one working build before you worry about anything advanced</li>
    </ol>
    <p>Keep it simple: <strong>Momentum matters more than perfection on day one.</strong></p>
    <p>We’ll send your playbook separately so this email stays focused on one thing: getting you moving.</p>
    <p><a href="{{ctaUrl}}" style="display:inline-block;padding:12px 20px;background:#111827;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;">Start Lesson 1</a></p>
    <p>You’ve got this.</p>
    <p>— AI Integration Course</p>
  `,
};

export const trialStartedEmailTemplate: EmailTemplateDefinition = {
  type: 'trial_started_email',
  campaignId: 'trial_started_email_v1_20260410',
  templateVersion: 'v1',
  subject: 'Your 7-Day Trial is Active: Here is your roadmap',
  previewText: 'Your trial is officially live. Here is exactly what you can build in the next 7 days.',
  replyTo: 'info@aiintegrationcourse.com',
  ctaLabel: 'Access Your Trial Lessons',
  body: `Success! Your trial of the {{subscriptionTier}} plan is now active.

You have exactly 7 days to explore the setup path and free lesson library. Here is what we recommend you prioritize this week:

- The Free Lesson Path: Start with the setup and free lessons available during your trial.
- The Blueprint: Download your Prompt Engineering Automation Playbook (if you haven't already).
- The First Build: Complete the "Auto-Lead-Gen" build prep path so you are ready to move faster once your paid access activates.

Note on Billing: Your trial ends in 7 days. If you're getting value and want to keep your access, you don't have to do anything—your chosen plan will resume automatically. If not, you can cancel anytime from your dashboard.

Access Your Trial Lessons:
{{ctaUrl}}`,
  html: `
    <p>Success! Your trial of the <strong>{{subscriptionTier}}</strong> plan is now active.</p>
    <p>You have exactly 7 days to explore the setup path and free lesson library. Here is what we recommend you prioritize this week:</p>
    <ul>
      <li><strong>The Free Lesson Path:</strong> Start with the setup and free lessons available during your trial.</li>
      <li><strong>The Blueprint:</strong> Download your Prompt Engineering Automation Playbook (if you haven't already).</li>
      <li><strong>The First Build:</strong> Complete the "Auto-Lead-Gen" build prep path so you are ready to move faster once your paid access activates.</li>
    </ul>
    <p><strong>Note on Billing:</strong> Your trial ends in 7 days. If you're getting value and want to keep your access, you don't have to do anything—your chosen plan will resume automatically. If not, you can cancel anytime from your dashboard.</p>
    <p><a href="{{ctaUrl}}" style="font-weight:bold;color:#3b82f6;">Access Your Trial Lessons →</a></p>
  `,
};

export const playbookDeliveryTemplate: EmailTemplateDefinition = {
  type: 'playbook_delivery',
  campaignId: 'playbook_delivery_v1_20260410',
  templateVersion: 'v1',
  subject: 'Your Prompt Engineering Automation Playbook is ready',
  previewText: 'Here is your playbook download so you can build with a working blueprint, not guesswork.',
  replyTo: 'info@aiintegrationcourse.com',
  ctaLabel: 'Download the Playbook',
  body: `Hi {{firstName}},

Here is your Prompt Engineering Automation Playbook:
{{playbookUrl}}

Backup link:
{{playbookFallbackUrl}}

Keep this PDF nearby while you work through the course. It is meant to be used, not just saved.

— AI Integration Course`,
  html: `
    <p>Hi {{firstName}},</p>
    <p>Here is your <strong>Prompt Engineering Automation Playbook</strong>:</p>
    <p><a href="{{playbookUrl}}" style="font-weight:600;color:#111827;">Download the playbook</a></p>
    <p>Backup link:<br /><a href="{{playbookFallbackUrl}}" style="color:#3b82f6;">{{playbookFallbackUrl}}</a></p>
    <p>Keep this PDF nearby while you work through the course. It is meant to be used, not just saved.</p>
    <p>— AI Integration Course</p>
  `,
};

export const trialDay3NudgeTemplate: EmailTemplateDefinition = {
  type: 'trial_day_3_nudge',
  campaignId: 'trial_day_3_nudge_v1_20260410',
  templateVersion: 'v1',
  subject: 'Day 3 check-in: don’t let your trial drift',
  previewText: 'A small step today beats waiting for the perfect moment.',
  replyTo: 'info@aiintegrationcourse.com',
  ctaLabel: 'Continue the Course',
  body: `Hi {{firstName}},

Quick check-in:

Most people do not lose momentum because the material is hard.
They lose momentum because they wait for the “right time” to start.

Don’t do that.

You do not need a perfect block of free time.
You need one focused session and one finished step.

Today’s move:
- open the course
- continue the next lesson
- get one visible result before you close the tab

Small progress now is worth much more than a bigger plan later.

Pick it back up here:
{{ctaUrl}}

— AI Integration Course`,
  html: `
    <p>Hi {{firstName}},</p>
    <p>Quick check-in:</p>
    <p>Most people do not lose momentum because the material is hard. They lose momentum because they wait for the “right time” to start.</p>
    <p><strong>Don’t do that.</strong></p>
    <p>You do not need a perfect block of free time. You need one focused session and one finished step.</p>
    <p><strong>Today’s move:</strong></p>
    <ul>
      <li>open the course</li>
      <li>continue the next lesson</li>
      <li>get one visible result before you close the tab</li>
    </ul>
    <p>Small progress now is worth much more than a bigger plan later.</p>
    <p><a href="{{ctaUrl}}" style="display:inline-block;padding:12px 20px;background:#111827;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;">Continue the Course</a></p>
    <p>— AI Integration Course</p>
  `,
};

export const trialExpiredOfferTemplate: EmailTemplateDefinition = {
  type: 'trial_expired_offer',
  campaignId: 'trial_expired_offer_v2_20260410',
  templateVersion: 'v2',
  subject: 'Your trial ended. Pick back up for $29.99/month',
  previewText: 'Your setup window closed, but the fastest path back in is still open.',
  replyTo: 'info@aiintegrationcourse.com',
  ctaLabel: 'Restart Your Access',
  body: `Hi {{firstName}},

Your trial window ended, but the next move is still simple.

For $29.99/month, you can get back into AI Integration Course and keep building with:

- The guided implementation library
- The AI tutor for fast technical answers
- Practical workflow lessons built for real business use
- A clear path from setup to a working automation

If you are serious about getting one useful AI workflow live, restart here:
{{ctaUrl}}

The fastest path to value is still the same:
pick your plan, get back in, and finish one real build.

— AI Integration Course`,
  html: `
    <p>Hi {{firstName}},</p>
    <p>Your trial window ended, but the next move is still simple.</p>
    <p>For <strong>$29.99/month</strong>, you can get back into AI Integration Course and keep building with:</p>
    <ul>
      <li><strong>The guided implementation library</strong></li>
      <li><strong>The AI tutor</strong> for fast technical answers</li>
      <li><strong>Practical workflow lessons</strong> built for real business use</li>
      <li><strong>A clear path</strong> from setup to a working automation</li>
    </ul>
    <p>If you are serious about getting one useful AI workflow live, restart here:</p>
    <p><a href="{{ctaUrl}}" style="display:inline-block;padding:12px 20px;background:#111827;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;">Restart Your Access</a></p>
    <p>The fastest path to value is still the same: pick your plan, get back in, and finish one real build.</p>
    <p>— AI Integration Course</p>
  `,
};

export const checkoutAbandonmentTemplate: EmailTemplateDefinition = {
  type: 'checkout_abandonment_email',
  campaignId: 'checkout_abandonment_email_v2_2026',
  templateVersion: 'v2',
  subject: 'Did life get in the way? (Your AI build is waiting)',
  previewText: 'You have zero risk with our 14-Day Build Guarantee.',
  replyTo: 'info@aiintegrationcourse.com',
  ctaLabel: 'Resume Your Checkout Here',
  body: `Hi {{firstName}},

I noticed you started to enroll in the AI Integration Course but didn't finish checkout.

Usually, when this happens, it's because of one of two things:
1. You got distracted by the exact kind of busywork this course is designed to eliminate.
2. You're wondering if you actually have the technical skills to pull this off.

If it's the second one, let me reassure you: You do not need to be a coder.

The curriculum is built on copy-paste templates. We give you the working Python script for a customer service bot. You paste it in, add your business name, and hit run.

That's why we offer the 14-Day Build Guarantee. If you don't have a working AI automation saving you time within two weeks, I will refund every dollar.

You have zero risk. But every week you wait is another 10 hours lost to manual tasks.

Resume Your Checkout Here:
{{ctaUrl}}

Best,
Blaine Casey
AI Solutions Architect`,
  html: `
    <p>Hi {{firstName}},</p>
    <p>I noticed you started to enroll in the AI Integration Course but didn't finish checkout.</p>
    <p>Usually, when this happens, it's because of one of two things:</p>
    <ol>
      <li>You got distracted by the exact kind of busywork this course is designed to eliminate.</li>
      <li>You're wondering if you actually have the technical skills to pull this off.</li>
    </ol>
    <p>If it's the second one, let me reassure you: <strong>You do not need to be a coder.</strong></p>
    <p>The curriculum is built on copy-paste templates. We give you the working Python script for a customer service bot. You paste it in, add your business name, and hit run.</p>
    <p>That's why we offer the <strong>14-Day Build Guarantee</strong>. If you don't have a working AI automation saving you time within two weeks, I will refund every dollar.</p>
    <p>You have zero risk. But every week you wait is another 10 hours lost to manual tasks.</p>
    <p><a href="{{ctaUrl}}" style="display:inline-block;padding:12px 20px;background:#111827;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;">Resume Your Checkout Here</a></p>
    <p>Best,<br>Blaine Casey<br>AI Solutions Architect</p>
  `,
};

export const paidWelcomeEmailTemplate: EmailTemplateDefinition = {
  type: 'paid_welcome_email',
  campaignId: 'paid_welcome_email_v1_20260410',
  templateVersion: 'v1',
  subject: 'You’re fully in — your paid access is live',
  previewText: 'Your paid plan is active. Here’s the best next move.',
  replyTo: 'info@aiintegrationcourse.com',
  ctaLabel: 'Enter the Premium Path',
  body: `Hi {{firstName}},

Your paid access is now live.

That means you should stop thinking about setup and start thinking about output.

Your next move is not to browse everything.
It’s to enter the premium path and complete the next lesson in sequence.

Best way to use your access:
- stay in order
- finish builds, not just videos
- use the playbook and lessons together
- keep momentum high in the first 7 days

Start here:
{{ctaUrl}}

Welcome in.

— AI Integration Course`,
  html: `
    <p>Hi {{firstName}},</p>
    <p>Your <strong>paid access is now live.</strong></p>
    <p>That means you should stop thinking about setup and start thinking about output.</p>
    <p>Your next move is not to browse everything. It’s to enter the premium path and complete the next lesson in sequence.</p>
    <p><strong>Best way to use your access:</strong></p>
    <ul>
      <li>stay in order</li>
      <li>finish builds, not just videos</li>
      <li>use the playbook and lessons together</li>
      <li>keep momentum high in the first 7 days</li>
    </ul>
    <p><a href="{{ctaUrl}}" style="display:inline-block;padding:12px 20px;background:#111827;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;">Enter the Premium Path</a></p>
    <p>Welcome in.</p>
    <p>— AI Integration Course</p>
  `,
};

export const lifecycleEmailTemplates: Record<LifecycleEmailType, EmailTemplateDefinition> = {
  welcome_email: welcomeEmailTemplate,
  trial_started_email: trialStartedEmailTemplate,
  playbook_delivery: playbookDeliveryTemplate,
  trial_day_3_nudge: trialDay3NudgeTemplate,
  trial_expired_offer: trialExpiredOfferTemplate,
  checkout_abandonment_email: checkoutAbandonmentTemplate,
  paid_welcome_email: paidWelcomeEmailTemplate,
};

export const renderEmailTemplate = (
  template: EmailTemplateDefinition,
  context: TemplateRenderContext
): RenderedEmailTemplate => ({
  ...template,
  subject: replaceTokens(template.subject, context),
  previewText: replaceTokens(template.previewText, context),
  body: replaceTokens(template.body, context),
  html: replaceTokens(template.html, context),
});

export const playbookTemplateContext = {
  playbookUrl: PLAYBOOK_DOWNLOAD_URL,
  playbookFallbackUrl: PLAYBOOK_FALLBACK_URL,
};

export { PLAYBOOK_DOWNLOAD_URL, PLAYBOOK_FALLBACK_URL };
