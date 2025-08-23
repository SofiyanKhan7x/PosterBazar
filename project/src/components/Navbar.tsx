import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { usePermissions } from '../hooks/usePermissions';
import ThemeToggle from './ThemeToggle';
import QuickAccessDropdown from './QuickAccessDropdown';
import CartIcon from './CartIcon';

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const { canViewBillboards } = usePermissions();
  const navigate = useNavigate();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMenuOpen(false);
  };

  return (
    <nav className="bg-gradient-to-r from-blue-900 to-blue-800 dark:from-blue-950 dark:to-blue-900 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center group">
              <span className="text-2xl font-bold text-white group-hover:text-yellow-400 transition-colors">POSTERBAZAR</span>
            </Link>
          </div>

          {/* Desktop menu */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/explore" className="text-white dark:text-white hover:text-yellow-400 dark:hover:text-yellow-400 transition-colors font-medium">
              Explore PosterBazar
            </Link>
            {user ? (
              <>
                <Link to="/dashboard" className="text-white dark:text-white hover:text-yellow-400 dark:hover:text-yellow-400 transition-colors font-medium">
                  {user.role === 'sub_admin' ? 'Verification Dashboard' :
                   user.role === 'admin' ? 'Admin Dashboard' :
                   user.role === 'vendor' ? 'Vendor Dashboard' : 'My Dashboard'}
                </Link>
                {user.role === 'vendor' && (
                  <Link to="/vendor/campaigns" className="text-white dark:text-white hover:text-yellow-400 dark:hover:text-yellow-400 transition-colors font-medium">
                    My Campaigns
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="flex items-center text-white dark:text-white hover:text-yellow-400 dark:hover:text-yellow-400 transition-colors font-medium"
                >
                  <LogOut className="w-4 h-4 mr-1" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="bg-transparent text-white dark:text-white border-2 border-white dark:border-white px-4 py-2 rounded hover:bg-white hover:text-blue-900 dark:hover:bg-white dark:hover:text-blue-900 transition-all transform hover:scale-105 font-medium"
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="bg-yellow-400 text-blue-900 px-4 py-2 rounded hover:bg-yellow-300 transition-all transform hover:scale-105 font-medium"
                >
                  Register
                </Link>
              </>
            )}
            <QuickAccessDropdown />
            <CartIcon />
            <ThemeToggle />
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-4">
            <QuickAccessDropdown />
            <CartIcon />
            <ThemeToggle />
            <button 
              onClick={toggleMenu}
              className="text-white dark:text-white hover:text-yellow-400 dark:hover:text-yellow-400 focus:outline-none"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-blue-800 dark:bg-blue-950 border-t border-blue-700 dark:border-blue-900">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link 
              to="/explore"
              className="block px-3 py-2 text-white dark:text-white hover:bg-blue-700 dark:hover:bg-blue-800 rounded-md font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              Explore PosterBazar
            </Link>
            {user ? (
              <>
                <Link 
                  to="/dashboard" 
                  className="block px-3 py-2 text-white dark:text-white hover:bg-blue-700 dark:hover:bg-blue-800 rounded-md font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {user.role === 'sub_admin' ? 'Verification Dashboard' :
                   user.role === 'admin' ? 'Admin Dashboard' :
                   user.role === 'vendor' ? 'Vendor Dashboard' : 'My Dashboard'}
                </Link>
                {user.role === 'vendor' && (
                  <Link 
                    to="/vendor/campaigns" 
                    className="block px-3 py-2 text-white dark:text-white hover:bg-blue-700 dark:hover:bg-blue-800 rounded-md font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    My Campaigns
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center px-3 py-2 text-white dark:text-white hover:bg-blue-700 dark:hover:bg-blue-800 rounded-md font-medium"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="block px-3 py-2 text-white dark:text-white hover:bg-blue-700 dark:hover:bg-blue-800 rounded-md font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="block px-3 py-2 text-yellow-400 font-medium hover:bg-blue-700 dark:hover:bg-blue-800 rounded-md"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;