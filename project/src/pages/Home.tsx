import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, MapPin, Shield, TrendingUp, Users, 
  ArrowRight, CheckCircle, BarChart, Clock, IndianRupee 
} from 'lucide-react';
import FeaturedBillboards from '../components/FeaturedBillboards';
import TestimonialSlider from '../components/TestimonialSlider';
import BillboardSearchForm from '../components/BillboardSearchForm';
import VendorAdDisplay from '../components/VendorAdDisplay';

const Home: React.FC = () => {
  const navigate = useNavigate();

  const handleStartAdvertising = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    navigate('/explore');
  };

  const handleListBillboard = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    navigate('/register');
  };

  const stats = [
    { label: 'Active Billboards', value: '500+', icon: MapPin },
    { label: 'Happy Clients', value: '1000+', icon: Users },
    { label: 'Cities Covered', value: '50+', icon: BarChart },
    { label: 'Success Rate', value: '98%', icon: TrendingUp },
  ];

  const features = [
    {
      icon: Search,
      title: 'Easy Discovery',
      description: 'Find the perfect billboard locations with our advanced search and filtering system.'
    },
    {
      icon: Shield,
      title: 'Verified Listings',
      description: 'All billboards are verified for authenticity and quality before being listed on our platform.'
    },
    {
      icon: IndianRupee,
      title: 'Transparent Pricing',
      description: 'No hidden costs. See exact pricing including GST and all fees upfront.'
    },
    {
      icon: Clock,
      title: 'Quick Booking',
      description: 'Book your billboard in minutes with our streamlined booking process.'
    }
  ];

  const benefits = [
    'Real-time availability checking',
    'Secure payment processing',
    'Professional installation support',
    'Performance analytics and reporting',
    'Dedicated customer support',
    'Flexible booking terms'
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header Ad Banner */}
      <div className="relative">
        <VendorAdDisplay position="header" maxAds={1} />
      </div>
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 dark:from-blue-950 dark:via-blue-900 dark:to-blue-800 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="text-center">
            <img 
              src="/marketing_and_seo_57-removebg.png" 
              alt="PosterBazar Logo" 
              className="h-28 w-auto mx-auto mb-6" 
            />
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              India's Premier
              <span className="block text-yellow-400">Poster Marketplace</span>
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 dark:text-blue-200 mb-8 max-w-3xl mx-auto">
              Connect advertisers with premium poster locations across India. 
              Transparent pricing, verified listings, and seamless booking experience.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={handleStartAdvertising}
                className="bg-yellow-400 text-blue-900 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-yellow-300 transition-all transform hover:scale-105 flex items-center justify-center"
              >
                <Search className="h-6 w-6 mr-2" />
                Start Advertising
              </button>
              <button 
                onClick={handleListBillboard}
                className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-blue-900 transition-all transform hover:scale-105 flex items-center justify-center"
              >
                List Your Poster
                <ArrowRight className="h-6 w-6 ml-2" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Find Your Perfect Poster
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Search through thousands of verified poster locations across India
            </p>
          </div>
          <BillboardSearchForm />
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/50 text-blue-900 dark:text-blue-400 rounded-full mb-4">
                  <stat.icon className="h-8 w-8" />
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{stat.value}</div>
                <div className="text-gray-600 dark:text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Why Choose PosterBazar?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              We make outdoor advertising simple, transparent, and effective
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white dark:bg-gray-700 p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/50 text-blue-900 dark:text-blue-400 rounded-lg mb-6">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Billboards */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Featured Posters
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Discover premium poster locations in India's major cities
            </p>
          </div>
          
          <FeaturedBillboards />
          
          <div className="text-center mt-12">
            <Link 
              to="/explore" 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="inline-flex items-center bg-blue-900 dark:bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-800 dark:hover:bg-blue-600 transition-colors"
            >
              View All Posters
              <ArrowRight className="h-6 w-6 ml-2" />
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-blue-50 dark:bg-blue-900/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
                Everything You Need for Successful Campaigns
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                From discovery to installation, we provide end-to-end support for your outdoor advertising needs.
              </p>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center">
                    <CheckCircle className="h-6 w-6 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <img 
                src="https://images.pexels.com/photos/1036657/pexels-photo-1036657.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" 
                alt="Billboard advertising" 
                className="rounded-xl shadow-2xl"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/20 to-transparent rounded-xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-blue-900 dark:bg-blue-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              What Our Clients Say
            </h2>
            <p className="text-xl text-blue-200 max-w-2xl mx-auto">
              Hear from businesses that have successfully grown with BillboardHub
            </p>
          </div>
          
          <TestimonialSlider />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-yellow-400 to-yellow-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-blue-900 mb-4">
            Ready to Amplify Your Brand?
          </h2>
          <p className="text-xl text-blue-800 mb-8 max-w-2xl mx-auto">
            Join thousands of businesses that trust PosterBazar for their outdoor advertising needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={handleStartAdvertising}
              className="bg-blue-900 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-800 transition-colors transform hover:scale-105"
            >
              Start Advertising
            </button>
            <button 
              onClick={handleListBillboard}
              className="bg-white text-blue-900 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors transform hover:scale-105"
            >
              List Your Poster
            </button>
          </div>
        </div>
      </section>
      
      {/* Popup Ads */}
      <VendorAdDisplay position="popup" maxAds={1} />
    </div>
  );
};

export default Home;