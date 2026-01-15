#!/usr/bin/env node
/*
  Stripe verification script (PLAN-safe): checks presence of required env vars
  and connectivity to Stripe API if key is present. Does not create or mutate objects.
*/
const fs = require('fs');
const path = require('path');

function sourceHomeEnv() {
  try {
    const p = path.join(process.env.HOME || '', 'Desktop', 'env1.txt');
    if (!fs.existsSync(p)) return;
    const lines = fs.readFileSync(p, 'utf-8').split(/\r?\n/);
    for (const line of lines) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  } catch {}
}
sourceHomeEnv();

const required = [
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_PRICE_ID',
  // optional: 'STRIPE_FREE_TRIAL_DAYS'
];

const missing = required.filter(k => !process.env[k]);
if (missing.length) {
  console.log('Missing Stripe env vars:', missing.join(', '));
  process.exit(0);
}

// If the key is present, do a lightweight API version check
(async () => {
  try {
    const key = process.env.STRIPE_SECRET_KEY;
    const r = await fetch('https://api.stripe.com/v1/products?limit=1', {
      headers: { Authorization: `Bearer ${key}` }
    });
    console.log('Stripe connectivity:', r.status, r.ok ? 'OK' : 'FAILED');
  } catch (e) {
    console.log('Stripe connectivity: ERROR');
  }
})();

