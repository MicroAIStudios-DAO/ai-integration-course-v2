#!/usr/bin/env node
const { GoogleAuth } = require('google-auth-library');

async function enableComputeAndCheck(){
  const PROJECT_ID = 'ai-integra-course-v2';
  const PROJECT_NUMBER = '241195884047';
  const COMPUTE_SA_EMAIL = `${PROJECT_NUMBER}-compute@developer.gserviceaccount.com`;

  const auth = new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/cloud-platform'] });
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  const bearer = typeof token === 'string' ? token : (token && token.token) || '';
  if (!bearer) throw new Error('Failed to obtain access token from ADC');

  const headers = { 'Authorization': `Bearer ${bearer}`, 'Content-Type': 'application/json' };
  const fetchResp = async (url, init) => {
    const res = await fetch(url, init);
    const text = await res.text().catch(()=> '');
    return { ok: res.ok, status: res.status, text };
  };

  // Enable Compute Engine API
  const enableUrl = `https://serviceusage.googleapis.com/v1/projects/${PROJECT_NUMBER}/services/compute.googleapis.com:enable`;
  const en = await fetchResp(enableUrl, { method: 'POST', headers });
  if (!en.ok && en.status !== 409) { // 409 means already enabled
    throw new Error(`Enable compute API failed (${en.status}): ${en.text}`);
  }
  console.log('Requested enable for compute.googleapis.com');

  // Poll IAM for default compute service account to appear
  const getUrl = `https://iam.googleapis.com/v1/projects/${PROJECT_ID}/serviceAccounts/${COMPUTE_SA_EMAIL}`;
  for (let i=0;i<10;i++){
    const g = await fetchResp(getUrl, { method: 'GET', headers });
    if (g.ok) { console.log('Compute default service account is present.'); return; }
    console.log(`Waiting for compute default SA to be created (attempt ${i+1}/10)...`);
    await new Promise(r=>setTimeout(r, 5000));
  }
  throw new Error('Compute default service account not found after waiting.');
}

enableComputeAndCheck().catch(e=>{ console.error(e?.message || e); process.exit(1); });

