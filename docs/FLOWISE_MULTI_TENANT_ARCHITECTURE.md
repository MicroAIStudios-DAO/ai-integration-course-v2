# Flowise Multi-Tenant Architecture

This document outlines how AIIntegrationCourse.com provides isolated Flowise workspaces for each student during the Governance Labs.

## The Problem
Flowise is inherently a single-tenant application. If multiple students access the same Flowise instance, they will see and potentially overwrite each other's agent workflows.

## The Solution: Automated Template Cloning
We use a Firebase Cloud Function (`provisionFlowiseWorkspace`) to act as a multi-tenant bridge.

### 1. The Base Template
For each lab, the course administrator creates a "Base Template" in Flowise. This is the starting point for the lab (e.g., a blank canvas with a few pre-configured nodes, or a partially broken agent the student must fix).
The ID of this base template is saved in the Firestore `labs/{labId}` document under the `flowiseTemplateId` field.

### 2. Just-In-Time Provisioning
When a student navigates to a Governance Lab (`/lab/:labId`):
1. The frontend checks if the student already has a workspace for this lab.
2. If not, it calls the `provisionFlowiseWorkspace` Firebase Function.
3. The function uses the Flowise API to clone the Base Template.
4. The clone is renamed to `Student {uid} - Lab {labId}`.
5. The new `chatflowId` is saved in Firestore at `users/{userId}/workspaces/{labId}`.

### 3. The Iframe Embed
The `GovernanceLab.tsx` component embeds the Flowise UI via an iframe. Instead of pointing to the general Flowise canvas, it points directly to the student's specific cloned `chatflowId`:
`https://flowise.aiintegrationcourse.com/canvas/{studentChatflowId}`

### 4. Security & Cleanup
- The Flowise instance is deployed behind an API gateway that restricts access.
- Students cannot access the Flowise dashboard or see other students' chatflows; they can only access the specific canvas ID loaded in their iframe.
- A scheduled cron job (to be implemented) will periodically clean up inactive chatflows older than 30 days to save database space on the Flowise server.

## Environment Variables
The following environment variables must be set in the Firebase Functions environment:
- `FLOWISE_API_URL`: The base URL of the Flowise API (e.g., `https://flowise.aiintegrationcourse.com/api/v1`)
- `FLOWISE_API_KEY`: A generated API key from the Flowise dashboard with permissions to clone chatflows.
