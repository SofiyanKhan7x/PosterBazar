import React, { useState } from 'react';
import { 
  CreditCard, CheckCircle, AlertTriangle,
  Lock, X
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { VendorAdWorkflowService } from '../services/vendorAdWorkflow';

interface VendorPaymentProcessorProps {
  adRequestId: string;
  amount: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (paymentId: string) => void;
}

const VendorPaymentProcessor: React.FC<VendorPaymentProcessorProps> = ({
  adRequestId,
  amount,
  isOpen,
  onClose,
  onSuccess
}) => {
  const { user } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState('');
  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    nameOnCard: '',
    upiId: '',
    bankAccount: ''
  });

  const pricing = VendorAdWorkflowService.calculateAdPricing(amount, 1);

  const handlePayment = async () => {
    if (!user) {
      setMessage('User not authenticated');
      return;
    }

    setProcessing(true);
    setMessage('');

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Generate mock payment details
      const gatewayTransactionId = `TXN_${Date.now()}_${Math.random().toString(36).substring(2)}`;
      const gatewayPaymentId = `PAY_${Date.now()}_${Math.random().toString(36).substring(2)}`;

      const result = await VendorAdWorkflowService.processAdPayment(
        adRequestId,
        user.id,
        {
          amount: pricing.totalAmount,
          payment_method: paymentMethod,
          gateway_transaction_id: gatewayTransactionId,
          gateway_payment_id: gatewayPaymentId
        }
      );

      if (result.success && result.payment_id) {
        setMessage('Payment processed successfully! Your ad will be live shortly.');
        setTimeout(() => {
          onSuccess(result.payment_id!);
          onClose();
        }, 2000);
      } else {
        setMessage(result.error || 'Payment processing failed');
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      setMessage('Payment processing failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Complete Payment</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="p-6">
          {message && (
            <div className={`mb-6 p-4 rounded-lg border ${
              message.includes('successfully') 
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
            }`}>
              <div className="flex items-center">
                {message.includes('successfully') ? (
                  <CheckCircle className="h-5 w-5 mr-2" />
                ) : (
                  <AlertTriangle className="h-5 w-5 mr-2" />
                )}
                {message}
              </div>
            </div>
          )}

          {/* Payment Summary */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Payment Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Base Amount:</span>
                <span className="font-medium text-gray-900 dark:text-white">₹{pricing.baseAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Platform Fee (10%):</span>
                <span className="font-medium text-gray-900 dark:text-white">₹{pricing.platformFee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">GST (18%):</span>
                <span className="font-medium text-gray-900 dark:text-white">₹{pricing.gstAmount.toLocaleString()}</span>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-600 pt-2">
                <div className="flex justify-between">
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">Total Amount:</span>
                  <span className="text-lg font-semibold text-blue-600 dark:text-blue-400">₹{pricing.totalAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Payment Method</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div 
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  paymentMethod === 'credit_card' 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600'
                }`}
                onClick={() => setPaymentMethod('credit_card')}
              >
                <div className="flex justify-between mb-2">
                  <span className="font-medium text-gray-900 dark:text-white">Credit Card</span>
                  {paymentMethod === 'credit_card' && <CheckCircle className="h-5 w-5 text-blue-600" />}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Visa, Mastercard, Amex</p>
              </div>
              
              <div 
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  paymentMethod === 'upi' 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600'
                }`}
                onClick={() => setPaymentMethod('upi')}
              >
                <div className="flex justify-between mb-2">
                  <span className="font-medium text-gray-900 dark:text-white">UPI</span>
                  {paymentMethod === 'upi' && <CheckCircle className="h-5 w-5 text-blue-600" />}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">PhonePe, GPay, Paytm</p>
              </div>
              
              <div 
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  paymentMethod === 'bank_transfer' 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600'
                }`}
                onClick={() => setPaymentMethod('bank_transfer')}
              >
                <div className="flex justify-between mb-2">
                  <span className="font-medium text-gray-900 dark:text-white">Bank Transfer</span>
                  {paymentMethod === 'bank_transfer' && <CheckCircle className="h-5 w-5 text-blue-600" />}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">NEFT/RTGS/IMPS</p>
              </div>
            </div>
          </div>

          {/* Payment Form Fields */}
          {paymentMethod === 'credit_card' && (
            <div className="mb-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Card Number
                </label>
                <input
                  type="text"
                  value={paymentData.cardNumber}
                  onChange={(e) => setPaymentData({...paymentData, cardNumber: e.target.value})}
                  placeholder="1234 5678 9012 3456"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="text"
                    value={paymentData.expiryDate}
                    onChange={(e) => setPaymentData({...paymentData, expiryDate: e.target.value})}
                    placeholder="MM/YY"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    CVV
                  </label>
                  <input
                    type="text"
                    value={paymentData.cvv}
                    onChange={(e) => setPaymentData({...paymentData, cvv: e.target.value})}
                    placeholder="123"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name on Card
                </label>
                <input
                  type="text"
                  value={paymentData.nameOnCard}
                  onChange={(e) => setPaymentData({...paymentData, nameOnCard: e.target.value})}
                  placeholder="John Doe"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          )}

          {paymentMethod === 'upi' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                UPI ID
              </label>
              <input
                type="text"
                value={paymentData.upiId}
                onChange={(e) => setPaymentData({...paymentData, upiId: e.target.value})}
                placeholder="yourname@paytm"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          )}

          {paymentMethod === 'bank_transfer' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Bank Account Number
              </label>
              <input
                type="text"
                value={paymentData.bankAccount}
                onChange={(e) => setPaymentData({...paymentData, bankAccount: e.target.value})}
                placeholder="Account number"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          )}

          {/* Security Notice */}
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center">
              <Lock className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
              <div>
                <p className="text-green-800 dark:text-green-200 font-medium">Secure Payment</p>
                <p className="text-green-700 dark:text-green-300 text-sm">
                  Your payment is encrypted and secure. You'll receive a confirmation email after successful payment.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              onClick={onClose}
              disabled={processing}
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handlePayment}
              disabled={processing}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50 flex items-center"
            >
              {processing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing Payment...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Pay ₹{pricing.totalAmount.toLocaleString()}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorPaymentProcessor;