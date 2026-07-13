/**
 * Shared lesson/content access-control model.
 *
 * Single source of truth for "who may read which lesson" across all Cloud
 * Functions (AI tutor, MCP server, and any future content-serving endpoint).
 * Mirrors the entitlement semantics enforced client-side by usePremiumAccess
 * and in firestore.rules: founding member OR premium OR active subscription
 * OR valid trial window; admins bypass; `founders`-tier lessons additionally
 * require founder/beta standing.
 */

export type LessonMetadata = {
  title?: string;
  description?: string;
  learningObjectives?: unknown[];
  content?: string;
  md?: string;
  html?: string;
  storagePath?: string;
  tier?: string;
  isFree?: boolean;
};

export type UserAccessProfile = {
  premium?: boolean;
  foundingMember?: boolean;
  isBetaTester?: boolean;
  subscriptionStatus?: string;
  trialEndsAt?: FirebaseFirestore.Timestamp | Date | string | null;
  trialEndDate?: FirebaseFirestore.Timestamp | Date | string | null;
  isAdmin?: boolean;
  role?: string;
};

export function toDate(value: UserAccessProfile['trialEndsAt'] | UserAccessProfile['trialEndDate']): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof (value as any)?.toDate === 'function') return (value as any).toDate();
  if (typeof value === 'string') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

export function isFreeLessonData(lesson: LessonMetadata | null | undefined): boolean {
  return lesson?.tier === 'free' || lesson?.isFree === true;
}

export function isFoundersLessonData(lesson: LessonMetadata | null | undefined): boolean {
  return lesson?.tier === 'founders';
}

export function isAdminProfile(profile: UserAccessProfile | null | undefined): boolean {
  return profile?.isAdmin === true || profile?.role === 'admin';
}

export function userHasPaidAccess(profile: UserAccessProfile | null | undefined): boolean {
  if (!profile) return false;
  if (profile.foundingMember === true) return true;
  if (profile.premium === true) return true;
  if (profile.subscriptionStatus === 'active') return true;

  const trialEndsAt = toDate(profile.trialEndsAt) || toDate(profile.trialEndDate);
  if (profile.subscriptionStatus === 'trialing') {
    return !!trialEndsAt && trialEndsAt > new Date();
  }

  return false;
}

export function userHasFounderAccess(profile: UserAccessProfile | null | undefined): boolean {
  if (!profile) return false;
  if (profile.foundingMember === true) return true;
  return profile.isBetaTester === true && userHasPaidAccess(profile);
}

export function canAccessLesson(lesson: LessonMetadata | null | undefined, profile: UserAccessProfile | null | undefined): boolean {
  if (isFreeLessonData(lesson)) return true;
  if (isAdminProfile(profile)) return true;
  if (isFoundersLessonData(lesson)) return userHasFounderAccess(profile);
  return userHasPaidAccess(profile);
}
