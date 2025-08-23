import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { getTestimonials, supabase } from '../services/supabase';
import { testimonials as mockTestimonials } from '../data/mockData';

interface Testimonial {
  id: string;
  name: string;
  role: string;
  quote: string;
  avatar: string;
}

const TestimonialSlider: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!supabase) {
        setError('Database service not available');
        setTestimonials([]);
        return;
      }

      try {
        const data = await getTestimonials();
        const transformedData = (data || []).map(item => ({
          id: item.id,
          name: item.name,
          role: item.role || 'Customer',
          quote: item.quote,
          avatar: item.avatar || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'
        }));
        setTestimonials(transformedData);
      } catch (supabaseError) {
        console.error('Error loading testimonials:', supabaseError);
        console.warn('Using fallback testimonials data');
        const transformedMockData = mockTestimonials.map(item => ({
          id: item.id,
          name: item.name,
          role: item.role || 'Customer',
          quote: item.quote,
          avatar: item.avatar || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'
        }));
        setTestimonials(transformedMockData);
        setError(null);
      }
    } catch (err) {
      console.error('Failed to fetch testimonials:', err);
      console.warn('Using fallback testimonials data');
      const transformedMockData = mockTestimonials.map(item => ({
        id: item.id,
        name: item.name,
        role: item.role || 'Customer',
        quote: item.quote,
        avatar: item.avatar || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'
      }));
      setTestimonials(transformedMockData);
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  const nextTestimonial = () => {
    // Guard against empty testimonials array
    if (testimonials.length === 0) return;
    setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    // Guard against empty testimonials array
    if (testimonials.length === 0) return;
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? testimonials.length - 1 : prevIndex - 1
    );
  };

  // Auto-advance testimonials every 5 seconds
  useEffect(() => {
    // Only set interval if testimonials exist
    if (testimonials.length === 0) return;
    
    const interval = setInterval(() => {
      nextTestimonial();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [testimonials.length]); // Include testimonials.length in dependency array

  if (loading) {
    return (
      <div className="relative max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8 md:p-12 relative z-10">
          <div className="min-h-[250px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error && testimonials.length === 0) {
    return (
      <div className="relative max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8 md:p-12 relative z-10">
          <div className="min-h-[250px] flex items-center justify-center">
            <div className="text-center">
              <h3 className="text-xl font-medium text-gray-900 mb-4">No Client Testimonials</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Client testimonials will appear here once customers share their experiences.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative max-w-4xl mx-auto">
      {/* Quote icon */}
      <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-blue-200">
        <Quote size={64} />
      </div>
      
      {/* Testimonials */}
      <div className="bg-white rounded-xl shadow-lg p-8 md:p-12 relative z-10">
        <div className="min-h-[250px] flex items-center">
          <div className="text-center">
            <p className="text-lg md:text-xl italic text-gray-700 mb-8">
              "{testimonials[currentIndex].quote}"
            </p>
            <div>
              <div className="w-16 h-16 mx-auto mb-4 overflow-hidden rounded-full border-2 border-blue-900">
                <img 
                  src={testimonials[currentIndex].avatar} 
                  alt={testimonials[currentIndex].name} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to a default avatar if image fails to load
                    (e.target as HTMLImageElement).src = 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop';
                  }}
                />
              </div>
              <h4 className="text-xl font-bold text-gray-900">{testimonials[currentIndex].name}</h4>
              <p className="text-blue-900">{testimonials[currentIndex].role}</p>
            </div>
          </div>
        </div>
        
        {/* Navigation buttons */}
        <div className="flex justify-center mt-8 space-x-4">
          <button 
            onClick={prevTestimonial}
            className="p-2 rounded-full bg-gray-100 hover:bg-blue-100 text-gray-600 hover:text-blue-900 transition-colors"
            aria-label="Previous testimonial"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button 
            onClick={nextTestimonial}
            className="p-2 rounded-full bg-gray-100 hover:bg-blue-100 text-gray-600 hover:text-blue-900 transition-colors"
            aria-label="Next testimonial"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>
        
        {/* Dots indicator */}
        <div className="flex justify-center mt-4 space-x-2">
          {testimonials.map((_, index) => (
            <button 
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-3 h-3 rounded-full transition-colors ${
                index === currentIndex ? 'bg-blue-900' : 'bg-gray-300 hover:bg-blue-200'
              }`}
              aria-label={`Go to testimonial ${index + 1}`}
            />
          ))}
        </div>
        
        {/* Show indicator if using fallback data */}
      </div>
    </div>
  );
};

export default TestimonialSlider;