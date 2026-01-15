import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout'; // Import the Layout component
import HomePage from './pages/HomePage';
import NewLandingPage from './pages/NewLandingPage';
import CourseOverviewPage from './pages/CourseOverviewPage';
import LessonPage from './pages/LessonPage';
import PersonalizedRecapPage from './pages/PersonalizedRecapPage';
import AIChatTutorPage from './pages/AIChatTutorPage';
import LearningPathwaysPage from './pages/LearningPathwaysPage';
import WelcomePage from './pages/WelcomePage';
import LoginPage from './components/auth/LoginPage';
import SignupPage from './components/auth/SignupPage';
import ProfilePage from './components/auth/ProfilePage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import PaymentCancelPage from './pages/PaymentCancelPage';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* HomePage renders without Layout for full-screen landing page */}
        <Route path="/" element={<HomePage />} />
        {/* NewLandingPage renders without Layout for full-screen landing page */}
        <Route path="/new-landing" element={<NewLandingPage />} />

        {/* All other routes use Layout wrapper */}
        <Route element={<Layout />}>
          <Route path="/courses" element={<CourseOverviewPage />} />
          <Route path="/courses/:courseId/modules/:moduleId/lessons/:lessonId" element={<LessonPage />} />
          <Route path="/welcome" element={<WelcomePage />} />
          <Route path="/tutor" element={<AIChatTutorPage />} />
          <Route path="/paths" element={<LearningPathwaysPage />} />
          <Route path="/recap" element={<PersonalizedRecapPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/payment-success" element={<PaymentSuccessPage />} />
          <Route path="/payment-cancel" element={<PaymentCancelPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
