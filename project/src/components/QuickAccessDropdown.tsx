import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronDown, Search, MapPin, IndianRupee, Phone, Mail,
  MessageSquare, HelpCircle, FileText, Target, Building,
  Calculator, Filter, Eye, Star, Clock
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface QuickAccessLink {
  name: string;
  path?: string;
  action?: () => void;
  icon: React.ComponentType<any>;
  description: string;
  requiresAuth?: boolean;
}

interface QuickAccessCategory {
  title: string;
  links: QuickAccessLink[];
}

const QuickAccessDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleNavigate = (path: string) => {
    navigate(path);
    setIsOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePriceCalculator = () => {
    // Scroll to search form on home page or navigate to explore with calculator focus
    if (window.location.pathname === '/') {
      const searchForm = document.querySelector('[data-search-form]');
      if (searchForm) {
        searchForm.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      navigate('/explore');
    }
    setIsOpen(false);
  };

  const handleContactAction = (type: 'email' | 'phone') => {
    if (type === 'email') {
      window.location.href = 'mailto:support@posterbazar.com';
    } else {
      window.location.href = 'tel:+919876543210';
    }
    setIsOpen(false);
  };

  const categories: QuickAccessCategory[] = [
    {
      title: "Billboard Search & Discovery",
      links: [
        {
          name: "Search Billboards",
          path: "/explore",
          icon: Search,
          description: "Find billboards by location, price, and type"
        },
        {
          name: "Featured Locations",
          action: () => {
            if (window.location.pathname === '/') {
              const featuredSection = document.querySelector('[data-featured-billboards]');
              if (featuredSection) {
                featuredSection.scrollIntoView({ behavior: 'smooth' });
              }
            } else {
              navigate('/#featured');
            }
            setIsOpen(false);
          },
          icon: Star,
          description: "Browse our premium billboard locations"
        },
        {
          name: "Map View",
          action: () => {
            navigate('/explore');
            // Set map view after navigation
            setTimeout(() => {
              const mapButton = document.querySelector('[aria-label="Map view"]') as HTMLButtonElement;
              if (mapButton) mapButton.click();
            }, 100);
            setIsOpen(false);
          },
          icon: MapPin,
          description: "View billboards on interactive map"
        },
        {
          name: "Advanced Filters",
          action: () => {
            navigate('/explore');
            // Focus on filters after navigation
            setTimeout(() => {
              const filterSelect = document.querySelector('select') as HTMLSelectElement;
              if (filterSelect) filterSelect.focus();
            }, 100);
            setIsOpen(false);
          },
          icon: Filter,
          description: "Use advanced search filters"
        }
      ]
    },
    {
      title: "Pricing & Booking Tools",
      links: [
        {
          name: "Price Calculator",
          action: handlePriceCalculator,
          icon: Calculator,
          description: "Calculate billboard advertising costs"
        },
        {
          name: "Budget Planner",
          action: () => {
            navigate('/explore?minBudget=1000&maxBudget=50000');
            setIsOpen(false);
          },
          icon: IndianRupee,
          description: "Plan your advertising budget"
        },
        {
          name: "Booking History",
          path: "/dashboard",
          icon: Clock,
          description: "View your booking history",
          requiresAuth: true
        },
        {
          name: "Quick Quote",
          action: () => {
            navigate('/explore');
            // Scroll to search form for quick quote
            setTimeout(() => {
              const searchForm = document.querySelector('form');
              if (searchForm) searchForm.scrollIntoView({ behavior: 'smooth' });
            }, 100);
            setIsOpen(false);
          },
          icon: FileText,
          description: "Get instant pricing quotes"
        }
      ]
    },
    {
      title: "Account & Services",
      links: [
        {
          name: user ? "My Dashboard" : "Login/Register",
          path: user ? "/dashboard" : "/login",
          icon: user ? Building : Target,
          description: user ? "Access your account dashboard" : "Sign in or create account"
        },
        {
          name: "List Your Billboard",
          path: user ? "/billboard-upload" : "/register",
          icon: Building,
          description: "Add your billboard to our platform"
        },
        {
          name: "Ad Showcase",
          action: () => {
            if (window.location.pathname === '/') {
              const showcaseSection = document.querySelector('[data-testimonials]');
              if (showcaseSection) {
                showcaseSection.scrollIntoView({ behavior: 'smooth' });
              }
            } else {
              navigate('/#testimonials');
            }
            setIsOpen(false);
          },
          icon: Eye,
          description: "View successful advertising campaigns"
        },
        {
          name: "Help & FAQ",
          path: "/faq",
          icon: HelpCircle,
          description: "Get answers to common questions"
        }
      ]
    },
    {
      title: "Contact & Support",
      links: [
        {
          name: "Email Support",
          action: () => handleContactAction('email'),
          icon: Mail,
          description: "support@posterbazar.com"
        },
        {
          name: "Call Us",
          action: () => handleContactAction('phone'),
          icon: Phone,
          description: "+91 98765 43210"
        },
        {
          name: "Live Chat",
          action: () => {
            // In a real app, this would open a chat widget
            alert('Live chat feature coming soon! Please use email or phone for now.');
            setIsOpen(false);
          },
          icon: MessageSquare,
          description: "Chat with our support team"
        },
        {
          name: "Contact Form",
          action: () => {
            navigate('/');
            // Scroll to contact section
            setTimeout(() => {
              const contactSection = document.querySelector('footer');
              if (contactSection) {
                contactSection.scrollIntoView({ behavior: 'smooth' });
              }
            }, 100);
            setIsOpen(false);
          },
          icon: FileText,
          description: "Send us a detailed inquiry"
        }
      ]
    }
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: Event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside as EventListener);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside as EventListener);
    };
  }, [isOpen]);

  // Close dropdown on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleLinkClick = (link: QuickAccessLink) => {
    // Check authentication requirement
    if (link.requiresAuth && !user) {
      navigate('/login');
      setIsOpen(false);
      return;
    }

    if (link.path) {
      handleNavigate(link.path);
    } else if (link.action) {
      link.action();
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        className="p-3 rounded-lg bg-primary-100 dark:bg-accent-800 hover:bg-primary-200 dark:hover:bg-accent-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center space-x-2"
        aria-label="Quick access menu"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Search className="h-6 w-6 text-primary-800 dark:text-accent-200" />
        <ChevronDown 
          className={`h-4 w-4 text-primary-800 dark:text-accent-200 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 animate-fade-in-down">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">PosterBazar Quick Access</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Billboard advertising tools & services</p>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {categories.map((category, categoryIndex) => (
              <div key={categoryIndex} className="p-4 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">
                  {category.title}
                </h4>
                <div className="space-y-1">
                  {category.links.map((link, linkIndex) => (
                    <button
                      key={linkIndex}
                      onClick={() => handleLinkClick(link)}
                      className="w-full flex items-center p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 text-left group"
                      title={link.description}
                      disabled={link.requiresAuth && !user}
                    >
                      <div className={`p-2 rounded-lg mr-3 transition-colors ${
                        link.requiresAuth && !user 
                          ? 'bg-gray-100 dark:bg-gray-600' 
                          : 'bg-blue-100 dark:bg-blue-900/50 group-hover:bg-blue-200 dark:group-hover:bg-blue-800/70'
                      }`}>
                        <link.icon className={`h-4 w-4 ${
                          link.requiresAuth && !user 
                            ? 'text-gray-400' 
                            : 'text-blue-600 dark:text-blue-400'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className={`text-sm font-medium transition-colors ${
                            link.requiresAuth && !user 
                              ? 'text-gray-400 dark:text-gray-500' 
                              : 'text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400'
                          }`}>
                            {link.name}
                            {link.requiresAuth && !user && ' (Login Required)'}
                          </span>
                        </div>
                        <p className={`text-xs truncate ${
                          link.requiresAuth && !user 
                            ? 'text-gray-400 dark:text-gray-500' 
                            : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {link.description}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-b-xl">
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                Need help? Contact our support team
              </p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => handleContactAction('email')}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  support@posterbazar.com
                </button>
                <button
                  onClick={() => handleContactAction('phone')}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  +91 98765 43210
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuickAccessDropdown;