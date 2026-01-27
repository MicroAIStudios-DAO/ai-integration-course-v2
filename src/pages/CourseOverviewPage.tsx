import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCourses, getUserCourseProgress } from '../firebaseService';
import { Course, Module, Lesson, UserCourseProgress } from '../types/course';
import { useAuth } from '../context/AuthContext';
import CourseSchema from '../components/seo/CourseSchema';

const CourseOverviewPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [userProgress, setUserProgress] = useState<UserCourseProgress | null>(null);

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
    <div className="container mx-auto px-4 py-10 text-gray-900">
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
      <div className="rounded-2xl border border-slate-200 bg-white/90 backdrop-blur shadow-xl p-6 md:p-10">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 text-blue-700 px-3 py-1 text-xs font-headings font-semibold uppercase tracking-wide">
            Course Overview
          </div>
          <h1 className="text-4xl md:text-5xl font-headings font-extrabold mt-4 text-gray-900">
            {course.title}
          </h1>
          <p className="text-lg text-gray-800 mt-3 max-w-3xl font-sans">{course.description}</p>
        </div>
        
        {/* Lesson dropdown */}
        <select
          className="mb-6 px-4 py-3 border border-slate-200 rounded-xl w-full md:w-1/2 bg-white text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          <option value="" className="text-gray-900">Select a lesson</option>
          {course.modules.map((module) =>
            module.lessons.map((lesson) => (
              <option
                key={`${module.id}|${lesson.id}`}
                value={`${module.id}|${lesson.id}`}
                disabled={lesson.tier !== 'free' && !lesson.isFree && !currentUser}
                className="text-gray-900"
              >
                {module.title} - {lesson.title} {(lesson.tier === 'free' || lesson.isFree) ? '(Free)' : ''}
              </option>
            ))
          )}
        </select>

        {course.modules.map((module: Module) => (
          <div key={module.id} className="mb-10 p-6 md:p-8 border border-slate-200 rounded-2xl bg-white shadow-sm hover:shadow-md transition-shadow duration-300">
            <h2 className="text-2xl font-headings font-semibold mb-3 text-slate-900">{module.title}</h2>
            <p className="text-gray-800 mb-6 text-sm font-sans">{module.description}</p>
            <ul className="space-y-3">
              {module.lessons.map((lesson: Lesson) => {
                // Check if user has access to this lesson (free, subscribed, trial, admin, or master access)
                // const isAdmin = userProfile?.role === 'admin' || userProfile?.isAdmin || false;
                // Use hasAccess in the class name for premium lessons
                // const hasAccess = lesson.isFree || userProfile?.isSubscribed || userProfile?.activeTrial || isAdmin;
                const isFreeLesson = lesson.tier === 'free' || lesson.isFree === true;
                
                return (
                <li 
                  key={lesson.id} 
                  onClick={() => handleLessonClick(lesson, module.id)}
                  className={`flex justify-between items-center p-4 rounded-xl transition-all duration-200 ease-in-out cursor-pointer 
                              ${(!isFreeLesson && (!currentUser /* Simplified gating */)) 
                                ? 'bg-slate-100 text-gray-600 hover:bg-slate-200'
                                : 'bg-blue-50 hover:bg-blue-100 text-gray-900'}
                              ${isFreeLesson ? 'border-l-4 border-green-500' : 'border-l-4 border-slate-300'}
                              ${isLessonCompleted(lesson.id) ? 'opacity-70' : ''}
                            `}
                >
                  <div className="flex items-center">
                    <span className="mr-3 text-blue-500">
                      {isLessonCompleted(lesson.id) ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </span>
                    <span className={`font-sans font-medium ${isLessonCompleted(lesson.id) ? 'line-through text-gray-600' : ''}`}>{lesson.title}</span>
                  </div>
                  <div className="flex items-center">
                    {isFreeLesson && (
                      <span className="text-xs bg-green-200 text-green-700 px-2 py-1 rounded-full mr-2 font-sans">Free</span>
                    )}
                    {(!isFreeLesson && (!currentUser /* Simplified gating */)) && (
                      <span className="text-xs bg-yellow-200 text-yellow-700 px-2 py-1 rounded-full mr-2 font-sans">Premium</span>
                    )}
                    <span className="text-gray-600 text-sm font-sans">
                      {(!isFreeLesson && (!currentUser /* Simplified gating */)) ? 'Login to access' : 'View Lesson'}
                    </span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
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
        <div className="mt-6 text-center text-yellow-600 bg-yellow-100 p-4 rounded">
          {error}
        </div>
      )}
    </div>
  );
};

export default CourseOverviewPage;
