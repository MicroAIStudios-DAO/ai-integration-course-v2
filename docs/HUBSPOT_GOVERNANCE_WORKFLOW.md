# HubSpot Governance Score Workflow Configuration

This document describes the HubSpot Workflows required to automate student segmentation and upselling based on their Governance Lab performance.

## Custom Properties to Create in HubSpot

Before configuring workflows, create these custom contact properties in HubSpot CRM Settings:

| Property Name | Internal Name | Type | Description |
|---|---|---|---|
| Governance Score | `governance_score` | Number | Average CQS score across all attestation attempts (0-100) |
| Governance Lab Status | `governance_lab_status` | Single-line text | Enum: `in_progress`, `high_performer`, `advanced_track`, `certification_ready` |
| Labs Completed | `labs_completed` | Number | Count of labs passed (CQS >= 90) |
| Highest CQS Score | `highest_cqs_score` | Number | Peak CQS score achieved |
| Certification Eligible | `certification_eligible` | Boolean | True when labs >= 4 AND highest CQS >= 95 |

## Workflow 1: Advanced Track Invitation

**Trigger:** Contact property `governance_lab_status` is equal to `high_performer` OR `advanced_track`.

**Actions:**

1. **Delay:** 1 hour (allow for multiple rapid lab completions to settle).
2. **Send Email:** "You're Ready for the Advanced Track" template.
   - Subject: "Your governance skills are exceptional — unlock the next level"
   - Body: Congratulate on score, preview advanced modules, CTA to upgrade.
   - Sender: `info@aiintegrationcourse.com`
3. **Update Property:** Set `hs_lead_status` to `OPEN_DEAL`.
4. **Create Task:** Assign to sales team for personal outreach if `governance_score > 95`.

## Workflow 2: Certification Ready Notification

**Trigger:** Contact property `certification_eligible` is equal to `true`.

**Actions:**

1. **Send Email:** "Your Authentic AI Agent Certification Awaits" template.
   - Subject: "Congratulations — you've earned your certification"
   - Body: Link to capstone lab, explain blockchain-backed credential, LinkedIn badge preview.
   - Sender: `info@aiintegrationcourse.com`
2. **Add to List:** "Certification Candidates" static list.
3. **Internal Notification:** Notify admin of new certification candidate.

## Workflow 3: Frustration Recovery (Low Scores)

**Trigger:** Contact property `governance_score` is less than 50 AND `labs_completed` is equal to 0.

**Enrollment Criteria:** Contact has been in system for at least 7 days.

**Actions:**

1. **Delay:** 24 hours.
2. **Send Email:** "Need help with the Governance Labs?" template.
   - Subject: "Let's get you unstuck — here's a quick-start guide"
   - Body: Link to office hours, Flowise tutorial video, AI Tutor prompt suggestions.
   - Sender: `info@aiintegrationcourse.com`
3. **If/Then Branch:** If no lab completion within 7 days after email:
   - Send follow-up with 1-on-1 mentorship offer.

## Workflow 4: Enterprise Lead Identification

**Trigger:** Contact property `governance_score` is greater than 90 AND email domain is NOT in common free email providers list (gmail.com, yahoo.com, hotmail.com, etc.).

**Actions:**

1. **Update Property:** Set `lifecyclestage` to `salesqualifiedlead`.
2. **Create Deal:** "Enterprise AI Governance Training" pipeline.
3. **Internal Notification:** Alert sales team of potential enterprise lead.
4. **Send Email:** "AI Governance for Your Organization" template.
   - Subject: "Bring AI governance training to your team"
   - Body: Enterprise pricing, team licensing, custom compliance modules.

## Implementation Notes

The `onAttestationCreated` Firestore trigger in `functions/src/hubspotSync.ts` automatically syncs these properties every time a student completes a ProofGuard attestation. No manual intervention is required.

The segmentation logic is:
- `in_progress`: Default state, fewer than 2 labs passed
- `high_performer`: Highest CQS >= 90 but fewer than 2 labs passed
- `advanced_track`: 2+ labs passed
- `certification_ready`: 4+ labs passed (all core labs complete)
