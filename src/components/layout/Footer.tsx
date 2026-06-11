import React from 'react';
import { BRAND } from '../../config/brand';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-700 text-white p-4 mt-8">
      <div className="container mx-auto text-center">
        {BRAND.copyright}
      </div>
    </footer>
  );
};

export default Footer;
