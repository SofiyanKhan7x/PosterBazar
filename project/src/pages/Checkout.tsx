import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, CreditCard, CheckCircle, AlertTriangle, 
  MapPin, Calendar, IndianRupee, Shield, User, Mail, Phone
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { CartService } from '../services/cartService';
import { CartSession } from '../types/billboard';

const Checkout: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cart, setCart] = useState<CartSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [contactInfo, setContactInfo] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    company: ''
  });
  const [paymentInfo, setPaymentInfo] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    nameOnCard: '',
    upiId: '',
    bankAccount: ''
  });

  useEffect(() => {
    if (user) {
      loadCartForCheckout();
    }
  }, [user]);

  const loadCartForCheckout = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const cartData = await CartService.getUserCart(user.id);
      
      if (!cartData || cartData.items.length === 0) {
        navigate('/explore');
        return;
      }

      // Validate cart before checkout
      const validation = await CartService.validateCartForCheckout(user.id);
      
      if (!validation.valid) {
        setMessage(`${validation.invalidItems.length} item(s) are no longer available. Please review your cart.`);
        setTimeout(() => navigate('/explore'), 3000);
        return;
      }

      setCart(cartData);
    } catch (error) {
      console.error('Error loading cart for checkout:', error);
      setMessage('Failed to load cart data');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = () => {
    if (!cart) return { subtotal: 0, gst: 0, total: 0 };

    const subtotal = cart.total_amount;
    const gst = subtotal * 0.18; // 18% GST
    const total = subtotal + gst;

    return { subtotal, gst, total };
  };

  const handleProcessPayment = async () => {
    if (!user || !cart) return;

    setProcessing(true);
    setMessage('');

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Generate mock payment ID
      const paymentId = `PAY_${Date.now()}_${Math.random().toString(36).substring(2)}`;
      
      // Process cart checkout
      const result = await CartService.processCartCheckout(user.id);
      
      if (result.success) {
        // Navigate to success page
        navigate('/booking-success', {
          state: {
            bookingIds: result.bookingIds,
            totalAmount: calculateTotals().total,
            paymentId,
            billboards: cart.items.map(item => ({
              title: item.billboard_title,
              location: item.billboard_location,
              startDate: item.start_date,
              endDate: item.end_date,
              side: item.side_booked,
              amount: item.total_amount
            }))
          }
        });
      } else {
        setMessage(`Checkout failed: ${result.errors?.join(', ') || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      setMessage('Payment processing failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const getSideDisplayName = (sideBooked: string) => {
    switch (sideBooked) {
      case 'A': return 'Side A';
      case 'B': return 'Side B';
      case 'BOTH': return 'Both Sides';
      default: return 'Single Side';
    }
  };

  const getSideColor = (sideBooked: string) => {
    switch (sideBooked) {
      case 'A': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-400';
      case 'B': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400';
      case 'BOTH': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-400';
    }
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Login Required</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">Please log in to proceed with checkout.</p>
        <Link to="/login" className="text-blue-900 dark:text-blue-400 hover:underline">
          Go to Login
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading checkout...</p>
        </div>
      </div>
    );
  }

  const totals = calculateTotals();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link 
        to="/explore" 
        className="inline-flex items-center text-blue-900 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-8"
      >
        <ArrowLeft className="h-5 w-5 mr-2" />
        Back to Explore
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Order Summary */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Checkout</h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Review your billboard bookings and complete payment.
              </p>
            </div>

            {message && (
              <div className={`p-4 border-b border-gray-200 dark:border-gray-700 ${
                message.includes('available') || message.includes('success')
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                  : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
              }`}>
                <div className="flex items-center">
                  {message.includes('available') || message.includes('success') ? (
                    <CheckCircle className="h-5 w-5 mr-2" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 mr-2" />
                  )}
                  {message}
                </div>
              </div>
            )}

            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Order Summary ({cart?.total_items} items)
              </h2>
              
              <div className="space-y-4">
                {cart?.items.map((item) => (
                  <div key={item.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-start space-x-4">
                      <div className="h-16 w-24 rounded-lg overflow-hidden flex-shrink-0">
                        <img 
                          src={item.billboard_image} 
                          alt={item.billboard_title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{item.billboard_title}</h3>
                        <div className="flex items-center text-gray-600 dark:text-gray-400 mt-1">
                          <MapPin className="h-4 w-4 mr-1" />
                          <span className="text-sm">{item.billboard_location}</span>
                        </div>
                        <div className="flex items-center space-x-4 mt-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSideColor(item.side_booked)}`}>
                            {getSideDisplayName(item.side_booked)}
                          </span>
                          <div className="flex items-center text-gray-600 dark:text-gray-400">
                            <Calendar className="h-4 w-4 mr-1" />
                            <span className="text-sm">
                              {new Date(item.start_date).toLocaleDateString()} - {new Date(item.end_date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="flex items-center text-blue-600 dark:text-blue-400 font-semibold">
                          <IndianRupee className="h-4 w-4 mr-1" />
                          <span>₹{item.total_amount.toLocaleString()}</span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          ₹{item.price_per_day.toLocaleString()}/day × {item.total_days} days
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Contact Information</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={contactInfo.name}
                      onChange={(e) => setContactInfo({...contactInfo, name: e.target.value})}
                      className="pl-10 w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      value={contactInfo.email}
                      onChange={(e) => setContactInfo({...contactInfo, email: e.target.value})}
                      className="pl-10 w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Phone Number *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="tel"
                      value={contactInfo.phone}
                      onChange={(e) => setContactInfo({...contactInfo, phone: e.target.value})}
                      className="pl-10 w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={contactInfo.company}
                    onChange={(e) => setContactInfo({...contactInfo, company: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Payment Method</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div 
                  className={`border ${
                    paymentMethod === 'credit_card' ? 'border-blue-900 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-600'
                  } rounded-md p-4 cursor-pointer hover:border-blue-900 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors`}
                  onClick={() => setPaymentMethod('credit_card')}
                >
                  <div className="flex justify-between mb-2">
                    <span className="font-medium text-gray-900 dark:text-white">Credit Card</span>
                    {paymentMethod === 'credit_card' && <CheckCircle className="h-5 w-5 text-blue-900 dark:text-blue-400" />}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Visa, Mastercard, Amex</p>
                </div>
                <div 
                  className={`border ${
                    paymentMethod === 'upi' ? 'border-blue-900 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-600'
                  } rounded-md p-4 cursor-pointer hover:border-blue-900 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors`}
                  onClick={() => setPaymentMethod('upi')}
                >
                  <div className="flex justify-between mb-2">
                    <span className="font-medium text-gray-900 dark:text-white">UPI</span>
                    {paymentMethod === 'upi' && <CheckCircle className="h-5 w-5 text-blue-900 dark:text-blue-400" />}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">PhonePe, GPay, Paytm</p>
                </div>
                <div 
                  className={`border ${
                    paymentMethod === 'bank_transfer' ? 'border-blue-900 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-600'
                  } rounded-md p-4 cursor-pointer hover:border-blue-900 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors`}
                  onClick={() => setPaymentMethod('bank_transfer')}
                >
                  <div className="flex justify-between mb-2">
                    <span className="font-medium text-gray-900 dark:text-white">Bank Transfer</span>
                    {paymentMethod === 'bank_transfer' && <CheckCircle className="h-5 w-5 text-blue-900 dark:text-blue-400" />}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">NEFT/RTGS/IMPS</p>
                </div>
              </div>

              {/* Payment Form Fields */}
              {paymentMethod === 'credit_card' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Card Number
                    </label>
                    <input
                      type="text"
                      value={paymentInfo.cardNumber}
                      onChange={(e) => setPaymentInfo({...paymentInfo, cardNumber: e.target.value})}
                      placeholder="1234 5678 9012 3456"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Expiry Date
                      </label>
                      <input
                        type="text"
                        value={paymentInfo.expiryDate}
                        onChange={(e) => setPaymentInfo({...paymentInfo, expiryDate: e.target.value})}
                        placeholder="MM/YY"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        CVV
                      </label>
                      <input
                        type="text"
                        value={paymentInfo.cvv}
                        onChange={(e) => setPaymentInfo({...paymentInfo, cvv: e.target.value})}
                        placeholder="123"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Name on Card
                    </label>
                    <input
                      type="text"
                      value={paymentInfo.nameOnCard}
                      onChange={(e) => setPaymentInfo({...paymentInfo, nameOnCard: e.target.value})}
                      placeholder="John Doe"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
              )}

              {paymentMethod === 'upi' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    UPI ID
                  </label>
                  <input
                    type="text"
                    value={paymentInfo.upiId}
                    onChange={(e) => setPaymentInfo({...paymentInfo, upiId: e.target.value})}
                    placeholder="yourname@paytm"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              )}

              {paymentMethod === 'bank_transfer' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Bank Account Number
                  </label>
                  <input
                    type="text"
                    value={paymentInfo.bankAccount}
                    onChange={(e) => setPaymentInfo({...paymentInfo, bankAccount: e.target.value})}
                    placeholder="Account number"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Payment Summary */}
        <div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md sticky top-8">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Payment Summary</h2>
            </div>
            
            <div className="p-6">
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                  <span className="font-medium text-gray-900 dark:text-white">₹{totals.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">GST (18%)</span>
                  <span className="font-medium text-gray-900 dark:text-white">₹{totals.gst.toLocaleString()}</span>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold text-gray-900 dark:text-white">Total</span>
                    <span className="text-lg font-semibold text-blue-600 dark:text-blue-400">₹{totals.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleProcessPayment}
                disabled={processing}
                className="w-full bg-blue-900 dark:bg-blue-700 text-white py-3 px-6 rounded-md font-semibold hover:bg-blue-800 dark:hover:bg-blue-600 transition-colors flex items-center justify-center disabled:opacity-50"
              >
                {processing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Processing Payment...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-5 w-5 mr-2" />
                    Complete Payment
                  </>
                )}
              </button>

              <div className="mt-4 flex items-center text-gray-600 dark:text-gray-400 text-sm">
                <Shield className="h-4 w-4 mr-2" />
                <span>Your payment is secure and encrypted</span>
              </div>

              <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
                <p>By completing this purchase, you agree to our</p>
                <div className="space-x-2">
                  <Link to="/terms" className="text-blue-600 dark:text-blue-400 hover:underline">Terms of Service</Link>
                  <span>and</span>
                  <Link to="/privacy" className="text-blue-600 dark:text-blue-400 hover:underline">Privacy Policy</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;