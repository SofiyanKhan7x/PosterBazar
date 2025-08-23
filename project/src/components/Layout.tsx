import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import VendorAdDisplay from './VendorAdDisplay';

const Layout: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-900">
      <Navbar />
      <main className="flex-grow">
        <Outlet />
      </main>
      <VendorAdDisplay position="footer" maxAds={1} />
      <Footer />
    </div>
  );
};

export default Layout;