import React, { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  CheckCircle, Download, Share2, Home
} from 'lucide-react';

interface BookingSuccessState {
  bookingIds: string[];
  totalAmount: number;
  paymentId: string;
  billboards?: Array<{
    title: string;
    location: string;
    startDate: string;
    endDate: string;
    side: string;
    amount: number;
  }>;
}

const BookingSuccess: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as BookingSuccessState;

  useEffect(() => {
    // Redirect to dashboard if no booking data
    if (!state || !state.bookingIds || state.bookingIds.length === 0) {
      navigate('/dashboard');
    }
  }, [state, navigate]);

  const handleDownloadReceipt = () => {
    // Generate and download receipt
    const receiptData = {
      bookingIds: state.bookingIds,
      totalAmount: state.totalAmount,
      paymentId: state.paymentId,
      date: new Date().toISOString(),
      gstAmount: state.totalAmount * 0.18,
      subtotal: state.totalAmount / 1.18
    };

    const receiptContent = `
POSTERBAZAR - BOOKING RECEIPT
==============================

Payment ID: ${state.paymentId}
Date: ${new Date().toLocaleString()}
Booking IDs: ${state.bookingIds.join(', ')}

${state.billboards ? state.billboards.map(b => 
  `Billboard: ${b.title}
Location: ${b.location}
Dates: ${new Date(b.startDate).toLocaleDateString()} - ${new Date(b.endDate).toLocaleDateString()}
Side: ${b.side}
Amount: ₹${b.amount.toLocaleString()}
`).join('\n') : ''}

Subtotal: ₹${receiptData.subtotal.toLocaleString()}
GST (18%): ₹${receiptData.gstAmount.toLocaleString()}
Total: ₹${state.totalAmount.toLocaleString()}

Thank you for choosing PosterBazar!
    `;

    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `posterbazar-receipt-${state.paymentId}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    const shareData = {
      title: 'Billboard Booking Successful',
      text: `I just booked ${state.bookingIds.length} billboard(s) on PosterBazar! ${state.billboards ? state.billboards.map(b => `${b.title} (${new Date(b.startDate).toLocaleDateString()} - ${new Date(b.endDate).toLocaleDateString()})`).join(', ') : ''}`,
      url: window.location.origin
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
      alert('Booking details copied to clipboard!');
    }
  };

  if (!state) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden">
          {/* Success Header */}
          <div className="bg-gradient-to-r from-green-500 to-green-600 p-8 text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-white mb-4">
              <CheckCircle className="h-10 w-10 text-green-500" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Booking Successful!</h1>
            <p className="text-green-100">
              Your {state.bookingIds.length} billboard booking(s) have been confirmed and payment processed.
            </p>
          </div>

          {/* Booking Details */}
          <div className="p-8">
            {/* Booked Billboards List */}
            {state.billboards && state.billboards.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Booked Billboards</h3>
                <div className="space-y-4">
                  {state.billboards.map((billboard, index) => (
                    <div key={index} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">{billboard.title}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{billboard.location}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Side: {billboard.side === 'SINGLE' ? 'Single Side' : 
                                   billboard.side === 'A' ? 'Side A' :
                                   billboard.side === 'B' ? 'Side B' : 'Both Sides'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900 dark:text-white">₹{billboard.amount.toLocaleString()}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {new Date(billboard.startDate).toLocaleDateString()} - {new Date(billboard.endDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Payment Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Payment ID:</span>
                    <span className="font-mono text-gray-900 dark:text-white">{state.paymentId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Total Amount:</span>
                    <span className="font-semibold text-green-600 dark:text-green-400">₹{state.totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Payment Date:</span>
                    <span className="text-gray-900 dark:text-white">{new Date().toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Booking Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Billboards Booked:</span>
                    <span className="font-semibold text-blue-600 dark:text-blue-400">{state.bookingIds.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Status:</span>
                    <span className="text-yellow-600 dark:text-yellow-400 font-medium">Pending Approval</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Booking IDs:</span>
                    <span className="font-mono text-xs text-gray-900 dark:text-white">
                      {state.bookingIds.length > 2 
                        ? `${state.bookingIds.slice(0, 2).join(', ')}...` 
                        : state.bookingIds.join(', ')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 mb-8">
              <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-3">What happens next?</h3>
              <div className="space-y-2 text-sm text-yellow-700 dark:text-yellow-300">
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-yellow-600 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">1</div>
                  <span>Billboard owners will review your booking requests</span>
                </div>
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-yellow-600 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">2</div>
                  <span>You'll receive email notifications about approval status</span>
                </div>
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-yellow-600 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">3</div>
                  <span>Approved bookings will become active on the start date</span>
                </div>
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-yellow-600 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">4</div>
                  <span>Track your campaigns in the dashboard</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={handleDownloadReceipt}
                className="flex items-center justify-center bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 py-3 px-6 rounded-md font-semibold hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
              >
                <Download className="h-5 w-5 mr-2" />
                Download Receipt
              </button>
              
              <button
                onClick={handleShare}
                className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-md font-semibold transition-colors"
              >
                <Share2 className="h-5 w-5 mr-2" />
                Share Success
              </button>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Link
                to="/dashboard"
                className="flex-1 flex items-center justify-center bg-blue-900 dark:bg-blue-700 text-white py-3 px-6 rounded-md font-semibold hover:bg-blue-800 dark:hover:bg-blue-600 transition-colors"
              >
                <Home className="h-5 w-5 mr-2" />
                Go to Dashboard
              </Link>
              
              <Link
                to="/explore"
                className="flex-1 flex items-center justify-center bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 py-3 px-6 rounded-md font-semibold hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
              >
                Book More Billboards
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingSuccess;