import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
   ArrowLeft, Calendar, Target, Eye, 
   Share2, Heart, Phone, Mail, MapPin,
   CheckCircle, Play, Pause
} from 'lucide-react';

interface VendorAd {
  id: string;
  title: string;
  ad_type: 'banner' | 'video' | 'popup' | 'billboard_offer';
  content: string;
  description?: string;
  billboard_title?: string;
  billboard_location?: string;
  discount_percentage?: number;
  original_price?: number;
  discounted_price?: number;
  start_date: string;
  end_date: string;
  daily_budget: number;
  total_cost: number;
  status: 'active' | 'paused';
  company_name?: string;
  company_logo?: string;
  website_url?: string;
  contact_email?: string;
  contact_phone?: string;
  company_address?: string;
  features?: string[];
  gallery_images?: string[];
  video_url?: string;
  user?: {
    name: string;
    email: string;
  };
}

const VendorAdLanding: React.FC = () => {
  const { adId } = useParams<{ adId: string }>();
  const navigate = useNavigate();
  const [ad, setAd] = useState<VendorAd | null>(null);
  const [loading, setLoading] = useState(true);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    loadAdDetails();
  }, [adId]);

  const loadAdDetails = async () => {
    try {
      setLoading(true);
      
      // Simulate loading ad details from database
      // In real implementation, this would fetch from Supabase
      const mockAd: VendorAd = {
        id: adId || '1',
        title: 'Early Bird Special - 30% Off Billboard Booking',
        ad_type: 'billboard_offer',
        content: 'Book your billboard space early and save big! Perfect for upcoming festival season campaigns.',
        description: 'Take advantage of our exclusive early bird offer and secure premium billboard locations at discounted rates. This limited-time offer is perfect for businesses planning their festival season advertising campaigns.',
        billboard_title: 'Downtown Digital Display',
        billboard_location: 'MG Road, Bangalore',
        discount_percentage: 30,
        original_price: 5000,
        discounted_price: 3500,
        start_date: '2024-07-01',
        end_date: '2024-07-31',
        daily_budget: 1500,
        total_cost: 46500,
        status: 'active',
        company_name: 'PosterBazar Billboard Owner',
        company_logo: 'https://images.pexels.com/photos/1036657/pexels-photo-1036657.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop',
        website_url: 'https://posterbazar.com',
        contact_email: 'owner@posterbazar.com',
        contact_phone: '+91 98765 43210',
        company_address: '123 Billboard Avenue, Bangalore, Karnataka 560001',
        features: [
          'Premium location with high visibility',
          'Professional installation support',
          'Flexible booking terms',
          '24/7 customer support',
          'Secure payment options',
          'GST compliant billing'
        ],
        gallery_images: [
          'https://images.pexels.com/photos/1036657/pexels-photo-1036657.jpeg?auto=compress&cs=tinysrgb&w=800',
          'https://images.pexels.com/photos/1738986/pexels-photo-1738986.jpeg?auto=compress&cs=tinysrgb&w=800',
          'https://images.pexels.com/photos/3951355/pexels-photo-3951355.jpeg?auto=compress&cs=tinysrgb&w=800'
        ],
        video_url: 'https://example.com/video.mp4',
        user: {
          name: 'Rajesh Kumar',
          email: 'rajesh@posterbazar.com'
        }
      };

      setAd(mockAd);
      
      // Track ad view for analytics
      await trackAdView(adId || '1');
      
    } catch (error) {
      console.error('Error loading ad details:', error);
    } finally {
      setLoading(false);
    }
  };

  const trackAdView = async (adId: string) => {
    // Track ad view for analytics
    console.log('Ad viewed:', adId);
    // In real implementation, this would update analytics in database
  };

  const handleContactClick = (type: 'email' | 'phone' | 'website') => {
    // Track contact interaction
    console.log('Contact clicked:', type, adId);
    
    if (type === 'email' && ad?.contact_email) {
      window.location.href = `mailto:${ad.contact_email}`;
    } else if (type === 'phone' && ad?.contact_phone) {
      window.location.href = `tel:${ad.contact_phone}`;
    } else if (type === 'website' && ad?.website_url) {
      window.open(ad.website_url, '_blank');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: ad?.title,
          text: ad?.content,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const nextImage = () => {
    if (ad?.gallery_images) {
      setCurrentImageIndex((prev) => (prev + 1) % ad.gallery_images!.length);
    }
  };

  const prevImage = () => {
    if (ad?.gallery_images) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? ad.gallery_images!.length - 1 : prev - 1
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading advertisement...</p>
        </div>
      </div>
    );
  }

  if (!ad) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Advertisement Not Found</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            The advertisement you're looking for doesn't exist or has been removed.
          </p>
          <Link 
            to="/" 
            className="inline-flex items-center text-blue-900 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link 
              to="/" 
              className="inline-flex items-center text-blue-900 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Home
            </Link>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsLiked(!isLiked)}
                className={`p-2 rounded-full transition-colors ${
                  isLiked 
                    ? 'text-red-500 bg-red-50 dark:bg-red-900/20' 
                    : 'text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                }`}
              >
                <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
              </button>
              <button
                onClick={handleShare}
                className="p-2 rounded-full text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
              >
                <Share2 className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Hero Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden mb-8">
              {ad.gallery_images && ad.gallery_images.length > 0 && (
                <div className="relative h-96">
                  <img 
                    src={ad.gallery_images[currentImageIndex]} 
                    alt={ad.title}
                    className="w-full h-full object-cover"
                  />
                  {ad.gallery_images.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70"
                      >
                        <ArrowLeft className="h-5 w-5" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70"
                      >
                        <ArrowLeft className="h-5 w-5 rotate-180" />
                      </button>
                      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                        {ad.gallery_images.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentImageIndex(index)}
                            className={`w-3 h-3 rounded-full ${
                              index === currentImageIndex ? 'bg-white' : 'bg-white bg-opacity-50'
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
              
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{ad.title}</h1>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    ad.status === 'active' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-400'
                  }`}>
                    {ad.status === 'active' ? 'Active Campaign' : 'Paused'}
                  </span>
                </div>
                
                <p className="text-xl text-gray-700 dark:text-gray-300 mb-6">{ad.content}</p>
                
                {ad.description && (
                  <p className="text-gray-600 dark:text-gray-400 mb-6">{ad.description}</p>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <Calendar className="h-5 w-5 mr-2" />
                    <div>
                      <p className="text-sm">Offer Period</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {new Date(ad.start_date).toLocaleDateString()} - {new Date(ad.end_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {ad.ad_type === 'billboard_offer' ? (
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <MapPin className="h-5 w-5 mr-2" />
                      <div>
                        <p className="text-sm">Billboard Location</p>
                        <p className="font-medium text-gray-900 dark:text-white">{ad.billboard_location}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <Target className="h-5 w-5 mr-2" />
                      <div>
                        <p className="text-sm">Target Audience</p>
                        <p className="font-medium text-gray-900 dark:text-white">General Audience</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <Eye className="h-5 w-5 mr-2" />
                    <div>
                      <p className="text-sm">{ad.ad_type === 'billboard_offer' ? 'Offer Type' : 'Ad Type'}</p>
                      <p className="font-medium text-gray-900 dark:text-white capitalize">
                        {ad.ad_type === 'billboard_offer' ? 'Billboard Discount' : ad.ad_type}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Billboard Offer Specific Section */}
                {ad.ad_type === 'billboard_offer' && (
                  <div className="mb-6 p-6 bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                    <h3 className="text-lg font-semibold text-orange-900 dark:text-orange-100 mb-4">Special Offer Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">{ad.discount_percentage}%</p>
                        <p className="text-sm text-orange-700 dark:text-orange-300">Discount</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">₹{ad.discounted_price?.toLocaleString()}</p>
                        <p className="text-sm text-orange-700 dark:text-orange-300">Per Day (was ₹{ad.original_price?.toLocaleString()})</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">{ad.billboard_title}</p>
                        <p className="text-sm text-orange-700 dark:text-orange-300">Billboard Location</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Video Section */}
                {ad.ad_type === 'video' && ad.video_url && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Campaign Video</h3>
                    <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-8 text-center">
                      <div className="flex items-center justify-center space-x-4">
                        <button
                          onClick={() => setIsVideoPlaying(!isVideoPlaying)}
                          className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full transition-colors"
                        >
                          {isVideoPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8" />}
                        </button>
                        <div>
                          <p className="text-gray-900 dark:text-white font-medium">Watch Campaign Video</p>
                          <p className="text-gray-600 dark:text-gray-400 text-sm">Click to {isVideoPlaying ? 'pause' : 'play'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Features */}
                {ad.features && ad.features.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Key Features</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {ad.features.map((feature, index) => (
                        <div key={index} className="flex items-center">
                          <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                          <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => navigate(`/billboard/${ad.id}`)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-semibold transition-colors flex items-center justify-center"
                  >
                    <Calendar className="h-5 w-5 mr-2" />
                    Book Billboard
                  </button>
                  <button
                    onClick={() => handleContactClick('email')}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-lg font-semibold transition-colors flex items-center justify-center"
                  >
                    <Mail className="h-5 w-5 mr-2" />
                    Contact Owner
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Company Info */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Company Information</h3>
              
              {ad.company_logo && (
                <div className="flex items-center mb-4">
                  <img 
                    src={ad.company_logo} 
                    alt={ad.company_name}
                    className="h-12 w-12 rounded-lg object-cover mr-3"
                  />
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">{ad.company_name}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Advertiser</p>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {ad.contact_email && (
                  <button
                    onClick={() => handleContactClick('email')}
                    className="w-full flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-left"
                  >
                    <Mail className="h-5 w-5 text-gray-400 mr-3" />
                    <span className="text-gray-900 dark:text-white">{ad.contact_email}</span>
                  </button>
                )}
                
                {ad.contact_phone && (
                  <button
                    onClick={() => handleContactClick('phone')}
                    className="w-full flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-left"
                  >
                    <Phone className="h-5 w-5 text-gray-400 mr-3" />
                    <span className="text-gray-900 dark:text-white">{ad.contact_phone}</span>
                  </button>
                )}
                
                {ad.company_address && (
                  <div className="flex items-start p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <MapPin className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                    <span className="text-gray-900 dark:text-white text-sm">{ad.company_address}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Campaign Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Campaign Stats</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Daily Budget</span>
                  <span className="font-medium text-gray-900 dark:text-white">₹{ad.daily_budget.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Total Investment</span>
                  <span className="font-medium text-gray-900 dark:text-white">₹{ad.total_cost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Campaign Duration</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {Math.ceil((new Date(ad.end_date).getTime() - new Date(ad.start_date).getTime()) / (1000 * 60 * 60 * 24))} days
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Status</span>
                  <span className={`font-medium ${
                    ad.status === 'active' 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    {ad.status === 'active' ? 'Live Campaign' : 'Paused'}
                  </span>
                </div>
              </div>
            </div>

            {/* Trust Indicators */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Trust & Safety</h3>
              
              <div className="space-y-3">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-gray-700 dark:text-gray-300">Verified Advertiser</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-gray-700 dark:text-gray-300">Admin Approved</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-gray-700 dark:text-gray-300">Secure Contact</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorAdLanding;