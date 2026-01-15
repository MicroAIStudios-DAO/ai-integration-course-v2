import { collection, getDocs, doc, getDoc, setDoc, updateDoc, query, orderBy } from 'firebase/firestore';
import { ref, getDownloadURL } from 'firebase/storage';
import { db, app } from './firebase'; // Import from centralized firebase config
import { getStorage } from 'firebase/storage';
import { Course, Module, Lesson, UserProfile, UserCourseProgress } from './types/course';
import { User } from 'firebase/auth';

// Initialize Firebase Storage
const storage = getStorage(app);

// --- Course & Lesson Data --- //

export const getCourses = async (): Promise<Course[]> => {
  const coursesCol = collection(db, 'courses');
  // Add orderBy if you have an 'order' field in your courses collection
  const courseSnapshot = await getDocs(query(coursesCol, orderBy('title'))); // Assuming courses also have an order or title to sort by
  const coursesList = courseSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course));
  
  // For each course, fetch its modules
  for (const course of coursesList) {
    const modulesCol = collection(db, `courses/${course.id}/modules`);
    const moduleSnapshot = await getDocs(query(modulesCol, orderBy('order')));
    course.modules = moduleSnapshot.docs.map(modDoc => ({ id: modDoc.id, ...modDoc.data() } as Module));

    // For each module, fetch its lessons
    for (const module of course.modules) {
      const lessonsCol = collection(db, `courses/${course.id}/modules/${module.id}/lessons`);
      const lessonSnapshot = await getDocs(query(lessonsCol, orderBy('order')));
      module.lessons = lessonSnapshot.docs.map(lessDoc => {
        const raw = { id: lessDoc.id, ...lessDoc.data() } as any;
        // Normalize: map Firestore 'tier' to isFree flag expected by UI
        const isFree = (raw.tier === 'free') || !!raw.isFree;
        return { ...raw, isFree } as Lesson;
      });
    }
  }
  return coursesList;
};

export const getCourseById = async (courseId: string): Promise<Course | null> => {
  const courseRef = doc(db, 'courses', courseId);
  const courseSnap = await getDoc(courseRef);

  if (!courseSnap.exists()) {
    console.log('No such course!');
    return null;
  }
  const courseData = { id: courseSnap.id, ...courseSnap.data() } as Course;

  // Fetch modules
  const modulesCol = collection(db, `courses/${courseId}/modules`);
  const moduleSnapshot = await getDocs(query(modulesCol, orderBy('order')));
  courseData.modules = moduleSnapshot.docs.map(modDoc => ({ id: modDoc.id, ...modDoc.data() } as Module));

  // For each module, fetch its lessons
  for (const module of courseData.modules) {
    const lessonsCol = collection(db, `courses/${courseId}/modules/${module.id}/lessons`);
    const lessonSnapshot = await getDocs(query(lessonsCol, orderBy('order')));
    module.lessons = lessonSnapshot.docs.map(lessDoc => {
      const raw = { id: lessDoc.id, ...lessDoc.data() } as any;
      const isFree = (raw.tier === 'free') || !!raw.isFree;
      return { ...raw, isFree } as Lesson;
    });
  }
  return courseData;
};

export const getLessonMarkdownUrl = async (storagePath: string): Promise<string> => {
  try {
    const markdownRef = ref(storage, storagePath);
    const url = await getDownloadURL(markdownRef);
    return url;
  } catch (error) {
    console.error("Error getting markdown URL:", error);
    throw error;
  }
};

// --- User Profile & Progress --- //

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) {
    return { ...userSnap.data() } as UserProfile;
  }
  return null;
};

export const createUserProfile = async (user: User, additionalData?: Partial<UserProfile>): Promise<void> => {
  const userRef = doc(db, 'users', user.uid);
  const profileData: UserProfile = {
    email: user.email || undefined,
    displayName: user.displayName || undefined,
    photoURL: user.photoURL || undefined,
    isSubscribed: false, // Default value
    activeTrial: false, // Default value
    ...additionalData,
  };
  await setDoc(userRef, profileData, { merge: true });
};

export const getUserCourseProgress = async (userId: string, courseId: string): Promise<UserCourseProgress | null> => {
  const progressRef = doc(db, `users/${userId}/progress`, courseId);
  const progressSnap = await getDoc(progressRef);
  if (progressSnap.exists()) {
    return { ...progressSnap.data() } as UserCourseProgress;
  }
  return null;
};

export const markLessonAsComplete = async (userId: string, courseId: string, lessonId: string): Promise<void> => {
  const progressRef = doc(db, `users/${userId}/progress`, courseId);
  const progressSnap = await getDoc(progressRef);

  if (progressSnap.exists()) {
    const existing = progressSnap.data() as UserCourseProgress;
    const set = new Set([...(existing.completedLessons||[]), lessonId]);
    const completedLessons = Array.from(set);
    // Recalculate overall progress if we can infer total lessons from prior fetch (optional)
    const overallProgressPercent = existing.overallProgressPercent || undefined; // leave unchanged here
    await updateDoc(progressRef, {
      completedLessons,
      lastAccessedLessonId: lessonId,
      ...(overallProgressPercent !== undefined ? { overallProgressPercent } : {})
    });
  } else {
    await setDoc(progressRef, {
      courseId: courseId,
      completedLessons: [lessonId],
      lastAccessedLessonId: lessonId,
      overallProgressPercent: undefined
    });
  }
};

// Helper to update user subscription status (simplified for now)
export const updateUserSubscriptionStatus = async (userId: string, isSubscribed: boolean, activeTrial?: boolean, trialEndDate?: Date) => {
    const userRef = doc(db, 'users', userId);
    const updateData: Partial<UserProfile> = { isSubscribed };
    if (activeTrial !== undefined) updateData.activeTrial = activeTrial;
    if (trialEndDate !== undefined) updateData.trialEndDate = trialEndDate;
    await updateDoc(userRef, updateData);
};

// --- Admin User Management --- //

export const createAdminUserProfile = async (user: User): Promise<void> => {
  const userRef = doc(db, 'users', user.uid);
  const adminProfileData: UserProfile = {
    email: user.email || undefined,
    displayName: user.displayName || undefined,
    photoURL: user.photoURL || undefined,
    isSubscribed: true, // Admin has full access
    activeTrial: false,
    isAdmin: true, // Admin flag
    role: 'admin', // Admin role
  };
  await setDoc(userRef, adminProfileData, { merge: true });
  console.log('Admin user profile created for:', user.email);
};

export const isUserAdmin = async (userId: string): Promise<boolean> => {
  const userProfile = await getUserProfile(userId);
  return userProfile?.isAdmin === true || userProfile?.role === 'admin';
};

export { db, storage }; // Export db and storage if needed directly elsewhere
