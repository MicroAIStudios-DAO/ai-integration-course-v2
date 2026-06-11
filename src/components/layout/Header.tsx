import React from 'react';
import { Link } from 'react-router-dom';
import { BRAND } from '../../config/brand';

const Header: React.FC = () => {
  return (
    <header className="bg-gray-800 text-white p-4 shadow-md">
      <nav className="container mx-auto flex justify-between items-center">
        <Link to="/" className="group">
          <span className="block text-xl font-bold leading-none">{BRAND.courseName}</span>
          <span className="hidden md:block mt-1 text-[11px] font-medium tracking-wide text-gray-300 max-w-md leading-snug">
            {BRAND.headerTagline}
          </span>
        </Link>
        <div>
               <Link to="/courses" className="mr-4 hover:text-gray-300">Courses</Link>

          <Link to="/login" className="mr-4 hover:text-gray-300">Login</Link>
          <Link to="/pricing" className="hover:text-gray-300">Pricing</Link>
        </div>
      </nav>
    </header>
  );
};

export default Header;
