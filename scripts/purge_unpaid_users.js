#!/usr/bin/env node
/* eslint-disable no-console */
const admin = require("firebase-admin");
const Stripe = require("stripe");

const args = process.argv.slice(2);
const isDryRun = !args.includes("--confirm");

const stripeSecret =
  process.env.STRIPE_SECRET ||
  process.env.STRIPE_SECRET_KEY ||
  process.env.STRIPE_API_KEY;

if (!stripeSecret) {
  console.error(
    "Missing Stripe secret. Set STRIPE_SECRET (recommended) or STRIPE_SECRET_KEY/STRIPE_API_KEY."
  );
  process.exit(1);
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

const stripe = new Stripe(stripeSecret, { apiVersion: "2024-06-20" });
const auth = admin.auth();

async function fetchPaidUids() {
  const paidUids = new Set();
  let missingMetadata = 0;

  await stripe.checkout.sessions
    .list({ payment_status: "paid", limit: 100 })
    .autoPagingEach((session) => {
      const uid = session?.metadata?.uid;
      if (uid) {
        paidUids.add(uid);
      } else {
        missingMetadata += 1;
      }
      return true;
    });

  return { paidUids, missingMetadata };
}

async function listAllAuthUsers() {
  const users = [];
  let nextPageToken;
  do {
    const result = await auth.listUsers(1000, nextPageToken);
    users.push(...result.users);
    nextPageToken = result.pageToken;
  } while (nextPageToken);
  return users;
}

async function deleteUsers(uids) {
  const chunkSize = 1000;
  for (let i = 0; i < uids.length; i += chunkSize) {
    const chunk = uids.slice(i, i + chunkSize);
    const result = await auth.deleteUsers(chunk);
    if (result.failureCount > 0) {
      result.errors.forEach((err) => {
        console.warn(`Failed to delete ${err.index}: ${err.error?.message || err.error}`);
      });
    }
    console.log(
      `Deleted ${result.successCount} users (failed: ${result.failureCount}) in batch ${i / chunkSize + 1}`
    );
  }
}

async function main() {
  console.log(isDryRun ? "DRY RUN: No users will be deleted." : "LIVE RUN: Deleting users.");

  console.log("Fetching paid Stripe checkout sessions...");
  const { paidUids, missingMetadata } = await fetchPaidUids();
  console.log(`Paid UIDs found: ${paidUids.size}`);
  if (missingMetadata > 0) {
    console.log(`Sessions missing metadata.uid: ${missingMetadata}`);
  }

  console.log("Listing Firebase Auth users...");
  const users = await listAllAuthUsers();
  console.log(`Total Firebase Auth users: ${users.length}`);

  const unpaidUsers = users.filter((user) => !paidUids.has(user.uid));
  console.log(`Unpaid users to remove: ${unpaidUsers.length}`);

  if (isDryRun) {
    unpaidUsers.slice(0, 25).forEach((user) => {
      console.log(`- ${user.uid} ${user.email || "(no email)"}`);
    });
    if (unpaidUsers.length > 25) {
      console.log(`...and ${unpaidUsers.length - 25} more`);
    }
    console.log("Dry run complete. Re-run with --confirm to delete.");
    return;
  }

  const uidsToDelete = unpaidUsers.map((user) => user.uid);
  await deleteUsers(uidsToDelete);
  console.log("Deletion complete.");
}

main().catch((err) => {
  console.error("Failed to purge unpaid users:", err);
  process.exit(1);
});
