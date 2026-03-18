import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCourses, getUserCourseProgress, getUserProfile, isFoundersLesson, isFreeLesson, isAdminProfile, userHasFounderAccess } from '../firebaseService';
import { Course, Module, Lesson, UserCourseProgress, UserProfile } from '../types/course';
import { useAuth } from '../context/AuthContext';
import CourseSchema from '../components/seo/CourseSchema';

const UNTITLED_TITLE_PATTERN = /^untitled lesson$/i;
const LESSON_PREFIX_PATTERN = /^lesson\s+\d+(\.\d+)?\s*:\s*/i;
const LESSON_NUMBER_PATTERN = /^lesson\s+(\d+(?:\.\d+)?)\s*:/i;

const stripLessonPrefix = (title: string): string => title.replace(LESSON_PREFIX_PATTERN, '').trim();

const hasSubstance = (lesson: Lesson): boolean => {
  const hasDescription = typeof lesson.description === 'string' && lesson.description.trim().length > 0;
  const hasContent = typeof lesson.content === 'string' && lesson.content.trim().length > 0;
  const hasVideo = typeof lesson.videoUrl === 'string' && lesson.videoUrl.trim().length > 0;
  return hasDescription || hasContent || hasVideo;
};

const isPlaceholderOnlyLesson = (lesson: Lesson): boolean => {
  const rawTitle = typeof lesson.title === 'string' ? lesson.title.trim() : '';
  const titleWithoutPrefix = stripLessonPrefix(rawTitle);
  const isUntitled = !titleWithoutPrefix || UNTITLED_TITLE_PATTERN.test(titleWithoutPrefix);
  return isUntitled && !hasSubstance(lesson);
};

const resolveLessonNumber = (lesson: Lesson, fallbackNumber: number): string => {
  const rawTitle = typeof lesson.title === 'string' ? lesson.title.trim() : '';
  const prefixed = rawTitle.match(LESSON_NUMBER_PATTERN);
  if (prefixed?.[1]) return prefixed[1];
  if (Number.isFinite(lesson.order) && lesson.order > 0) return String(lesson.order);
  return String(fallbackNumber);
};

const toDisplayTitle = (lesson: Lesson, lessonNumber: string): string => {
  const rawTitle = typeof lesson.title === 'string' ? lesson.title.trim() : '';
  const titleWithoutPrefix = stripLessonPrefix(rawTitle);
  const isUntitled = !titleWithoutPrefix || UNTITLED_TITLE_PATTERN.test(titleWithoutPrefix);
  const normalizedTitle = isUntitled ? 'Title Coming Soon' : titleWithoutPrefix;
  if (isFoundersLesson(lesson)) {
    return normalizedTitle;
  }
  return `Lesson ${lessonNumber}: ${normalizedTitle}`;
};

type DisplayModule = Module & {
  displayLessons: Array<Lesson & { displayTitle: string }>;
};

const CourseOverviewPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [userProgress, setUserProgress] = useState<UserCourseProgress | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  // Accordion: track which modules are expanded (all open by default)
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  };

  const modulesWithDisplayLessons = useMemo<DisplayModule[]>(() => {
    if (!course) return [];

    const hasFounderVisibility = userHasFounderAccess(userProfile) || isAdminProfile(userProfile);
    let fallbackNumber = 1;

    return [...course.modules]
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((module) => {
        const sortedLessons = [...module.lessons].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        const displayLessons = sortedLessons
          .filter((lesson) => !isPlaceholderOnlyLesson(lesson))
          .filter((lesson) => !isFoundersLesson(lesson) || hasFounderVisibility)
          .map((lesson) => {
            const lessonNumber = resolveLessonNumber(lesson, fallbackNumber);
            if (!isFoundersLesson(lesson)) {
              fallbackNumber += 1;
            }
            return {
              ...lesson,
              displayTitle: toDisplayTitle(lesson, lessonNumber)
            };
          });

        return {
          ...module,
          displayLessons
        };
      })
      .filter((module) => module.displayLessons.length > 0);
  }, [course, userProfile]);

  useEffect(() => {
    const fetchCourseData = async () => {
      setLoading(true);
      setError(null);
      try {
        const courses = await getCourses();
        if (courses && courses.length > 0) {
          const fetchedCourse = courses[0];
          setCourse(fetchedCourse);
          if (currentUser && fetchedCourse.id) {
            const [progress, profile] = await Promise.all([
              fetchUserProgress(fetchedCourse.id),
              getUserProfile(currentUser.uid),
            ]);
            setUserProgress(progress);
            setUserProfile(profile);
          } else {
            setUserProgress(null);
            setUserProfile(null);
          }
        } else {
          setError('No courses available. Please try again later.');
        }
      } catch (err) {
        setError('Error loading course data. Please try again later.');
        console.error('Error fetching courses:', err);
      } finally {
        setLoading(false);
      }
    };

    // Function to fetch user progress
    const fetchUserProgress = async (courseId: string): Promise<UserCourseProgress | null> => {
      if (currentUser && courseId) {
        try {
          // Using the actual courseId from the fetched course
          const progress = await getUserCourseProgress(currentUser.uid, courseId);
          return progress;
        } catch (error) {
          console.error('Error fetching user progress:', error);
          return null;
        }
      }
      return null;
    };

    fetchCourseData();
  }, [currentUser]);

  // When modules load, expand all by default
  React.useEffect(() => {
    if (modulesWithDisplayLessons.length > 0) {
      setExpandedModules(new Set(modulesWithDisplayLessons.map((m) => m.id)));
    }
  }, [modulesWithDisplayLessons.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Function to check if a lesson is completed
  const isLessonCompleted = (lessonId: string): boolean => {
    if (!userProgress || !userProgress.completedLessons) return false;
    return userProgress.completedLessons.includes(lessonId);
  };

  // Function to navigate to the lesson page
  const handleLessonClick = (lesson: Lesson, moduleId: string) => {
    // If the lesson is premium and user is not logged in, navigate to login
    const lessonIsFree = isFreeLesson(lesson);
    if (!lessonIsFree && !currentUser) {
      navigate('/login', { state: { from: `/courses/${course?.id}/modules/${moduleId}/lessons/${lesson.id}` } });
      return;
    }

    // Navigate to the lesson page
    navigate(`/courses/${course?.id}/modules/${moduleId}/lessons/${lesson.id}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full p-8">
        <div className="loader"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex justify-center items-center h-full p-8">
        <div className="text-red-500">Failed to load course data</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      {course && (
        <CourseSchema
          courseName={course.title}
          courseDescription={course.description}
          courseUrl={typeof window !== 'undefined' ? `${window.location.origin}/courses/${course.id}` : undefined}
          providerUrl={typeof window !== 'undefined' ? window.location.origin : undefined}
          modules={course.modules.map((module) => ({
            name: module.title,
            description: module.description
          }))}
        />
      )}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-40">
          <div className="absolute -top-32 left-10 h-80 w-80 rounded-full bg-cyan-500/20 blur-3xl" />
          <div className="absolute top-20 right-0 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 py-14 flex gap-8">

          {/* Sticky Table of Contents sidebar */}
          {modulesWithDisplayLessons.length > 0 && (
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <div className="sticky top-6 rounded-2xl border border-white/10 bg-slate-900/70 backdrop-blur p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300 mb-4">Table of Contents</p>
                <nav className="space-y-1">
                  {modulesWithDisplayLessons.map((module) => (
                    <a
                      key={module.id}
                      href={`#module-${module.id}`}
                      className="block text-sm text-slate-300 hover:text-cyan-300 transition-colors py-1 pl-2 border-l-2 border-transparent hover:border-cyan-400 truncate"
                    >
                      {module.title}
                    </a>
                  ))}
                </nav>
              </div>
            </aside>
          )}

          <div className="flex-1 min-w-0">
          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 md:p-12 shadow-2xl">
            <div className="mb-10">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 text-cyan-200 px-4 py-1 text-xs font-headings font-semibold uppercase tracking-[0.2em]">
                Course Overview
              </div>
              <h1 className="text-4xl md:text-5xl font-headings font-extrabold mt-4 text-white">
                {course.title}
              </h1>
              <p className="text-lg text-slate-200 mt-4 max-w-3xl font-sans">
                {course.description}
              </p>
            </div>

            {/* Lesson dropdown */}
            <div className="mb-10">
              <label className="text-sm uppercase tracking-[0.2em] text-slate-300 font-headings font-semibold">
                Jump to a lesson
              </label>
              <select
                className="mt-3 px-4 py-3 border border-white/10 rounded-xl w-full md:w-2/3 bg-slate-900/70 text-slate-100 shadow-lg focus:outline-none focus:ring-2 focus:ring-cyan-400"
                defaultValue=""
                onChange={(e) => {
                  const value = e.target.value;
                  if (!value) return;
                  const [moduleId, lessonId] = value.split('|');
                  const selectedModule = course.modules.find((m) => m.id === moduleId);
                  const selectedLesson = selectedModule?.lessons.find((l) => l.id === lessonId);
                  if (selectedLesson) {
                    handleLessonClick(selectedLesson, moduleId);
                  }
                }}
              >
                <option value="" className="text-slate-100">Select a lesson</option>
                {modulesWithDisplayLessons.map((module) =>
                  module.displayLessons.map((lesson) => (
                    <option
                      key={`${module.id}|${lesson.id}`}
                      value={`${module.id}|${lesson.id}`}
                      disabled={!isFreeLesson(lesson) && !currentUser}
                      className="text-slate-100"
                    >
                      {module.title} - {lesson.displayTitle} {isFoundersLesson(lesson) ? '(Founders)' : isFreeLesson(lesson) ? '(Free)' : ''}
                    </option>
                  ))
                )}
              </select>
            </div>

            {modulesWithDisplayLessons.map((module: DisplayModule) => {
              const isExpanded = expandedModules.has(module.id);
              return (
              <div key={module.id} id={`module-${module.id}`} className="mb-6 w-[98%] mx-auto border border-white/10 rounded-2xl bg-white/5 shadow-xl overflow-hidden">
                {/* Accordion Header */}
                <button
                  type="button"
                  onClick={() => toggleModule(module.id)}
                  className="w-full flex items-center justify-between gap-4 p-6 md:p-8 text-left hover:bg-white/5 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h2 className="text-xl font-headings font-semibold text-white">{module.title}</h2>
                      <span className="text-xs uppercase tracking-[0.2em] text-slate-400 font-headings flex-shrink-0">
                        Module {module.order}
                      </span>
                      <span className="text-xs text-slate-400 flex-shrink-0">
                        {module.displayLessons.length} lesson{module.displayLessons.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    {module.description && (
                      <p className="text-slate-400 text-sm mt-1 font-sans truncate">{module.description}</p>
                    )}
                  </div>
                  <svg
                    className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Accordion Body */}
                {isExpanded && (
                <div className="px-6 md:px-8 pb-6 md:pb-8">
                <ul className="space-y-3">
                  {module.displayLessons.map((lesson) => {
                    const lessonIsFree = isFreeLesson(lesson);
                    const foundersLesson = isFoundersLesson(lesson);
                    
                    return (
                    <li 
                      key={lesson.id} 
                      onClick={() => handleLessonClick(lesson, module.id)}
                      className={`w-[98%] mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-4 rounded-xl transition-all duration-200 ease-in-out cursor-pointer 
                                  ${(!lessonIsFree && (!currentUser)) 
                                    ? 'bg-white/5 text-slate-300 hover:bg-white/10'
                                    : 'bg-gradient-to-r from-cyan-500/10 to-indigo-500/10 hover:from-cyan-500/20 hover:to-indigo-500/20 text-white'}
                                  ${lessonIsFree ? 'border border-emerald-400/30' : foundersLesson ? 'border border-amber-400/30' : 'border border-white/10'}
                                  ${isLessonCompleted(lesson.id) ? 'opacity-70' : ''}
                                `}
                    >
                      <div className="flex items-center">
                        <span className="mr-3 text-cyan-300">
                          {isLessonCompleted(lesson.id) ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}
                        </span>
                        <span className={`font-headings font-semibold tracking-[0.01em] ${isLessonCompleted(lesson.id) ? 'line-through text-slate-300' : ''}`}>
                          {lesson.displayTitle}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        {lessonIsFree && (
                          <span className="text-xs bg-emerald-400/20 text-emerald-200 px-2 py-1 rounded-full font-sans">Free</span>
                        )}
                        {foundersLesson && (
                          <span className="text-xs bg-amber-400/20 text-amber-100 px-2 py-1 rounded-full font-sans">Founders</span>
                        )}
                        {(!lessonIsFree && !foundersLesson && (!currentUser)) && (
                          <span className="text-xs bg-amber-400/20 text-amber-200 px-2 py-1 rounded-full font-sans">Premium</span>
                        )}
                        <span className="text-slate-300 text-sm font-sans">
                          {(!lessonIsFree && (!currentUser)) ? 'Login to access' : foundersLesson ? 'Open founders lesson' : 'View Lesson'}
                        </span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </li>
                  );
                  })}
                </ul>
                </div>
                )}{/* end accordion body */}
              </div>
              );
            })}
          </div>
          {error && course && (
            <div className="mt-6 text-center text-amber-200 bg-amber-500/10 border border-amber-400/20 p-4 rounded-xl">
              {error}
            </div>
          )}
          </div>{/* end flex-1 main content */}
        </div>
      </div>
    </div>
  );
};

export default CourseOverviewPage;
