import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCourses, getUserCourseProgress } from '../firebaseService';
import { Course, Module, Lesson, UserCourseProgress } from '../types/course';
import { useAuth } from '../context/AuthContext';
import CourseSchema from '../components/seo/CourseSchema';

const UNTITLED_TITLE_PATTERN = /^untitled lesson$/i;
const LESSON_PREFIX_PATTERN = /^lesson\s+\d+(\.\d+)?\s*:/i;

const getLessonTitle = (lesson: Lesson, fallbackOrder: number): string => {
  const rawTitle = typeof lesson.title === 'string' ? lesson.title.trim() : '';
  if (!rawTitle || UNTITLED_TITLE_PATTERN.test(rawTitle)) {
    return '';
  }

  if (LESSON_PREFIX_PATTERN.test(rawTitle)) {
    return rawTitle;
  }

  const order = Number.isFinite(lesson.order) ? lesson.order : fallbackOrder;
  return `Lesson ${order}: ${rawTitle}`;
};

const hasYoutubeVideo = (lesson: Lesson): boolean => {
  return typeof lesson.videoUrl === 'string' && lesson.videoUrl.trim().length > 0;
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

  const modulesWithDisplayLessons = useMemo<DisplayModule[]>(() => {
    if (!course) return [];

    return [...course.modules]
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((module) => {
        const sortedLessons = [...module.lessons].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        const displayLessons = sortedLessons
          .map((lesson, index) => ({
            ...lesson,
            displayTitle: getLessonTitle(lesson, index + 1)
          }))
          .filter((lesson) => lesson.displayTitle.length > 0);

        return {
          ...module,
          displayLessons
        };
      })
      .filter((module) => module.displayLessons.length > 0);
  }, [course]);

  useEffect(() => {
    const fetchCourseData = async () => {
      setLoading(true);
      setError(null);
      try {
        const courses = await getCourses();
        if (courses && courses.length > 0) {
          const fetchedCourse = courses[0];
          setCourse(fetchedCourse);
          // Fetch user progress with the actual course ID
          if (currentUser && fetchedCourse.id) {
            fetchUserProgress(fetchedCourse.id);
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
    const fetchUserProgress = async (courseId: string) => {
      if (currentUser && courseId) {
        try {
          // Using the actual courseId from the fetched course
          const progress = await getUserCourseProgress(currentUser.uid, courseId);
          setUserProgress(progress);
          
          // Also fetch the user profile for premium status checks
          // const profile = await getUserProfile(currentUser.uid);
          // setUserProfile(profile);
        } catch (error) {
          console.error('Error fetching user progress:', error);
        }
      }
    };

    fetchCourseData();
  }, [currentUser]);

  // Function to check if a lesson is completed
  const isLessonCompleted = (lessonId: string): boolean => {
    if (!userProgress || !userProgress.completedLessons) return false;
    return userProgress.completedLessons.includes(lessonId);
  };

  // Function to navigate to the lesson page
  const handleLessonClick = (lesson: Lesson, moduleId: string) => {
    // If the lesson is premium and user is not logged in, navigate to login
    const isFreeLesson = lesson.tier === 'free' || lesson.isFree === true;
    if (!isFreeLesson && !currentUser) {
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
        <div className="relative max-w-6xl mx-auto px-4 py-14">
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
                      disabled={lesson.tier !== 'free' && !lesson.isFree && !currentUser}
                      className="text-slate-100"
                    >
                      {module.title} - {lesson.displayTitle} {(lesson.tier === 'free' || lesson.isFree) ? '(Free)' : ''}
                    </option>
                  ))
                )}
              </select>
            </div>

            {modulesWithDisplayLessons.map((module: DisplayModule) => (
              <div key={module.id} className="mb-10 w-[98%] mx-auto p-6 md:p-8 border border-white/10 rounded-2xl bg-white/5 shadow-xl">
                <div className="flex items-center justify-between gap-4 mb-5">
                  <h2 className="text-2xl font-headings font-semibold text-white">{module.title}</h2>
                  <span className="text-xs uppercase tracking-[0.2em] text-slate-300 font-headings">
                    Module {module.order}
                  </span>
                </div>
                <p className="text-slate-200 mb-6 text-sm font-sans">{module.description}</p>
                <ul className="space-y-3">
                  {module.displayLessons.map((lesson) => {
                    const isFreeLesson = lesson.tier === 'free' || lesson.isFree === true;
                    const hasVideo = hasYoutubeVideo(lesson);
                    
                    return (
                    <li 
                      key={lesson.id} 
                      onClick={() => handleLessonClick(lesson, module.id)}
                      className={`w-[98%] mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-4 rounded-xl transition-all duration-200 ease-in-out cursor-pointer 
                                  ${(!isFreeLesson && (!currentUser)) 
                                    ? 'bg-white/5 text-slate-300 hover:bg-white/10'
                                    : 'bg-gradient-to-r from-cyan-500/10 to-indigo-500/10 hover:from-cyan-500/20 hover:to-indigo-500/20 text-white'}
                                  ${isFreeLesson ? 'border border-emerald-400/30' : 'border border-white/10'}
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
                        {isFreeLesson && (
                          <span className="text-xs bg-emerald-400/20 text-emerald-200 px-2 py-1 rounded-full font-sans">Free</span>
                        )}
                        {(!isFreeLesson && (!currentUser)) && (
                          <span className="text-xs bg-amber-400/20 text-amber-200 px-2 py-1 rounded-full font-sans">Premium</span>
                        )}
                        {!hasVideo && (
                          <span className="text-xs bg-red-400/20 text-red-200 px-2 py-1 rounded-full font-sans">
                            YouTube Placeholder
                          </span>
                        )}
                        <span className="text-slate-300 text-sm font-sans">
                          {(!isFreeLesson && (!currentUser)) ? 'Login to access' : 'View Lesson'}
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
            ))}
          </div>
          {error && course && (
            <div className="mt-6 text-center text-amber-200 bg-amber-500/10 border border-amber-400/20 p-4 rounded-xl">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseOverviewPage;
