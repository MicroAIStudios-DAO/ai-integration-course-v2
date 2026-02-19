import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import ReactPlayer from "react-player";
import { getCourseById, getLessonMarkdownUrl, markLessonAsComplete, getUserProfile, getUserCourseProgress } from "../firebaseService"; // Import Firestore service
import { Course, Lesson as LessonType, UserCourseProgress } from "../types/course"; // Import types
import { useAuth } from "../context/AuthContext"; // For gating logic
// Master access removed for production
import AnimatedAvatar from "../components/layout/AnimatedAvatar"; // Import AnimatedAvatar
import AITutor from "../components/AITutor";
import CourseSchema from "../components/seo/CourseSchema";
import "../styles/lesson-content.css"; // Import textbook-style CSS
import { trackLessonStart, trackLessonComplete } from "../utils/analytics";

const LessonPage: React.FC = () => {
  const { courseId, moduleId, lessonId } = useParams<{ courseId: string; moduleId: string; lessonId: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [lesson, setLesson] = useState<LessonType | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [moduleTitle, setModuleTitle] = useState<string>("");
  const [courseTitle, setCourseTitle] = useState<string>("");
  const [markdownContent, setMarkdownContent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAllowed, setIsAllowed] = useState(false);
  const [userProgress, setUserProgress] = useState<UserCourseProgress | null>(null);
  const [videoUrlToPlay, setVideoUrlToPlay] = useState<string | undefined>(undefined);
  // no master access state

  // master access removed

  useEffect(() => {
    const fetchLessonData = async () => {
      if (!courseId || !moduleId || !lessonId) {
        setError("Course, module, or lesson ID missing.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const courseData = await getCourseById(courseId);
        if (!courseData) {
          setError(`Course with ID ${courseId} not found.`);
          setLoading(false); 
          return;
        }
        setCourse(courseData);
        setCourseTitle(courseData.title);

        const currentModule = courseData.modules.find(m => m.id === moduleId);
        if (!currentModule) {
          setError(`Module with ID ${moduleId} in course ${courseId} not found.`);
          setLoading(false); 
          return;
        }
        setModuleTitle(currentModule.title);

        const currentLesson = currentModule.lessons.find(l => l.id === lessonId);
        if (!currentLesson) {
          setError(`Lesson with ID ${lessonId} in module ${moduleId} not found.`);
          setLoading(false); 
          return;
        }
        setLesson(currentLesson);

        // Check access: free lesson, subscription, or admin role
        const isFreeLesson = currentLesson.tier === 'free' || currentLesson.isFree === true;
        let canAccess = isFreeLesson;
        if (currentUser) {
          // Check subscription status for logged-in users without master access
          const profile = await getUserProfile(currentUser.uid);
          const isAdmin = profile?.role === 'admin' || profile?.isAdmin;
          canAccess = !!(
            isFreeLesson ||
            isAdmin ||
            profile?.isSubscribed ||
            profile?.activeTrial ||
            (profile as any)?.foundingMember
          );
          
          const progress = await getUserCourseProgress(currentUser.uid, courseId);
          setUserProgress(progress);
        }
        
        setIsAllowed(canAccess);

        if (canAccess) {
          // Try to get lesson content from multiple sources
          let contentToDisplay = "";
          
          // Priority 1: Direct content field in Firestore
          if (currentLesson.content) {
            contentToDisplay = currentLesson.content;
          }
          // Priority 2: Content from Firebase Storage
          else if (currentLesson.storagePath) {
            try {
              const mdUrl = await getLessonMarkdownUrl(currentLesson.storagePath);
              const response = await fetch(mdUrl);
              if (response.ok) {
                contentToDisplay = await response.text();
              }
            } catch (storageError) {
              console.warn("Could not fetch content from storage:", storageError);
            }
          }
          
          // Priority 3: Fallback content if no content is available
          if (!contentToDisplay) {
            contentToDisplay = `# ${currentLesson.title}

Welcome to this lesson! 

## Lesson Overview
Duration: ${currentLesson.durationMinutes || 'N/A'} minutes

${currentLesson.description || 'This lesson covers important concepts in AI integration and investment strategies.'}

## Content Coming Soon
The detailed content for this lesson is being prepared. Please check back soon or contact support if you need immediate access to this material.

## What You'll Learn
- Key concepts and practical applications
- Real-world examples and case studies  
- Actionable insights for implementation

---

*This lesson is part of the AI Integration Course. For questions, use the AI Tutor below.*`;
          }
          
          setMarkdownContent(contentToDisplay);
          setVideoUrlToPlay(currentLesson.videoUrl);

          // Track lesson_start event
          trackLessonStart(
            lessonId,
            currentLesson.title,
            moduleId,
            currentModule.title,
            courseId
          );
        } else {
          setError("You do not have access to this premium lesson.");
        }

      } catch (err: any) {
        console.error("Error fetching lesson data:", err);
        setError(err.message || `Failed to load lesson: ${lessonId}.`);
      } finally {
        setLoading(false);
      }
    };

    fetchLessonData();
  }, [courseId, moduleId, lessonId, currentUser]);

  const handleMarkComplete = async () => {
    if (currentUser && courseId && lessonId) {
      try {
        await markLessonAsComplete(currentUser.uid, courseId, lessonId);
        
        // Track lesson_complete event
        trackLessonComplete(
          lessonId,
          lesson?.title || '',
          moduleId || '',
          'button_click'
        );
        alert("Lesson marked as complete!");
        const progress = await getUserCourseProgress(currentUser.uid, courseId);
        setUserProgress(progress);
      } catch (err) {
        console.error("Error marking lesson complete:", err);
        alert("Failed to mark lesson as complete.");
      }
    }
  };
  
  const isLessonCompleted = () => {
    return userProgress?.completedLessons?.includes(lessonId || "") || false;
  };

  // Master access functionality removed for production
  // const handleExtendMasterSession = () => {
  //   // Master access functionality removed
  //   alert("Master session functionality removed in production");
  // };

  // const handleClearMasterSession = () => {
  //   // Master access functionality removed
  //   // Reload the page to re-check access
  //   window.location.reload();
  // };

  if (loading) return <div className="container mx-auto px-4 py-8 text-center"><p className="font-sans">Loading lesson...</p></div>;
  
  if (error && !isAllowed) {
     return (
      <div className="container mx-auto px-4 py-8 text-center bg-gray-100 p-10 rounded-lg shadow-md">
        <h2 className="text-2xl font-headings font-semibold mb-4 text-yellow-600">Access Denied</h2>
        <p className="text-gray-700 font-sans mb-6">{error} Please <Link to="/signup" className="text-blue-600 hover:underline">sign up</Link> or <Link to="/login" className="text-blue-600 hover:underline">log in</Link> to access, or check your subscription.</p>
        <div className="space-y-4">
          <button 
            onClick={() => navigate(-1)} 
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-4"
          >
            Go Back
          </button>
          <Link 
            to="/login" 
            className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded inline-block"
          >
            Master Access Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="textbook-page">
      {course && (
        <CourseSchema
          courseName={course.title}
          courseDescription={course.description}
          courseUrl={typeof window !== "undefined" ? `${window.location.origin}/courses/${courseId}` : undefined}
          providerUrl={typeof window !== "undefined" ? window.location.origin : undefined}
          modules={course.modules.map((module) => ({
            name: module.title,
            description: module.description
          }))}
        />
      )}
      <div className="textbook-container">
        {/* Master Access Status */}
        {/* Master access UI removed */}

        {/* Textbook Header */}
        <div className="textbook-header">
          <h1>{lesson?.title}</h1>
          <div className="textbook-meta">
            <span>Duration: {lesson?.durationMinutes} minutes</span>
            {((lesson as any)?.isFree || (lesson as any)?.tier === 'free') && (
              <span className="bg-green-500 bg-opacity-20 px-2 py-1 rounded-full text-xs">FREE</span>
            )}
            {((lesson as any) && !((lesson as any)?.isFree || (lesson as any)?.tier === 'free')) && (
              <span className="bg-yellow-600 bg-opacity-20 px-2 py-1 rounded-full text-xs">PREMIUM</span>
            )}
            {isLessonCompleted() && <span className="bg-blue-500 bg-opacity-20 px-2 py-1 rounded-full text-xs">COMPLETED</span>}
          </div>
        </div>

        <div className="textbook-content">
          {/* Breadcrumb */}
          <nav className="text-sm breadcrumbs mb-6 font-sans text-gray-600">
            <Link to="/courses" className="hover:text-blue-600">Courses</Link> &gt; 
            <span className="mx-1">{courseTitle}</span> &gt; 
            <span className="mx-1">{moduleTitle}</span> &gt; 
            <span className="mx-1 font-semibold">{lesson?.title}</span>
          </nav>

          {/* Video Player */}
          {videoUrlToPlay ? (
            <div className="mb-10">
              <div className="lesson-video">
                <ReactPlayer
                  url={videoUrlToPlay}
                  width="100%"
                  height="100%"
                  controls
                  playing
                  muted
                  playsinline
                  className="react-player"
                />
              </div>
            </div>
          ) : (
            <div className="mb-10">
              <div className="lesson-video flex items-center justify-center bg-slate-900/80 border border-slate-700 rounded-xl">
                <div className="text-center px-6">
                  <p className="text-lg font-headings font-semibold text-slate-100">YouTube Placeholder</p>
                  <p className="text-sm text-slate-300 mt-2">Video is being prepared for this lesson.</p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div>
              {/* Lesson Content with Textbook Styling */}
              {markdownContent && (
                <div className="lesson-content">
                  <ReactMarkdown>{markdownContent}</ReactMarkdown>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-4 mt-8 pt-6 border-t border-gray-200">
                {currentUser && !isLessonCompleted() && (
                  <button
                    onClick={handleMarkComplete}
                    className="bg-green-500 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg font-headings transition-colors"
                  >
                    Mark as Complete
                  </button>
                )}
                <button 
                  onClick={() => navigate(-1)} 
                  className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg font-headings transition-colors"
                >
                  Back to Course
                </button>
              </div>
            </div>

            {/* AI Tutor Section */}
            <div className="lg:sticky lg:top-24 h-fit bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-100">
              <div className="flex items-center mb-4">
                <AnimatedAvatar />
                <h3 className="text-xl font-headings font-semibold ml-4 text-gray-800">AI Tutor</h3>
              </div>
              <p className="text-gray-700 font-sans mb-4">
                Have questions about this lesson? Ask our AI tutor for personalized help and explanations.
              </p>
              <AITutor
                lessonId={`courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`}
                premium={!lesson?.isFree}
                hasAccess={isAllowed}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonPage;
