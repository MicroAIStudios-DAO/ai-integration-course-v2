export interface Lesson {
  id: string; // Document ID in Firestore
  title: string;
  order: number;
  isFree: boolean;
  tier?: string; // 'free', 'premium', or 'founders' - alternative to isFree boolean
  storagePath?: string; // Path to Markdown file in Firebase Storage (optional)
  content?: string; // Direct lesson content in markdown format (alternative to storagePath)
  videoUrl?: string;
  durationMinutes?: number;
  description?: string; // Short description or learning objectives
  // Potentially other metadata like short description or learning objectives
}

export interface Module {
  id: string; // Document ID in Firestore
  title: string;
  description: string;
  order: number;
  lessons: Lesson[]; // In Firestore, this would be a subcollection. For frontend type, it can be an array after fetching.
}

export interface Course {
  id: string; // Document ID in Firestore
  title: string;
  description: string;
  // instructor?: string;
  // coverImageUrl?: string;
  modules: Module[]; // In Firestore, this would be a subcollection. For frontend type, it can be an array after fetching.
}

// User Progress Types
export interface UserCourseProgress {
  courseId: string; // Corresponds to Course.id
  completedLessons: string[]; // Array of Lesson.id
  lastAccessedLessonId?: string;
  overallProgressPercent?: number;
  // lastAccessedTimestamp?: firebase.firestore.Timestamp; // If using Firestore timestamps
}

// For user document in Firestore (under users/{uid})
export interface UserProfile {
  displayName?: string;
  email?: string;
  photoURL?: string;
  premium?: boolean;
  foundingMember?: boolean;
  subscriptionStatus?:
    | 'active'
    | 'trialing'
    | 'past_due'
    | 'canceled'
    | 'cancelled'
    | 'unpaid'
    | 'incomplete'
    | 'incomplete_expired'
    | 'none';
  trialEndsAt?: Date | { toDate?: () => Date } | string | null;
  trialEndDate?: Date | { toDate?: () => Date } | string | null;
  isSubscribed?: boolean;
  activeTrial?: boolean;
  isBetaTester?: boolean;
  betaCohort?: string;
  betaAccessCode?: string;
  betaAccessSource?: string;
  betaProgramStatus?: 'awaiting_checkout' | 'checkout_started' | 'active' | 'cancelled';
  betaPlanKey?: 'beta_monthly' | 'pro_monthly' | 'pro_annual';
  betaPriceCents?: number;
  scholarshipAccessCode?: string;
  scholarshipAccessSource?: string;
  scholarshipGrantedAt?: Date | { toDate?: () => Date } | string | null;
  // Admin role fields for testing and administration
  isAdmin?: boolean; // Simple admin flag
  role?: 'user' | 'admin' | 'moderator'; // Role-based access control
}
