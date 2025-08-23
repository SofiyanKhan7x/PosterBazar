import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Mail, Phone, MapPin, Info, FileText, 
  Shield, HelpCircle, BookOpen, AlertTriangle, ArrowRight, 
  Building, IndianRupee, FileCheck, Users
} from 'lucide-react';

const Footer: React.FC = () => {
  const navigate = useNavigate();

  const handleNavigation = (path: string) => {
    navigate(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-blue-900 dark:bg-gray-800 text-white mt-auto">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <div className="flex items-center mb-4">
              <span className="text-xl font-bold text-white">POSTERBAZAR</span>
            </div>
            <p className="text-gray-300 text-sm mb-4">
              India's leading digital marketplace for outdoor poster and hoarding bookings.
            </p>
            <div className="space-y-2">
              <a href="mailto:contact@posterbazar.com" className="flex items-center text-gray-300 hover:text-white transition-colors">
                <Mail className="h-5 w-5 mr-2" />
                support@posterbazar.com
              </a>
              <a href="tel:+911234567890" className="flex items-center text-gray-300 hover:text-white transition-colors">
                <Phone className="h-5 w-5 mr-2" />
                +91 98765 43210
              </a>
              <div className="flex items-start">
                <MapPin className="h-5 w-5 mr-2 mt-1" />
                <span className="text-gray-300">
                  C/O- YOGESH BARBADE<br />
                  KARJAT, TAL-KARJAT<br />
                  Ahmednagar, Maharashtra, India<br />
                  414402
                </span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Quick Links
            </h3>
            <ul className="space-y-2">
              <li>
                <button onClick={() => handleNavigation('/explore')} className="text-gray-300 hover:text-white transition-colors flex items-center">
                  <ArrowRight className="h-4 w-4 mr-1" />
                  Explore Billboards
                </button>
              </li>
              <li>
                <button onClick={() => handleNavigation('/register')} className="text-gray-300 hover:text-white transition-colors flex items-center">
                  <ArrowRight className="h-4 w-4 mr-1" />
                  List Your Billboard
                </button>
              </li>
              <li>
                <button onClick={() => handleNavigation('/pricing')} className="text-gray-300 hover:text-white transition-colors flex items-center">
                  <ArrowRight className="h-4 w-4 mr-1" />
                  Pricing
                </button>
              </li>
              <li>
                <button onClick={() => handleNavigation('/about')} className="text-gray-300 hover:text-white transition-colors flex items-center">
                  <ArrowRight className="h-4 w-4 mr-1" />
                  About Us
                </button>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Building className="h-5 w-5 mr-2" />
              Our Services
            </h3>
            <ul className="space-y-2">
              <li className="flex items-center text-gray-300">
                <Users className="h-4 w-4 mr-2" />
                Advertiser Registration
              </li>
              <li className="flex items-center text-gray-300">
                <FileCheck className="h-4 w-4 mr-2" />
                Billboard Verification
              </li>
              <li className="flex items-center text-gray-300">
                <IndianRupee className="h-4 w-4 mr-2" />
                GST Compliant Billing
              </li>
              <li className="flex items-center text-gray-300">
                <Shield className="h-4 w-4 mr-2" />
                Secure Payments
              </li>
            </ul>
          </div>

          {/* Legal & Help */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <HelpCircle className="h-5 w-5 mr-2" />
              Help & Legal
            </h3>
            <ul className="space-y-2">
              <li>
                <button onClick={() => handleNavigation('/faq')} className="text-gray-300 hover:text-white transition-colors flex items-center">
                  <Info className="h-4 w-4 mr-2" />
                  FAQs
                </button>
              </li>
              <li>
                <button onClick={() => handleNavigation('/policies')} className="text-gray-300 hover:text-white transition-colors flex items-center">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Policies
                </button>
              </li>
              <li>
                <button onClick={() => handleNavigation('/privacy')} className="text-gray-300 hover:text-white transition-colors flex items-center hidden">
                  <Shield className="h-4 w-4 mr-2" />
                  Privacy Policy
                </button>
              </li>
              <li>
                <button onClick={() => handleNavigation('/terms')} className="text-gray-300 hover:text-white transition-colors flex items-center hidden">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Terms & Conditions
                </button>
              </li>
              <li>
                <button onClick={() => handleNavigation('/disclaimer')} className="text-gray-300 hover:text-white transition-colors flex items-center hidden">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Disclaimer
                </button>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-gray-700">
          <div className="text-center text-gray-300 text-sm">
            <p>&copy; {new Date().getFullYear()} PosterBazar. All rights reserved.</p>
            <p className="mt-2">
              Bridging advertisers and poster owners across India with transparency and trust.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;