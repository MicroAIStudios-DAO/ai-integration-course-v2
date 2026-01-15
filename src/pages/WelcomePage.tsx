import React from "react";
import { Link } from "react-router-dom";
import ReactPlayer from "react-player";

const WELCOME_VIDEO_URL = "https://youtu.be/smkBKoxwzdE";

const WelcomePage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-10">
      <div className="bg-white shadow-xl rounded-lg p-6 md:p-10">
        <div className="mb-6 text-center">
          <h1 className="text-3xl md:text-4xl font-headings font-bold text-gray-900">
            Welcome to the course
          </h1>
          <p className="mt-3 text-gray-600 font-sans">
            Start with this quick video to get oriented, then jump into your lessons.
          </p>
        </div>

        <div className="mb-8">
          <div className="bg-gray-100 rounded-lg overflow-hidden">
            <div className="w-full h-[70vh] max-h-[720px]">
              <ReactPlayer
                url={WELCOME_VIDEO_URL}
                width="100%"
                height="100%"
                controls
                className="react-player"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <Link
            to="/courses"
            className="bg-blue-600 hover:bg-blue-700 text-white font-headings font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Go to courses
          </Link>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;
