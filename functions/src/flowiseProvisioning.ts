/**
 * flowiseProvisioning.ts
 *
 * Handles multi-tenant provisioning of Flowise workspaces for students.
 * When a student accesses a Governance Lab, this function ensures they have
 * an isolated workspace, cloning the base lab template if necessary.
 */

import * as functions from 'firebase-functions/v2';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// Environment variables for Flowise API
const FLOWISE_API_URL = process.env.FLOWISE_API_URL || 'https://flowise.aiintegrationcourse.com/api/v1';
const FLOWISE_API_KEY = process.env.FLOWISE_API_KEY;

interface ProvisionRequest {
  labId: string;
}

export const provisionFlowiseWorkspace = functions.https.onCall(async (request) => {
  // 1. Authentication Check
  if (!request.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'You must be logged in to provision a workspace.'
    );
  }

  const userId = request.auth.uid;
  const { labId } = request.data as ProvisionRequest;

  if (!labId) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'labId is required to provision a workspace.'
    );
  }

  if (!FLOWISE_API_KEY) {
    console.error('FLOWISE_API_KEY is not configured.');
    throw new functions.https.HttpsError(
      'internal',
      'Flowise integration is not properly configured.'
    );
  }

  try {
    // 2. Check if workspace already exists
    const workspaceRef = db.collection('users').doc(userId).collection('workspaces').doc(labId);
    const workspaceDoc = await workspaceRef.get();

    if (workspaceDoc.exists) {
      return {
        status: 'existing',
        flowiseChatflowId: workspaceDoc.data()?.flowiseChatflowId,
      };
    }

    // 3. Get Lab Template Configuration
    const labDoc = await db.collection('labs').doc(labId).get();
    if (!labDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Lab configuration not found.');
    }

    const labData = labDoc.data();
    const templateId = labData?.flowiseTemplateId;

    if (!templateId) {
      throw new functions.https.HttpsError('failed-precondition', 'Lab does not have a base template configured.');
    }

    // 4. Provision in Flowise (Clone Template)
    // We call the Flowise API to duplicate the template for this specific user
    const flowiseResponse = await fetch(`${FLOWISE_API_URL}/chatflows/${templateId}/clone`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FLOWISE_API_KEY}`,
      },
      body: JSON.stringify({
        name: `Student ${userId.slice(0, 6)} - Lab ${labId}`,
      }),
    });

    if (!flowiseResponse.ok) {
      const errorText = await flowiseResponse.text();
      console.error(`Flowise API Error: ${flowiseResponse.status} ${errorText}`);
      throw new functions.https.HttpsError('internal', 'Failed to provision workspace in Flowise.');
    }

    const newChatflow = await flowiseResponse.json();
    const newChatflowId = newChatflow.id || newChatflow.chatflowId;

    // 5. Save Workspace Mapping in Firestore
    await workspaceRef.set({
      labId,
      flowiseChatflowId: newChatflowId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'active',
    });

    return {
      status: 'created',
      flowiseChatflowId: newChatflowId,
    };

  } catch (error: any) {
    console.error('Error provisioning Flowise workspace:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', 'An unexpected error occurred during provisioning.');
  }
});
