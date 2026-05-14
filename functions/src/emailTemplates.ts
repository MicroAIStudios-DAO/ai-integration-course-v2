const PLAYBOOK_DOWNLOAD_URL = 'https://aiintegrationcourse.com/assets/AI_Prompt_Engineering_Automation_Playbook_FULL.pdf';
const PLAYBOOK_FALLBACK_URL = 'https://ai-integra-course-v2.web.app/assets/AI_Prompt_Engineering_Automation_Playbook_FULL.pdf';

export type LifecycleEmailType =
  | 'welcome_email'
  | 'trial_started_email'
  | 'playbook_delivery'
  | 'trial_day_3_nudge'
  | 'trial_expired_offer'
  | 'checkout_abandonment_email'
  | 'checkout_abandonment_email_2'
  | 'checkout_abandonment_email_3'
  | 'checkout_abandonment_email_4'
  | 'checkout_abandonment_email_5'
  | 'paid_welcome_email'
  | 'trial_ending_soon'
  | 'trial_day_1_email'
  | 'trial_day_5_email'
  | 'trial_day_7_email'
  | 'trial_concierge_email'
  | 'payment_failed_email'
  | 'payment_failed_email_2'
  | 'payment_failed_email_3'
  | 'annual_upsell_email'
  | 'rescue_link_email';

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

// ── ABANDONMENT EMAIL 2 (~22-24 hours) — Objection Handler — Exact brief copy ─
export const checkoutAbandonmentTemplate2: EmailTemplateDefinition = {
  type: 'checkout_abandonment_email_2',
  campaignId: 'checkout_abandonment_email_2_v3_2026',
  templateVersion: 'v3',
  subject: 'Most people pause at this step',
  previewText: 'Usually it\'s price, time, or uncertainty',
  replyTo: 'info@aiintegrationcourse.com',
  // CTA is plan-aware: annual abandoners get trial CTA, trial abandoners get resume CTA
  ctaLabel: '{{ctaLabel}}',
  body: `Totally normal.

Most people hesitate here for one of three reasons:

1. "I'm not sure I'll use it."
You should be able to get your first real win in the first session.

2. "I don't have time."
This was built for real schedules, not marathon study sessions.

3. "What if it's not worth it?"
You're protected by the 14-Day Build Guarantee.

If the hesitation is commitment, take the lowest-risk path.

{{ctaUrl}}`,
  html: `
    <p>Totally normal.</p>
    <p>Most people hesitate here for one of three reasons:</p>
    <p><strong>1. "I'm not sure I'll use it."</strong><br>You should be able to get your first real win in the first session.</p>
    <p><strong>2. "I don't have time."</strong><br>This was built for real schedules, not marathon study sessions.</p>
    <p><strong>3. "What if it's not worth it?"</strong><br>You're protected by the 14-Day Build Guarantee.</p>
    <p>If the hesitation is commitment, take the lowest-risk path.</p>
    <p><a href="{{ctaUrl}}" style="display:inline-block;padding:12px 20px;background:#10b981;color:#000000;text-decoration:none;border-radius:8px;font-weight:700;">{{ctaLabel}} →</a></p>
    <p style="font-size:12px;color:#6b7280;">You're protected by the 14-Day Build Guarantee.</p>
    <p>— AI Integration Course</p>
  `,
};

// ── ABANDONMENT EMAIL 3 (~46-48 hours) — Momentum / Identity — Exact brief copy
export const checkoutAbandonmentTemplate3: EmailTemplateDefinition = {
  type: 'checkout_abandonment_email_3',
  campaignId: 'checkout_abandonment_email_3_v3_2026',
  templateVersion: 'v3',
  subject: 'Don\'t just learn AI. Start using it.',
  previewText: 'This is where momentum starts',
  replyTo: 'info@aiintegrationcourse.com',
  ctaLabel: 'Finish What You Started',
  body: `The people who benefit most from AI will not be the ones who keep reading about it.

They'll be the ones who start using it while everyone else is still watching.

You were already at the door.

{{ctaUrl}}

{{annualFallback}}`,
  html: `
    <p>The people who benefit most from AI will not be the ones who keep reading about it.</p>
    <p>They'll be the ones who start using it while everyone else is still watching.</p>
    <p>You were already at the door.</p>
    <p><a href="{{ctaUrl}}" style="display:inline-block;padding:12px 20px;background:#10b981;color:#000000;text-decoration:none;border-radius:8px;font-weight:700;">Finish What You Started →</a></p>
    {{annualFallbackHtml}}
    <p>— AI Integration Course</p>
  `,
};

// ── ABANDONMENT EMAIL 4 (~72 hours) — Conditional Incentive — Exact brief copy ─
// Only send to: first-time buyers, no prior purchase, still not converted
export const checkoutAbandonmentTemplate4: EmailTemplateDefinition = {
  type: 'checkout_abandonment_email_4',
  campaignId: 'checkout_abandonment_email_4_v3_2026',
  templateVersion: 'v3',
  subject: 'I\'ll make this easier',
  previewText: 'A small push to get you moving',
  replyTo: 'info@aiintegrationcourse.com',
  ctaLabel: 'Complete My Access',
  body: `If price was the sticking point, here's the nudge:

Complete your signup today and we'll include the AI Workflow Starter Pack bonus at no extra charge.

You still get:
- full access
- the guarantee
- immediate unlock

{{ctaUrl}}

{{annualFallback}}`,
  html: `
    <p>If price was the sticking point, here's the nudge:</p>
    <p>Complete your signup today and we'll include the <strong>AI Workflow Starter Pack bonus</strong> at no extra charge.</p>
    <p>You still get:</p>
    <ul>
      <li>full access</li>
      <li>the guarantee</li>
      <li>immediate unlock</li>
    </ul>
    <p><a href="{{ctaUrl}}" style="display:inline-block;padding:12px 20px;background:#10b981;color:#000000;text-decoration:none;border-radius:8px;font-weight:700;">Complete My Access →</a></p>
    {{annualFallbackHtml}}
    <p>— AI Integration Course</p>
  `,
};

// ── ABANDONMENT EMAIL 5 (~6-7 days) — Closeout — Exact brief copy ─────────────
export const checkoutAbandonmentTemplate5: EmailTemplateDefinition = {
  type: 'checkout_abandonment_email_5',
  campaignId: 'checkout_abandonment_email_5_v1_2026',
  templateVersion: 'v1',
  subject: 'Closing your access link soon',
  previewText: 'Last easy path back in',
  replyTo: 'info@aiintegrationcourse.com',
  ctaLabel: 'Resume Checkout',
  body: `No pressure.

But if you still want in, here's the fastest path back.

{{ctaUrl}}

Start 7-Day Trial for $1:
{{trialUrl}}`,
  html: `
    <p>No pressure.</p>
    <p>But if you still want in, here's the fastest path back.</p>
    <p><a href="{{ctaUrl}}" style="display:inline-block;padding:12px 20px;background:#111827;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;">Resume Checkout →</a></p>
    <p style="margin-top:12px;"><a href="{{trialUrl}}" style="display:inline-block;padding:10px 18px;background:#10b981;color:#000000;text-decoration:none;border-radius:8px;font-weight:700;">Start 7-Day Trial for $1 →</a></p>
    <p style="font-size:12px;color:#6b7280;">— AI Integration Course</p>
  `,
};

// ── TRIAL DAY 1 — Get Your First Win ────────────────────────────────────────
export const trialDay1Template: EmailTemplateDefinition = {
  type: 'trial_day_1_email',
  campaignId: 'trial_day_1_v1_2026',
  templateVersion: 'v1',
  subject: 'Get your first win today',
  previewText: 'The goal is not to consume content',
  replyTo: 'info@aiintegrationcourse.com',
  ctaLabel: 'Build My First Workflow',
  body: `The goal is not to consume content.
The goal is to build one useful thing.

Start here:
{{quickStartLink}}

— AI Integration Course`,
  html: `
    <p>The goal is not to consume content.</p>
    <p>The goal is to build one useful thing.</p>
    <p><a href="{{quickStartLink}}" style="display:inline-block;padding:12px 20px;background:#10b981;color:#000000;text-decoration:none;border-radius:8px;font-weight:700;">Build My First Workflow →</a></p>
    <p>— AI Integration Course</p>
  `,
};

// ── TRIAL DAY 3 — Fastest Path ───────────────────────────────────────────────
export const trialDay3Template: EmailTemplateDefinition = {
  type: 'trial_day_3_nudge',
  campaignId: 'trial_day_3_v2_2026',
  templateVersion: 'v2',
  subject: 'Here\'s the easiest workflow to build next',
  previewText: 'The fastest way to turn your trial into something tangible',
  replyTo: 'info@aiintegrationcourse.com',
  ctaLabel: 'Use the Fastest Path',
  body: `If you've been busy, use this path.
It's the fastest way to turn your trial into something tangible.

{{ctaUrl}}

— AI Integration Course`,
  html: `
    <p>If you've been busy, use this path.</p>
    <p>It's the fastest way to turn your trial into something tangible.</p>
    <p><a href="{{ctaUrl}}" style="display:inline-block;padding:12px 20px;background:#10b981;color:#000000;text-decoration:none;border-radius:8px;font-weight:700;">Use the Fastest Path →</a></p>
    <p>— AI Integration Course</p>
  `,
};

// ── TRIAL DAY 5 — Trial Moving Fast ──────────────────────────────────────────
export const trialDay5Template: EmailTemplateDefinition = {
  type: 'trial_day_5_email',
  campaignId: 'trial_day_5_v1_2026',
  templateVersion: 'v1',
  subject: 'Your trial is moving fast',
  previewText: 'A few days left to make this real',
  replyTo: 'info@aiintegrationcourse.com',
  ctaLabel: 'Finish My First Win',
  body: `You've got a few days left to make this real.

Before the trial ends, make sure you do one of these:
- build one workflow
- save one template
- complete the quick-start lesson

{{ctaUrl}}

— AI Integration Course`,
  html: `
    <p>You've got a few days left to make this real.</p>
    <p>Before the trial ends, make sure you do one of these:</p>
    <ul>
      <li>build one workflow</li>
      <li>save one template</li>
      <li>complete the quick-start lesson</li>
    </ul>
    <p><a href="{{ctaUrl}}" style="display:inline-block;padding:12px 20px;background:#10b981;color:#000000;text-decoration:none;border-radius:8px;font-weight:700;">Finish My First Win →</a></p>
    <p>— AI Integration Course</p>
  `,
};

// ── TRIAL DAY 7 — Final Day ───────────────────────────────────────────────────
export const trialDay7Template: EmailTemplateDefinition = {
  type: 'trial_day_7_email',
  campaignId: 'trial_day_7_v1_2026',
  templateVersion: 'v1',
  subject: 'Final day of your trial',
  previewText: 'Your access continues tomorrow unless you cancel before renewal',
  replyTo: 'info@aiintegrationcourse.com',
  ctaLabel: 'Go to My Dashboard',
  body: `Your access continues tomorrow unless you cancel before renewal.

If you want to keep the momentum, stay in.
If not, cancel before renewal in your account area.

{{ctaUrl}}

— AI Integration Course`,
  html: `
    <p>Your access continues tomorrow unless you cancel before renewal.</p>
    <p>If you want to keep the momentum, stay in.<br>If not, cancel before renewal in your account area.</p>
    <p><a href="{{ctaUrl}}" style="display:inline-block;padding:12px 20px;background:#111827;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;">Go to My Dashboard →</a></p>
    <p>— AI Integration Course</p>
  `,
};

// ── TRIAL CONCIERGE — Non-Activated by Day 3 ─────────────────────────────────
export const trialConciergeTemplate: EmailTemplateDefinition = {
  type: 'trial_concierge_email',
  campaignId: 'trial_concierge_v1_2026',
  templateVersion: 'v1',
  subject: 'Want help getting your first win?',
  previewText: 'Reply with one sentence and we\'ll point you to the fastest path',
  replyTo: 'info@aiintegrationcourse.com',
  ctaLabel: 'Reply to This Email',
  body: `Reply to this email with one sentence about what you want to do with AI, and we'll point you to the fastest starting path.

— AI Integration Course`,
  html: `
    <p>Reply to this email with one sentence about what you want to do with AI, and we'll point you to the fastest starting path.</p>
    <p>— AI Integration Course</p>
  `,
};

// ── RESCUE LINK EMAIL — Exit Intent / "Send Me My Link" ──────────────────────
export const rescueLinkTemplate: EmailTemplateDefinition = {
  type: 'rescue_link_email',
  campaignId: 'rescue_link_v1_2026',
  templateVersion: 'v1',
  subject: 'Your secure access link',
  previewText: 'Here\'s your link to pick up where you left off',
  replyTo: 'info@aiintegrationcourse.com',
  ctaLabel: 'Pick Up Where You Left Off',
  body: `Here's your link to pick up where you left off:

{{resumeUrl}}

— AI Integration Course`,
  html: `
    <p>Here's your link to pick up where you left off:</p>
    <p><a href="{{resumeUrl}}" style="display:inline-block;padding:12px 20px;background:#10b981;color:#000000;text-decoration:none;border-radius:8px;font-weight:700;">Pick Up Where You Left Off →</a></p>
    <p>— AI Integration Course</p>
  `,
};

// ── TRIAL ENDING SOON (Day 6) — Convert Trial to Paid ────────────────────────
export const trialEndingSoonTemplate: EmailTemplateDefinition = {
  type: 'trial_ending_soon',
  campaignId: 'trial_ending_soon_v1_2026',
  templateVersion: 'v1',
  subject: 'Your trial ends tomorrow — here\'s what happens next',
  previewText: 'Your access continues automatically. Here\'s what you keep.',
  replyTo: 'info@aiintegrationcourse.com',
  ctaLabel: 'Continue My Access',
  body: `Hi {{firstName}},

Your 7-day trial ends tomorrow.

Here's what happens if you do nothing: your access continues automatically at $29.99/month. You keep everything you've built access to.

Here's what happens if you want to save $120/year: upgrade to annual before tomorrow and lock in $19.99/month billed as $239/year.

And here's what happens if it's not for you: cancel before midnight tonight from your account settings. Two clicks. No questions.

Whatever you decide, I want you to make it consciously — not by accident.

If you've gotten value this week, the best move is to keep going. The workflows you're learning compound over time.

Manage your access here:
{{ctaUrl}}

— AI Integration Course`,
  html: `
    <p>Hi {{firstName}},</p>
    <p>Your 7-day trial ends tomorrow.</p>
    <p><strong>Here's what happens if you do nothing:</strong> your access continues automatically at $29.99/month. You keep everything you've built access to.</p>
    <p><strong>Here's what happens if you want to save $120/year:</strong> upgrade to annual before tomorrow and lock in $19.99/month billed as $239/year.</p>
    <p><strong>Here's what happens if it's not for you:</strong> cancel before midnight tonight from your account settings. Two clicks. No questions.</p>
    <p>Whatever you decide, I want you to make it consciously — not by accident.</p>
    <p><a href="{{ctaUrl}}" style="display:inline-block;padding:12px 20px;background:#111827;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;">Manage My Access →</a></p>
    <p>— AI Integration Course</p>
  `,
};

// ── PAYMENT FAILED EMAIL 1 — Immediate ────────────────────────────────────
export const paymentFailedTemplate: EmailTemplateDefinition = {
  type: 'payment_failed_email',
  campaignId: 'payment_failed_email_v1_2026',
  templateVersion: 'v1',
  subject: 'Action needed: your payment didn\'t go through',
  previewText: 'Your access is still active for now. Here\'s how to keep it.',
  replyTo: 'info@aiintegrationcourse.com',
  ctaLabel: 'Update My Payment Method',
  body: `Hi {{firstName}},

We tried to process your {{planName}} payment but it didn't go through.

This happens — expired cards, bank holds, and billing address mismatches are the most common causes.

Your access is still active while we retry. But to make sure you don't lose access, please update your payment method now:
{{ctaUrl}}

It takes less than 2 minutes. And your progress, builds, and access all stay exactly where they are.

If you have questions or want to switch plans, just reply to this email.

— AI Integration Course`,
  html: `
    <p>Hi {{firstName}},</p>
    <p>We tried to process your <strong>{{planName}}</strong> payment but it didn't go through.</p>
    <p>This happens — expired cards, bank holds, and billing address mismatches are the most common causes.</p>
    <p>Your access is still active while we retry. But to make sure you don't lose access, please update your payment method now:</p>
    <p><a href="{{ctaUrl}}" style="display:inline-block;padding:12px 20px;background:#dc2626;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:700;">Update My Payment Method →</a></p>
    <p style="font-size:12px;color:#6b7280;">It takes less than 2 minutes. Your progress and access stay exactly where they are.</p>
    <p>If you have questions or want to switch plans, just reply to this email.</p>
    <p>— AI Integration Course</p>
  `,
};

// ── PAYMENT FAILED EMAIL 2 — 2 days later ─────────────────────────────
export const paymentFailedTemplate2: EmailTemplateDefinition = {
  type: 'payment_failed_email_2',
  campaignId: 'payment_failed_email_2_v1_2026',
  templateVersion: 'v1',
  subject: 'Your access is at risk',
  previewText: 'Your renewal still has not gone through',
  replyTo: 'info@aiintegrationcourse.com',
  ctaLabel: 'Fix My Payment Method',
  body: `Your renewal still has not gone through.

Update your payment method to keep your access active:
{{ctaUrl}}

— AI Integration Course`,
  html: `
    <p>Your renewal still has not gone through.</p>
    <p>Update your payment method to keep your access active:</p>
    <p><a href="{{ctaUrl}}" style="display:inline-block;padding:12px 20px;background:#dc2626;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:700;">Fix My Payment Method →</a></p>
    <p>— AI Integration Course</p>
  `,
};

// ── PAYMENT FAILED EMAIL 3 — 5 days later (Final Warning) ─────────────────
export const paymentFailedTemplate3: EmailTemplateDefinition = {
  type: 'payment_failed_email_3',
  campaignId: 'payment_failed_email_3_v1_2026',
  templateVersion: 'v1',
  subject: 'Final reminder before access is interrupted',
  previewText: 'This is the final reminder to update your payment method',
  replyTo: 'info@aiintegrationcourse.com',
  ctaLabel: 'Update Payment Method',
  body: `This is the final reminder to update your payment method and keep your access active.

{{ctaUrl}}

— AI Integration Course`,
  html: `
    <p>This is the final reminder to update your payment method and keep your access active.</p>
    <p><a href="{{ctaUrl}}" style="display:inline-block;padding:12px 20px;background:#dc2626;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:700;">Update Payment Method →</a></p>
    <p>— AI Integration Course</p>
  `,
};

// ── ANNUAL UPSELL (Day 30 for monthly subscribers) ───────────────────────────
export const annualUpsellTemplate: EmailTemplateDefinition = {
  type: 'annual_upsell_email',
  campaignId: 'annual_upsell_email_v1_2026',
  templateVersion: 'v1',
  subject: 'You\'ve been building for 30 days — here\'s how to save $120',
  previewText: 'Switch to annual and keep the same access for $10/month less.',
  replyTo: 'info@aiintegrationcourse.com',
  ctaLabel: 'Switch to Annual and Save',
  body: `Hi {{firstName}},

You've been a member for 30 days. That means you've already seen what this system can do.

Here's a simple offer: switch to annual billing and save $120 over the next year.

You're currently on the monthly plan at $29.99/month — $359.88/year.
Annual billing is $239/year — that's $19.99/month equivalent.

Same access. Same AI tutor. Same updates. $120 back in your pocket.

If you're planning to keep building with AI (and I think you are), the math is straightforward.

Switch here:
{{ctaUrl}}

If you have any questions about the switch, just reply to this email.

— AI Integration Course`,
  html: `
    <p>Hi {{firstName}},</p>
    <p>You've been a member for 30 days. That means you've already seen what this system can do.</p>
    <p>Here's a simple offer: <strong>switch to annual billing and save $120 over the next year.</strong></p>
    <table style="border-collapse:collapse;width:100%;margin:16px 0;">
      <tr style="background:#f3f4f6;"><td style="padding:10px;font-weight:600;">Monthly plan</td><td style="padding:10px;">$29.99/month → $359.88/year</td></tr>
      <tr><td style="padding:10px;font-weight:600;color:#10b981;">Annual plan</td><td style="padding:10px;color:#10b981;font-weight:600;">$239/year → $19.99/month equivalent</td></tr>
    </table>
    <p>Same access. Same AI tutor. Same updates. <strong>$120 back in your pocket.</strong></p>
    <p><a href="{{ctaUrl}}" style="display:inline-block;padding:12px 20px;background:#10b981;color:#000000;text-decoration:none;border-radius:8px;font-weight:700;">Switch to Annual and Save $120 →</a></p>
    <p>If you have any questions about the switch, just reply to this email.</p>
    <p>— AI Integration Course</p>
  `,
};

export const lifecycleEmailTemplates: Record<LifecycleEmailType, EmailTemplateDefinition> = {
  welcome_email: welcomeEmailTemplate,
  trial_started_email: trialStartedEmailTemplate,
  playbook_delivery: playbookDeliveryTemplate,
  trial_day_3_nudge: trialDay3Template,
  trial_expired_offer: trialExpiredOfferTemplate,
  checkout_abandonment_email: checkoutAbandonmentTemplate,
  checkout_abandonment_email_2: checkoutAbandonmentTemplate2,
  checkout_abandonment_email_3: checkoutAbandonmentTemplate3,
  checkout_abandonment_email_4: checkoutAbandonmentTemplate4,
  checkout_abandonment_email_5: checkoutAbandonmentTemplate5,
  paid_welcome_email: paidWelcomeEmailTemplate,
  trial_ending_soon: trialEndingSoonTemplate,
  trial_day_1_email: trialDay1Template,
  trial_day_5_email: trialDay5Template,
  trial_day_7_email: trialDay7Template,
  trial_concierge_email: trialConciergeTemplate,
  payment_failed_email: paymentFailedTemplate,
  payment_failed_email_2: paymentFailedTemplate2,
  payment_failed_email_3: paymentFailedTemplate3,
  annual_upsell_email: annualUpsellTemplate,
  rescue_link_email: rescueLinkTemplate,
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
