import React from 'react';
import { ArrowLeft, Target, Users, Shield, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

const AboutUs: React.FC = () => {
  const features = [
    {
      icon: Target,
      title: 'Largest Hoarding Network',
      description: 'Access a wide range of locations across cities.'
    },
    {
      icon: Users,
      title: 'Easy Booking',
      description: 'Find the right spot and book instantly.'
    },
    {
      icon: Shield,
      title: 'Transparency & Trust',
      description: 'Verified listings with clear pricing and availability.'
    },
    {
      icon: TrendingUp,
      title: 'Win–Win Partnership',
      description: 'Helping advertisers reach more people and owners earn more revenue.'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link to="/" className="inline-flex items-center text-blue-900 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-8">
        <ArrowLeft className="h-5 w-5 mr-2" />
        Back to Home
      </Link>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div className="p-8">
          <div className="text-center mb-12">
            <img 
              src="/marketing_and_seo_57-removebg.png" 
              alt="PosterBazar Logo" 
              className="h-20 w-auto mx-auto mb-6" 
            />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">About PosterBazar</h1>
          </div>

          <div className="prose prose-lg max-w-none text-gray-700 dark:text-gray-300 mb-12">
            <p className="text-xl leading-relaxed mb-8">
              At PosterBazar, we are transforming the way outdoor advertising works in India. Our platform connects billboard & hoarding owners with advertisers in a fast, transparent, and hassle-free way.
            </p>
            
            <p className="text-lg leading-relaxed mb-8">
              Whether you're a brand looking to capture attention in prime locations or a hoarding owner wanting to maximize your space's potential, PosterBazar makes it possible with just a few clicks.
            </p>
          </div>

          {/* Mission Section */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-8 mb-12">
            <h2 className="text-3xl font-bold text-blue-900 dark:text-blue-300 mb-6 text-center">Our Mission</h2>
            <p className="text-xl text-blue-800 dark:text-blue-200 text-center leading-relaxed">
              To simplify and modernize the outdoor advertising industry by bringing every hoarding space online, making it easy to search, book, and manage campaigns anytime, anywhere.
            </p>
          </div>

          {/* Why Choose PosterBazar Section */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">Why Choose PosterBazar?</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {features.map((feature, index) => (
                <div key={index} className="bg-gray-50 dark:bg-gray-700 p-6 rounded-xl hover:shadow-md transition-shadow">
                  <div className="flex items-start">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-lg mr-4 flex-shrink-0">
                      <feature.icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">{feature.title}</h3>
                      <p className="text-gray-700 dark:text-gray-300">{feature.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Closing Statement */}
          <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-xl p-8 text-center">
            <h2 className="text-2xl font-bold text-blue-900 mb-4">
              Every Hoarding Has a Story
            </h2>
            <p className="text-xl text-blue-800 leading-relaxed">
              At PosterBazar, we believe every hoarding has the power to tell a story — let's make yours the next one people see.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;