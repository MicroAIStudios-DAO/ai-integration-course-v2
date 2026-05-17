# Discord Community Setup Guide
## AI Integration Course — Founding Cohort Server

This document explains how to create the Discord server, configure it for the course community, and activate the in-app "Join #Founding-Cohort on Discord" button.

---

## Step 1: Create the Discord Server

1. Open [discord.com](https://discord.com) and log in (or create an account at `info@aiintegrationcourse.com`).
2. Click the **+** icon in the left sidebar → **Create My Own** → **For a club or community**.
3. Name it: `AI Integration Course — Founding Cohort`
4. Upload the course logo as the server icon.

---

## Step 2: Configure Channels

Create the following channels in this order:

| Channel Name | Type | Purpose |
| :--- | :--- | :--- |
| `#welcome` | Text | Auto-pinned intro message, rules, and course link |
| `#introductions` | Text | Members introduce themselves and their AI goals |
| `#founding-cohort` | Text | Exclusive paid-member discussion |
| `#prompt-sharing` | Text | Share and iterate on AI prompts from lessons |
| `#wins-and-breakthroughs` | Text | Social proof engine — members share results |
| `#ask-the-ai-tutor` | Text | Questions for the AI Tutor feature |
| `#announcements` | Text (read-only) | Course updates, new lessons, live build logs |
| `#live-build-log` | Text | Thursday 10am PST session notes and recordings |

---

## Step 3: Set Up Roles

Create these roles (Settings → Roles):

| Role Name | Color | Who Gets It |
| :--- | :--- | :--- |
| `Founding Member` | Gold | Users with `foundingMember: true` in Firestore |
| `Pioneer` | Cyan | Beta testers |
| `Student` | White | All verified paying members |

---

## Step 4: Create the Invite Link

1. Right-click the `#welcome` channel → **Invite People**.
2. Set expiry to **Never** and max uses to **No limit**.
3. Copy the invite link (format: `https://discord.gg/XXXXXXXXX`).

---

## Step 5: Activate the In-App Button

The `WelcomePage.tsx` already reads from the `VITE_FOUNDING_DISCORD_URL` environment variable. Once you have the invite link, add it to your Firebase Hosting environment:

**Option A — Firebase Hosting (Recommended for production):**
```bash
# In firebase.json hosting config, add to the environment section:
# "VITE_FOUNDING_DISCORD_URL": "https://discord.gg/XXXXXXXXX"
# Then redeploy:
firebase deploy --only hosting
```

**Option B — Local `.env.local` (for testing):**
```bash
# In /home/ubuntu/ai-integration-course-v2/.env.local:
VITE_FOUNDING_DISCORD_URL=https://discord.gg/XXXXXXXXX
```

Once the variable is set, the "Discord Link Posting Soon" placeholder on the WelcomePage will automatically become a live "Join #Founding-Cohort on Discord" button.

---

## Step 6: Referral Growth Loop (Recommended)

To activate the referral loop described in the Gemini revenue strategy:

1. Install the **[Invite Tracker](https://invite-tracker.com/)** bot (free) to track who invited whom.
2. Set up a reward: members who bring in 3 paying students get 1 month free (handled manually via Firestore `foundingMember: true` toggle or a Stripe coupon).
3. Pin a referral message in `#welcome` with the member's personal referral link (can be implemented as a Firebase Dynamic Link tied to their UID).

---

## Estimated Setup Time

| Task | Time |
| :--- | :--- |
| Create server + channels | 15 min |
| Configure roles | 10 min |
| Create invite link + add env var | 5 min |
| Deploy to production | 5 min |
| **Total** | **~35 minutes** |
