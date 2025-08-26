// import React, { useState, useEffect } from 'react';
// import { useParams, useNavigate, Link } from 'react-router-dom';
// import { 
//    ArrowLeft, Calendar, CreditCard, Clock, CheckCircle, 
//    Info, Shield, MapPin, User, Mail, Phone, IndianRupee
// } from 'lucide-react';
// import { useAuth } from '../hooks/useAuth';
// import { CartService } from '../services/cartService';
// import TwoSidedBillboardSelector from '../components/TwoSidedBillboardSelector';
// import { billboards as mockBillboards } from '../data/mockData';

// const BookingPage: React.FC = () => {
//   const { id } = useParams<{ id: string }>();
//   const navigate = useNavigate();
//   const { user } = useAuth();
//   const [billboard, setBillboard] = useState<any | null>(null);
//   const [selectedSide, setSelectedSide] = useState<'A' | 'B' | 'BOTH' | 'SINGLE'>('SINGLE');
//   const [startDate, setStartDate] = useState<string>('');
//   const [endDate, setEndDate] = useState<string>('');
//   const [totalDays, setTotalDays] = useState<number>(0);
//   const [totalPrice, setTotalPrice] = useState<number>(0);
//   const [gstAmount, setGstAmount] = useState<number>(0);
//   const [finalAmount, setFinalAmount] = useState<number>(0);
//   const [adType, setAdType] = useState<string>('static');
//   const [paymentMethod, setPaymentMethod] = useState<string>('credit_card');
//   const [adContent, setAdContent] = useState<string>('');
//   const [isProcessing, setIsProcessing] = useState(false);
//   const [bookingStep, setBookingStep] = useState<'details' | 'payment' | 'confirmation'>('details');
//   const [message, setMessage] = useState('');
  
//   // Contact Information
//   const [contactInfo, setContactInfo] = useState({
//     name: user?.name || '',
//     email: user?.email || '',
//     phone: user?.phone || '',
//     company: ''
//   });

//   // Payment Information
//   const [paymentInfo, setPaymentInfo] = useState({
//     cardNumber: '',
//     expiryDate: '',
//     cvv: '',
//     nameOnCard: '',
//     upiId: '',
//     bankAccount: ''
//   });

//   // Mock two-sided billboard data
//   const [billboardSides, setBillboardSides] = useState([
//     {
//       id: 'side-1',
//       billboard_id: id || '',
//       side_identifier: 'SINGLE' as const,
//       side_name: 'Main Display',
//       description: 'Primary billboard display',
//       price_per_day: 0,
//       is_available: true,
//       created_at: new Date().toISOString(),
//       updated_at: new Date().toISOString()
//     }
//   ]);
  
//   useEffect(() => {
//     if (id) {
//       const found = mockBillboards.find(b => b.id === id);
//       if (found) {
//         const transformedBillboard = {
//           id: found.id,
//           title: found.title,
//           location: `${found.city}, ${found.state}`,
//           pricePerDay: found.price_per_day,
//           minDays: found.min_days,
//           imageUrl: found.imageUrl,
//           is_two_sided: found.is_two_sided || false,
//           billboard_sides: found.billboard_sides || []
//         };
//         setBillboard(transformedBillboard);
        
//         // Update billboard sides with actual price
//         setBillboardSides([{
//           id: 'side-1',
//           billboard_id: found.id,
//           side_identifier: 'SINGLE' as const,
//           side_name: 'Main Display',
//           description: 'Primary billboard display',
//           price_per_day: found.price_per_day,
//           is_available: true,
//           created_at: new Date().toISOString(),
//           updated_at: new Date().toISOString()
//         }]);
//       }
//     }
//   }, [id]);

//   useEffect(() => {
//     if (startDate && endDate) {
//       const start = new Date(startDate);
//       const end = new Date(endDate);
//       const diffTime = Math.abs(end.getTime() - start.getTime());
//       const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
//       setTotalDays(diffDays);
//       if (billboard) {
//         const basePrice = diffDays * billboard.pricePerDay;
//         const gst = basePrice * 0.18; // 18% GST
//         setTotalPrice(basePrice);
//         setGstAmount(gst);
//         setFinalAmount(basePrice + gst);
//       }
//     }
//   }, [id]);

//   useEffect(() => {
//     if (startDate && endDate) {
//       const start = new Date(startDate);
//       const end = new Date(endDate);
//       const diffTime = Math.abs(end.getTime() - start.getTime());
//       const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
//       setTotalDays(diffDays);
//       if (billboard) {
//         const basePrice = diffDays * billboard.pricePerDay;
//         const gst = basePrice * 0.18; // 18% GST
//         setTotalPrice(basePrice);
//         setGstAmount(gst);
//         setFinalAmount(basePrice + gst);
//       }
//     }
//   }, [startDate, endDate, billboard]);
  
//   const formatDate = (date: Date): string => {
//     return date.toISOString().split('T')[0];
//   };
  
//   const handleNextStep = () => {
//     if (bookingStep === 'details') {
//       setBookingStep('payment');
//     } else if (bookingStep === 'payment') {
//       handleSubmit();
//     }
//   };

//   const handlePreviousStep = () => {
//     if (bookingStep === 'payment') {
//       setBookingStep('details');
//     }
//   };
  
//   const handleSubmit = async () => {
//     setIsProcessing(true);
    
//     try {
//       // Simulate payment processing
//       await new Promise(resolve => setTimeout(resolve, 3000));
      
//       // Add to cart and process booking
//       if (user && billboard) {
//         await CartService.addToCart(
//           user.id,
//           billboard.id,
//           selectedSide,
//           startDate,
//           endDate,
//           adContent,
//           adType
//         );
        
//         // Process immediate checkout
//         const result = await CartService.processCartCheckout(user.id);
        
//         if (result.success) {
//           setBookingStep('confirmation');
//         } else {
//           setMessage('Booking failed: ' + (result.errors?.join(', ') || 'Unknown error'));
//         }
//       }
//     } catch (error: any) {
//       setMessage('Booking failed: ' + error.message);
//     }
    
//     setIsProcessing(false);
//   };

//   const handleAddToCart = async (side: 'A' | 'B' | 'BOTH' | 'SINGLE') => {
//     if (!user) {
//       navigate('/login');
//       return;
//     }

//     if (!startDate || !endDate) {
//       setMessage('Please select booking dates');
//       return;
//     }

//     try {
//       setIsProcessing(true);
//       setMessage('');
      
//       // Get billboard side information for pricing
//       const selectedSide = billboardSides.find(s => s.side_identifier === side) || billboardSides[0];
//       const pricePerDay = selectedSide?.price_per_day || billboard.pricePerDay;
      
//       await CartService.addToCart(
//         user.id,
//         billboard.id,
//         side,
//         startDate,
//         endDate,
//         adContent || '',
//         adType || 'static',
//         pricePerDay
//       );
      
//       setMessage('Billboard added to cart successfully!');
//       setSelectedSide(side);
      
//       // Refresh cart count in navbar
//       window.dispatchEvent(new CustomEvent('cartUpdated'));
//     } catch (error: any) {
//       setMessage('Failed to add to cart: ' + error.message);
//     } finally {
//       setIsProcessing(false);
//     }
//   };

//   const handleConfirmBooking = (e: React.FormEvent) => {
//     e.preventDefault();
//     navigate('/booking-success', {
//       state: {
//         bookingIds: [`booking_${Date.now()}`],
//         totalAmount: finalAmount,
//         paymentId: `PAY_${Date.now()}_${Math.random().toString(36).substring(2)}`
//       }
//     });
//   };
  
//   if (!billboard) {
//     return (
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
//         <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Billboard Not Found</h2>
//         <p className="text-gray-600 dark:text-gray-300 mb-6">The billboard you're looking for doesn't exist or has been removed.</p>
//         <Link 
//           to="/explore" 
//           className="inline-flex items-center text-blue-900 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
//         >
//           <ArrowLeft className="h-5 w-5 mr-2" />
//           Back to Explore
//         </Link>
//       </div>
//     );
//   }

//   // Redirect to login if not authenticated
//   if (!user) {
//     return (
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
//         <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Login Required</h2>
//         <p className="text-gray-600 dark:text-gray-300 mb-6">Please log in to book this billboard.</p>
//         <Link 
//           to="/login" 
//           className="inline-flex items-center text-blue-900 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
//         >
//           Go to Login
//         </Link>
//       </div>
//     );
//   }

//   return (
//     <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
//       <Link 
//         to={`/billboard/${id}`} 
//         className="inline-flex items-center text-blue-900 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mb-6"
//       >
//         <ArrowLeft className="h-5 w-5 mr-2" />
//         Back to Billboard Details
//       </Link>
      
//       <div className="mb-8">
//         <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Book Your Billboard</h1>
        
//         {/* Progress Steps */}
//         <div className="flex items-center space-x-4 mb-6">
//           <div className={`flex items-center ${bookingStep === 'details' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`}>
//             <div className={`w-8 h-8 rounded-full flex items-center justify-center ${bookingStep === 'details' ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'}`}>1</div>
//             <span className="ml-2 font-medium">Booking Details</span>
//           </div>
//           <div className="w-8 h-px bg-gray-300"></div>
//           <div className={`flex items-center ${bookingStep === 'payment' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`}>
//             <div className={`w-8 h-8 rounded-full flex items-center justify-center ${bookingStep === 'payment' ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'}`}>2</div>
//             <span className="ml-2 font-medium">Payment</span>
//           </div>
//           <div className="w-8 h-px bg-gray-300"></div>
//           <div className={`flex items-center ${bookingStep === 'confirmation' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`}>
//             <div className={`w-8 h-8 rounded-full flex items-center justify-center ${bookingStep === 'confirmation' ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'}`}>3</div>
//             <span className="ml-2 font-medium">Confirmation</span>
//           </div>
//         </div>
//       </div>
      
//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//         <div className="lg:col-span-2">
//           {bookingStep === 'details' && (
//             <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-8">
//               {message && (
//                 <div className={`mb-6 p-4 rounded-lg border ${
//                   message.includes('successfully') 
//                     ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
//                     : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
//                 }`}>
//                   {message}
//                 </div>
//               )}

//               <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
//                 <Calendar className="h-6 w-6 mr-2 text-blue-900 dark:text-blue-400" />
//                 Booking Details
//               </h2>
              
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
//                 <div>
//                   <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
//                     Start Date
//                   </label>
//                   <input
//                     type="date"
//                     id="startDate"
//                     value={startDate}
//                     onChange={(e) => setStartDate(e.target.value)}
//                     min={formatDate(new Date())}
//                     className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
//                     required
//                   />
//                 </div>
//                 <div>
//                   <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
//                     End Date
//                   </label>
//                   <input
//                     type="date"
//                     id="endDate"
//                     value={endDate}
//                     onChange={(e) => setEndDate(e.target.value)}
//                     min={startDate}
//                     className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
//                     required
//                   />
//                 </div>
//               </div>
              
//               <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Advertisement Type</h3>
//               <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
//                 <div 
//                   className={`border ${
//                     adType === 'static' ? 'border-blue-900 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-600'
//                   } rounded-md p-4 cursor-pointer hover:border-blue-900 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors`}
//                   onClick={() => setAdType('static')}
//                 >
//                   <div className="flex justify-between mb-2">
//                     <span className="font-medium text-gray-900 dark:text-white">Static</span>
//                     {adType === 'static' && <CheckCircle className="h-5 w-5 text-blue-900 dark:text-blue-400" />}
//                   </div>
//                   <p className="text-sm text-gray-600 dark:text-gray-400">Standard printed advertisement</p>
//                 </div>
//                 <div 
//                   className={`border ${
//                     adType === 'digital' ? 'border-blue-900 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-600'
//                   } rounded-md p-4 cursor-pointer hover:border-blue-900 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors`}
//                   onClick={() => setAdType('digital')}
//                 >
//                   <div className="flex justify-between mb-2">
//                     <span className="font-medium text-gray-900 dark:text-white">Digital</span>
//                     {adType === 'digital' && <CheckCircle className="h-5 w-5 text-blue-900 dark:text-blue-400" />}
//                   </div>
//                   <p className="text-sm text-gray-600 dark:text-gray-400">Digital display with video/animation</p>
//                 </div>
//                 <div 
//                   className={`border ${
//                     adType === 'interactive' ? 'border-blue-900 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-600'
//                   } rounded-md p-4 cursor-pointer hover:border-blue-900 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors`}
//                   onClick={() => setAdType('interactive')}
//                 >
//                   <div className="flex justify-between mb-2">
//                     <span className="font-medium text-gray-900 dark:text-white">Interactive</span>
//                     {adType === 'interactive' && <CheckCircle className="h-5 w-5 text-blue-900 dark:text-blue-400" />}
//                   </div>
//                   <p className="text-sm text-gray-600 dark:text-gray-400">Interactive display with QR codes</p>
//                 </div>
//               </div>
              
//               <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Advertisement Content</h3>
//               <div className="mb-6">
//                 <textarea
//                   value={adContent}
//                   onChange={(e) => setAdContent(e.target.value)}
//                   placeholder="Describe your advertisement content..."
//                   rows={4}
//                   className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
//                 ></textarea>
//                 <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
//                   You can describe your advertisement here or upload design files after booking is confirmed.
//                 </p>
//               </div>
              
//               {/* Contact Information */}
//               <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Contact Information</h3>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
//                 <div>
//                   <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
//                     Full Name *
//                   </label>
//                   <div className="relative">
//                     <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
//                     <input
//                       type="text"
//                       id="name"
//                       value={contactInfo.name}
//                       onChange={(e) => setContactInfo({...contactInfo, name: e.target.value})}
//                       className="pl-10 w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
//                       required
//                     />
//                   </div>
//                 </div>
//                 <div>
//                   <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
//                     Email Address *
//                   </label>
//                   <div className="relative">
//                     <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
//                     <input
//                       type="email"
//                       id="email"
//                       value={contactInfo.email}
//                       onChange={(e) => setContactInfo({...contactInfo, email: e.target.value})}
//                       className="pl-10 w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
//                       required
//                     />
//                   </div>
//                 </div>
//                 <div>
//                   <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
//                     Phone Number *
//                   </label>
//                   <div className="relative">
//                     <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
//                     <input
//                       type="tel"
//                       id="phone"
//                       value={contactInfo.phone}
//                       onChange={(e) => setContactInfo({...contactInfo, phone: e.target.value})}
//                       className="pl-10 w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
//                       required
//                     />
//                   </div>
//                 </div>
//                 <div>
//                   <label htmlFor="company" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
//                     Company Name
//                   </label>
//                   <input
//                     type="text"
//                     id="company"
//                     value={contactInfo.company}
//                     onChange={(e) => setContactInfo({...contactInfo, company: e.target.value})}
//                     className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
//                   />
//                 </div>
//               </div>

//               <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-md p-4 flex">
//                 <Info className="h-5 w-5 text-blue-900 dark:text-blue-400 mr-3 flex-shrink-0 mt-0.5" />
//                 <div>
//                   <p className="text-sm text-blue-900 dark:text-blue-300">
//                     <span className="font-medium">Note: </span>
//                     All bookings are subject to approval by the billboard owner. You'll be notified once your booking is approved.
//                   </p>
//                 </div>
//               </div>

//               {/* Two-Sided Billboard Selector */}
//               {startDate && endDate && billboard && (
//                 <div className="mt-8">
//                   <TwoSidedBillboardSelector
//                     billboardId={billboard.id}
//                     sides={billboard.billboard_sides || billboardSides}
//                     startDate={startDate}
//                     endDate={endDate}
//                     onSideSelect={setSelectedSide}
//                     onAddToCart={handleAddToCart}
//                     selectedSide={selectedSide}
//                   />
//                 </div>
//               )}
//             </div>
//           )}

//           {bookingStep === 'payment' && (
//             <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-8">
//               <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
//                 <CreditCard className="h-6 w-6 mr-2 text-blue-900 dark:text-blue-400" />
//                 Payment Details
//               </h2>
              
//               <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Payment Method</h3>
//               <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
//                 <div 
//                   className={`border ${
//                     paymentMethod === 'credit_card' ? 'border-blue-900 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-600'
//                   } rounded-md p-4 cursor-pointer hover:border-blue-900 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors`}
//                   onClick={() => setPaymentMethod('credit_card')}
//                 >
//                   <div className="flex justify-between mb-2">
//                     <span className="font-medium text-gray-900 dark:text-white">Credit Card</span>
//                     {paymentMethod === 'credit_card' && <CheckCircle className="h-5 w-5 text-blue-900 dark:text-blue-400" />}
//                   </div>
//                   <p className="text-sm text-gray-600 dark:text-gray-400">Visa, Mastercard, Amex</p>
//                 </div>
//                 <div 
//                   className={`border ${
//                     paymentMethod === 'upi' ? 'border-blue-900 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-600'
//                   } rounded-md p-4 cursor-pointer hover:border-blue-900 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors`}
//                   onClick={() => setPaymentMethod('upi')}
//                 >
//                   <div className="flex justify-between mb-2">
//                     <span className="font-medium text-gray-900 dark:text-white">UPI</span>
//                     {paymentMethod === 'upi' && <CheckCircle className="h-5 w-5 text-blue-900 dark:text-blue-400" />}
//                   </div>
//                   <p className="text-sm text-gray-600 dark:text-gray-400">PhonePe, GPay, Paytm</p>
//                 </div>
//                 <div 
//                   className={`border ${
//                     paymentMethod === 'bank_transfer' ? 'border-blue-900 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-600'
//                   } rounded-md p-4 cursor-pointer hover:border-blue-900 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors`}
//                   onClick={() => setPaymentMethod('bank_transfer')}
//                 >
//                   <div className="flex justify-between mb-2">
//                     <span className="font-medium text-gray-900 dark:text-white">Bank Transfer</span>
//                     {paymentMethod === 'bank_transfer' && <CheckCircle className="h-5 w-5 text-blue-900 dark:text-blue-400" />}
//                   </div>
//                   <p className="text-sm text-gray-600 dark:text-gray-400">NEFT/RTGS/IMPS</p>
//                 </div>
//               </div>
              
//               {paymentMethod === 'credit_card' && (
//                 <div className="mb-8">
//                   <div className="mb-4">
//                     <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
//                       Card Number
//                     </label>
//                     <input
//                       type="text"
//                       id="cardNumber"
//                       value={paymentInfo.cardNumber}
//                       onChange={(e) => setPaymentInfo({...paymentInfo, cardNumber: e.target.value})}
//                       placeholder="1234 5678 9012 3456"
//                       className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
//                     />
//                   </div>
                  
//                   <div className="grid grid-cols-2 gap-4 mb-4">
//                     <div>
//                       <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
//                         Expiry Date
//                       </label>
//                       <input
//                         type="text"
//                         id="expiryDate"
//                         value={paymentInfo.expiryDate}
//                         onChange={(e) => setPaymentInfo({...paymentInfo, expiryDate: e.target.value})}
//                         placeholder="MM/YY"
//                         className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
//                       />
//                     </div>
//                     <div>
//                       <label htmlFor="cvv" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
//                         CVV
//                       </label>
//                       <input
//                         type="text"
//                         id="cvv"
//                         value={paymentInfo.cvv}
//                         onChange={(e) => setPaymentInfo({...paymentInfo, cvv: e.target.value})}
//                         placeholder="123"
//                         className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
//                       />
//                     </div>
//                   </div>
                  
//                   <div>
//                     <label htmlFor="nameOnCard" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
//                       Name on Card
//                     </label>
//                     <input
//                       type="text"
//                       id="nameOnCard"
//                       value={paymentInfo.nameOnCard}
//                       onChange={(e) => setPaymentInfo({...paymentInfo, nameOnCard: e.target.value})}
//                       placeholder="Rajesh Kumar"
//                       className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
//                     />
//                   </div>
//                 </div>
//               )}

//               {paymentMethod === 'upi' && (
//                 <div className="mb-8">
//                   <div>
//                     <label htmlFor="upiId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
//                       UPI ID
//                     </label>
//                     <input
//                       type="text"
//                       id="upiId"
//                       value={paymentInfo.upiId}
//                       onChange={(e) => setPaymentInfo({...paymentInfo, upiId: e.target.value})}
//                       placeholder="yourname@paytm"
//                       className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
//                     />
//                   </div>
//                 </div>
//               )}

//               {paymentMethod === 'bank_transfer' && (
//                 <div className="mb-8">
//                   <div>
//                     <label htmlFor="bankAccount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
//                       Bank Account Number
//                     </label>
//                     <input
//                       type="text"
//                       id="bankAccount"
//                       value={paymentInfo.bankAccount}
//                       onChange={(e) => setPaymentInfo({...paymentInfo, bankAccount: e.target.value})}
//                       placeholder="Account number"
//                       className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
//                     />
//                   </div>
//                 </div>
//               )}
              
//               <div className="flex items-center mb-6">
//                 <input
//                   type="checkbox"
//                   id="terms"
//                   className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700"
//                   required
//                 />
//                 <label htmlFor="terms" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
//                   I agree to the <a href="#" className="text-blue-900 dark:text-blue-400 hover:underline">Terms of Service</a> and <a href="#" className="text-blue-900 dark:text-blue-400 hover:underline">Privacy Policy</a>
//                 </label>
//               </div>
              
//               <div className="flex items-center text-gray-600 dark:text-gray-400 mb-6 bg-gray-50 dark:bg-gray-700 p-4 rounded-md">
//                 <Shield className="h-5 w-5 text-green-600 dark:text-green-400 mr-3 flex-shrink-0" />
//                 <p className="text-sm">
//                   Your payment is secure and encrypted. You won't be charged until your booking is approved by the billboard owner.
//                 </p>
//               </div>
//             </div>
//           )}

//           {bookingStep === 'confirmation' && (
//             <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-8 text-center">
//               <div className="mb-6">
//                 <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
//                 <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Booking Confirmed!</h2>
//                 <p className="text-gray-600 dark:text-gray-300">
//                   Your booking request has been submitted successfully. The billboard owner will review and approve your request.
//                 </p>
//               </div>
              
//               <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-6">
//                 <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Booking Reference</h3>
//                 <p className="text-lg font-mono text-blue-600 dark:text-blue-400">BH-{Date.now().toString().slice(-8)}</p>
//               </div>
              
//               <div className="space-y-4">
//                 <button
//                   onClick={handleConfirmBooking}
//                   className="w-full bg-blue-900 dark:bg-blue-700 text-white py-3 px-6 rounded-md font-semibold hover:bg-blue-800 dark:hover:bg-blue-600 transition-colors"
//                 >
//                   Go to Dashboard
//                 </button>
//                 <Link
//                   to="/explore"
//                   className="block w-full bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 py-3 px-6 rounded-md font-semibold text-center hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
//                 >
//                   Book Another Billboard
//                 </Link>
//               </div>
//             </div>
//           )}

//           {/* Navigation Buttons */}
//           {bookingStep !== 'confirmation' && (
//             <div className="flex justify-between">
//               {bookingStep === 'payment' && (
//                 <button
//                   onClick={handlePreviousStep}
//                   className="bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 py-3 px-6 rounded-md font-semibold hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
//                 >
//                   Previous
//                 </button>
//               )}
              
//               <button
//                 onClick={handleNextStep}
//                 disabled={isProcessing}
//                 className={`ml-auto bg-blue-900 dark:bg-blue-700 text-white py-3 px-6 rounded-md font-semibold hover:bg-blue-800 dark:hover:bg-blue-600 transition-colors flex items-center ${
//                   isProcessing ? 'opacity-70 cursor-not-allowed' : ''
//                 }`}
//               >
//                 {isProcessing ? (
//                   <>
//                     <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
//                     Processing...
//                   </>
//                 ) : (
//                   bookingStep === 'details' ? 'Continue to Payment' : 'Complete Booking'
//                 )}
//               </button>
//             </div>
//           )}
//         </div>
        
//         <div>
//           <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md sticky top-8">
//             <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Booking Summary</h2>
            
//             <div className="flex items-start mb-6">
//               <div className="h-20 w-20 rounded-md overflow-hidden flex-shrink-0">
//                 <img src={billboard.imageUrl} alt={billboard.title} className="w-full h-full object-cover" />
//               </div>
//               <div className="ml-4">
//                 <h3 className="font-semibold text-gray-900 dark:text-white">{billboard.title}</h3>
//                 <div className="flex items-center text-gray-600 dark:text-gray-400 mt-1">
//                   <MapPin className="h-4 w-4 mr-1" />
//                   <span className="text-sm">{billboard.location}</span>
//                 </div>
//               </div>
//             </div>
            
//             <div className="border-t border-b border-gray-200 dark:border-gray-700 py-4 mb-4">
//               <div className="flex justify-between items-center mb-2">
//                 <span className="text-gray-700 dark:text-gray-300">Dates</span>
//                 <span className="text-sm text-gray-900 dark:text-white">
//                   {startDate ? new Date(startDate).toLocaleDateString() : 'Not selected'} 
//                   {' - '} 
//                   {endDate ? new Date(endDate).toLocaleDateString() : 'Not selected'}
//                 </span>
//               </div>
//               <div className="flex justify-between items-center mb-2">
//                 <span className="text-gray-700 dark:text-gray-300">Duration</span>
//                 <span className="text-sm text-gray-900 dark:text-white">{totalDays} days</span>
//               </div>
//               <div className="flex justify-between items-center mb-2">
//                 <span className="text-gray-700 dark:text-gray-300">Selected Side</span>
//                 <span className="text-sm text-gray-900 dark:text-white">
//                   {selectedSide === 'SINGLE' ? 'Single Side' : 
//                    selectedSide === 'A' ? 'Side A' :
//                    selectedSide === 'B' ? 'Side B' : 'Both Sides'}
//                 </span>
//               </div>
//               <div className="flex justify-between items-center">
//                 <span className="text-gray-700 dark:text-gray-300">Daily Rate</span>
//                 <span className="text-sm text-gray-900 dark:text-white">₹{billboard.pricePerDay.toLocaleString()}</span>
//               </div>
//             </div>
            
//             <div className="mb-6">
//               <div className="flex justify-between items-center mb-2">
//                 <span className="text-gray-700 dark:text-gray-300">Subtotal</span>
//                 <span className="text-sm text-gray-900 dark:text-white">₹{totalPrice.toLocaleString()}</span>
//               </div>
//               <div className="flex justify-between items-center mb-2">
//                 <span className="text-gray-700 dark:text-gray-300">GST (18%)</span>
//                 <span className="text-sm text-gray-900 dark:text-white">₹{gstAmount.toLocaleString()}</span>
//               </div>
//               <div className="flex justify-between items-center font-semibold text-lg mt-4">
//                 <span className="text-gray-900 dark:text-white">Total</span>
//                 <div className="flex items-center text-blue-600 dark:text-blue-400">
//                   <IndianRupee className="h-5 w-5 mr-1" />
//                   <span className="text-xl font-bold">₹{finalAmount.toLocaleString()}</span>
//                 </div>
//               </div>
//             </div>
            
//             {bookingStep === 'payment' && (
//               <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-md p-4 text-sm text-green-800 dark:text-green-200 mb-4">
//                 <div className="flex">
//                   <Shield className="h-5 w-5 mr-3 flex-shrink-0 mt-0.5 text-green-700 dark:text-green-400" />
//                   <p>
//                     Your payment information is encrypted and secure. We use industry-standard security measures to protect your data.
//                   </p>
//                 </div>
//               </div>
//             )}

//             <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-md p-4 text-sm text-yellow-800 dark:text-yellow-300">
//               <div className="flex">
//                 <Clock className="h-5 w-5 mr-3 flex-shrink-0 mt-0.5 text-yellow-700 dark:text-yellow-400" />
//                 <p>
//                   Bookings typically get approved within 24-48 hours. You'll be notified once the billboard owner reviews your request.
//                 </p>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default BookingPage;


import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  CreditCard,
  Clock,
  CheckCircle,
  Info,
  IndianRupee,
  Mail,
  Phone,
  Shield,
  User,
} from "lucide-react";
import { supabase } from "../services/supabase";
import { useAuth } from "../hooks/useAuth";
import { CartService } from "../services/cartService";
import TwoSidedBillboardSelector from "../components/TwoSidedBillboardSelector";

const BookingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [billboard, setBillboard] = useState<any | null>(null);
  const [selectedSide, setSelectedSide] = useState<
    "A" | "B" | "BOTH" | "SINGLE"
  >("SINGLE");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [totalDays, setTotalDays] = useState<number>(0);
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [gstAmount, setGstAmount] = useState<number>(0);
  const [finalAmount, setFinalAmount] = useState<number>(0);
  const [adType, setAdType] = useState<string>("static");
  const [paymentMethod, setPaymentMethod] = useState<string>("credit_card");
  const [adContent, setAdContent] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [bookingStep, setBookingStep] = useState<
    "details" | "payment" | "confirmation"
  >("details");
  const [message, setMessage] = useState<string>("");

  const [contactInfo, setContactInfo] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    company: "",
  });

  const [paymentInfo, setPaymentInfo] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    nameOnCard: "",
    upiId: "",
    bankAccount: "",
  });

  const [billboardSides, setBillboardSides] = useState<any[]>([]);

  // Fetch billboard data from Supabase on mount or id change
  useEffect(() => {
    async function fetchBillboard() {
      if (!id) return;

      try {
        const { data, error } = await supabase
          .from("billboards")
          .select(
            `
          *,
          billboard_images(id, image_url, image_type, display_order),
          billboard_sides(id, side_identifier, side_name, description, price_per_day, is_available)
        `
          )
          .eq("id", id)
          .single();

        if (error) throw error;

        if (data) {
          const mainImage =
            data.billboard_images?.find((img: any) => img.image_type === "main")
              ?.image_url ||
            data.billboard_images?.[0]?.image_url ||
            "";

          const transformedBillboard = {
            id: data.id,
            title: data.title,
            location: `${data.city}, ${data.state}`,
            pricePerDay: data.price_per_day,
            minDays: data.min_days,
            owner: data.owner_name || "Billboard Owner",
            impressions: data.daily_views || 0,
            type: data.type || "digital",
            size: data.size || "large",
            dimensions: data.dimensions,
            facing: data.facing,
            features: data.features || [],
            description: data.description || "",
            additionalInfo:
              data.additional_info || "Located in high-traffic area",
            imageUrl: mainImage,
            additionalImages:
              data.billboard_images
                ?.filter((img: any) => img.image_type !== "main")
                .map((img: any) => img.image_url) || [],
            billboard_sides: data.billboard_sides || [],
            is_two_sided: data.is_two_sided || false,
          };

          setBillboard(transformedBillboard);
          setBillboardSides(
            transformedBillboard.billboard_sides.length
              ? transformedBillboard.billboard_sides
              : [
                  {
                    id: "side-1",
                    billboard_id: transformedBillboard.id,
                    side_identifier: "SINGLE",
                    side_name: "Main Display",
                    description: "Primary billboard display",
                    price_per_day: transformedBillboard.pricePerDay,
                    is_available: true,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  },
                ]
          );
        }
      } catch (error) {
        console.error("Failed to fetch billboard:", error);
        // You can optionally show message here
      }
    }

    fetchBillboard();
  }, [id]);

  // Update pricing when dates or billboard change
  useEffect(() => {
    if (startDate && endDate && billboard) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diff = Math.ceil(
        Math.abs(end.getTime() - start.getTime()) / (1000 * 3600 * 24)
      );

      setTotalDays(diff);

      const basePrice = diff * billboard.pricePerDay;
      const gst = basePrice * 0.18;
      setTotalPrice(basePrice);
      setGstAmount(gst);
      setFinalAmount(basePrice + gst);
    }
  }, [startDate, endDate, billboard]);

  const formatDate = (d: Date) => d.toISOString().split("T")[0];

  const handleNextStep = () => {
    if (bookingStep === "details") setBookingStep("payment");
    else if (bookingStep === "payment") handleSubmit();
  };

  const handlePreviousStep = () => {
    if (bookingStep === "payment") setBookingStep("details");
  };

  const handleSubmit = async () => {
    setIsProcessing(true);

    try {
      if (!user) {
        setMessage("Please login to continue.");
        setIsProcessing(false);
        return;
      }

      await CartService.addToCart(
        user.id,
        billboard?.id,
        selectedSide,
        startDate,
        endDate,
        adContent,
        adType
      );

      const result = await CartService.processCheckout(user.id);
      if (result.success) {
        setBookingStep("confirmation");
      } else {
        setMessage("Booking failed: " + (result.errors?.join(", ") ?? ""));
      }
    } catch (err: any) {
      setMessage("Booking failed: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddToCart = async (side: "A" | "B" | "BOTH" | "SINGLE") => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (!startDate || !endDate) {
      setMessage("Please select booking dates");
      return;
    }

    try {
      setIsProcessing(true);
      setMessage("");

      const sideInfo = billboardSides.find((s) => s.side_identifier === side);
      const pricePerDay =
        sideInfo?.price_per_day ?? billboard?.pricePerDay ?? 0;

      await CartService.addToCart(
        user.id,
        billboard?.id,
        side,
        startDate,
        endDate,
        adContent,
        adType,
        pricePerDay
      );

      setMessage("Billboard added to cart successfully.");
      setSelectedSide(side);

      window.dispatchEvent(new CustomEvent("cartUpdated"));
    } catch (err: any) {
      setMessage("Failed to add to cart: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmBooking = () => {
    navigate("/dashboard");
  };

  if (!billboard)
    return (
      <div className="max-w-7xl mx-auto p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Billboard Not Found</h2>
        <p className="mb-6">
          The billboard you're looking for doesn't exist or has been removed.
        </p>
        <Link
          to="/explore"
          className="inline-flex items-center text-blue-700 hover:underline"
        >
          <ArrowLeft className="mr-2" />
          Back to Explore
        </Link>
      </div>
    );

  if (!user)
    return (
      <div className="max-w-7xl mx-auto p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Login Required</h2>
        <p className="mb-6">Please login to proceed with booking.</p>
        <Link
          to="/login"
          className="inline-flex items-center text-blue-700 hover:underline"
        >
          <ArrowLeft className="mr-2" />
          Login
        </Link>
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <Link
        to={`/billboard/${billboard.id}`}
        className="inline-flex items-center text-blue-700 hover:underline mb-8"
      >
        <ArrowLeft className="mr-2" />
        Back to Billboard Details
      </Link>

      {/* Booking Steps Indicator */}
      <div className="flex space-x-4 mb-8">
        {["details", "payment", "confirmation"].map((step, idx) => (
          <div
            key={step}
            className={`flex items-center space-x-2 ${
              bookingStep === step
                ? "text-blue-700 font-semibold"
                : "text-gray-400"
            }`}
          >
            <div
              className={`rounded-full h-8 w-8 flex items-center justify-center ${
                bookingStep === step
                  ? "bg-blue-700 text-white"
                  : "bg-gray-300 text-gray-600"
              }`}
            >
              {idx + 1}
            </div>
            <div className="capitalize">{step}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {/* Booking form steps */}
          {bookingStep === "details" && (
            <div className="bg-white rounded-lg p-6 shadow mb-8">
              {message && (
                <div
                  className={`p-4 mb-6 rounded border ${
                    message.includes("success")
                      ? "bg-green-100 border-green-500 text-green-700"
                      : "bg-red-100 border-red-500 text-red-700"
                  }`}
                >
                  {message}
                </div>
              )}

              {/* Date Selection */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block mb-1 font-medium">Start Date</label>
                  <input
                    type="date"
                    className="border p-2 rounded w-full"
                    min={formatDate(new Date())}
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block mb-1 font-medium">End Date</label>
                  <input
                    type="date"
                    className="border p-2 rounded w-full"
                    min={startDate}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Advertisement type selector */}
              <div className="mb-4">
                <label className="block mb-2 font-medium">
                  Advertisement Type
                </label>
                <div className="flex space-x-3">
                  {[
                    { id: "static", label: "Static" },
                    { id: "digital", label: "Digital" },
                    { id: "interactive", label: "Interactive" },
                  ].map(({ id, label }) => (
                    <div
                      key={id}
                      onClick={() => setAdType(id)}
                      className={`cursor-pointer p-3 border rounded ${
                        adType === id
                          ? "border-blue-700 bg-blue-100"
                          : "border-gray-300"
                      }`}
                    >
                      {label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Advertisement content */}
              <div className="mb-6">
                <label className="block mb-2 font-medium">
                  Advertisement Content
                </label>
                <textarea
                  className="w-full border rounded p-2"
                  rows={4}
                  placeholder="Describe your advertisement"
                  value={adContent}
                  onChange={(e) => setAdContent(e.target.value)}
                />
                <div className="text-sm mt-1 text-gray-500">
                  You can update advertisement design files after booking
                  confirmation.
                </div>
              </div>

              {/* Contact Info Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block mb-1 font-medium">Full Name*</label>
                  <input
                    type="text"
                    className="border p-2 rounded w-full"
                    value={contactInfo.name}
                    onChange={(e) =>
                      setContactInfo({ ...contactInfo, name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block mb-1 font-medium">Email*</label>
                  <input
                    type="email"
                    className="border p-2 rounded w-full"
                    value={contactInfo.email}
                    onChange={(e) =>
                      setContactInfo({ ...contactInfo, email: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block mb-1 font-medium">Phone*</label>
                  <input
                    type="tel"
                    className="border p-2 rounded w-full"
                    value={contactInfo.phone}
                    onChange={(e) =>
                      setContactInfo({ ...contactInfo, phone: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block mb-1 font-medium">Company</label>
                  <input
                    type="text"
                    className="border p-2 rounded w-full"
                    value={contactInfo.company}
                    onChange={(e) =>
                      setContactInfo({
                        ...contactInfo,
                        company: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              {/* Note */}
              <div className="flex p-4 bg-blue-100 border border-blue-300 rounded mb-6">
                <Info className="mr-2 text-blue-700" />
                <div>
                  Booking requests are subject to approval by the billboard
                  owner. You will be notified once approved.
                </div>
              </div>

              {/* Billboard sides selector */}
              {startDate && endDate && billboard && (
                <TwoSidedBillboardSelector
                  billboardId={billboard.id}
                  sides={billboardSides}
                  startDate={startDate}
                  endDate={endDate}
                  onSideSelect={setSelectedSide}
                  onAddToCart={handleAddToCart}
                  selectedSide={selectedSide}
                />
              )}

              <div className="flex justify-between mt-4">
                <button
                  disabled
                  onClick={handlePreviousStep}
                  className="invisible px-4 py-2 rounded bg-gray-300"
                >
                  Previous
                </button>
                <button
                  onClick={handleNextStep}
                  disabled={!startDate || !endDate || isProcessing}
                  className="px-6 py-2 rounded bg-blue-700 text-white disabled:opacity-50"
                >
                  {isProcessing ? (
                    <span>Processing...</span>
                  ) : (
                    "Continue to Payment"
                  )}
                </button>
              </div>
            </div>
          )}

          {bookingStep === "payment" && (
            <div className="bg-white rounded-lg p-6 shadow mb-8">
              <h2 className="mb-4 font-semibold flex items-center">
                <CreditCard className="mr-2" /> Payment Details
              </h2>

              {/* Payment method selector */}
              <div className="flex space-x-3 mb-4">
                {[
                  { id: "credit_card", label: "Credit Card" },
                  { id: "upi", label: "UPI" },
                  { id: "bank_transfer", label: "Bank Transfer" },
                ].map(({ id, label }) => (
                  <div
                    key={id}
                    onClick={() => setPaymentMethod(id)}
                    className={`cursor-pointer p-3 border rounded ${
                      paymentMethod === id
                        ? "border-blue-700 bg-blue-100"
                        : "border-gray-300"
                    }`}
                  >
                    {label}
                  </div>
                ))}
              </div>

              {/* Payment form fields */}
              {paymentMethod === "credit_card" && (
                <>
                  <div className="mb-3">
                    <label className="block mb-1">Card Number</label>
                    <input
                      type="text"
                      className="border p-2 rounded w-full"
                      placeholder="1234 5678 9012 3456"
                      value={paymentInfo.cardNumber}
                      onChange={(e) =>
                        setPaymentInfo({
                          ...paymentInfo,
                          cardNumber: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <label className="block mb-1">Expiry Date (MM/YY)</label>
                      <input
                        type="text"
                        className="border p-2 rounded w-full"
                        placeholder="MM/YY"
                        value={paymentInfo.expiryDate}
                        onChange={(e) =>
                          setPaymentInfo({
                            ...paymentInfo,
                            expiryDate: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="block mb-1">CVV</label>
                      <input
                        type="text"
                        className="border p-2 rounded w-full"
                        placeholder="123"
                        value={paymentInfo.cvv}
                        onChange={(e) =>
                          setPaymentInfo({
                            ...paymentInfo,
                            cvv: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="block mb-1">Name on Card</label>
                    <input
                      type="text"
                      className="border p-2 rounded w-full"
                      placeholder="Your Name"
                      value={paymentInfo.nameOnCard}
                      onChange={(e) =>
                        setPaymentInfo({
                          ...paymentInfo,
                          nameOnCard: e.target.value,
                        })
                      }
                    />
                  </div>
                </>
              )}

              {paymentMethod === "upi" && (
                <div className="mb-3">
                  <label className="block mb-1">UPI ID</label>
                  <input
                    type="text"
                    className="border p-2 rounded w-full"
                    placeholder="yourname@bank"
                    value={paymentInfo.upiId}
                    onChange={(e) =>
                      setPaymentInfo({ ...paymentInfo, upiId: e.target.value })
                    }
                  />
                </div>
              )}

              {paymentMethod === "bank_transfer" && (
                <div className="mb-3">
                  <label className="block mb-1">Bank Account Number</label>
                  <input
                    type="text"
                    className="border p-2 rounded w-full"
                    placeholder="Account Number"
                    value={paymentInfo.bankAccount}
                    onChange={(e) =>
                      setPaymentInfo({
                        ...paymentInfo,
                        bankAccount: e.target.value,
                      })
                    }
                  />
                </div>
              )}

              {/* Terms */}
              <div className="mb-4 flex items-center">
                <input type="checkbox" required id="terms" className="mr-2" />
                <label htmlFor="terms">
                  I agree to the{" "}
                  <a href="#" className="text-blue-600 underline">
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a href="#" className="text-blue-600 underline">
                    Privacy Policy
                  </a>
                  .
                </label>
              </div>

              <div className="p-4 mb-4 bg-green-50 border border-green-300 rounded flex items-center">
                <Shield className="mr-2 text-green-700" /> Your payment info is
                secure. Charges happen only after approval.
              </div>

              <div className="flex justify-between">
                <button
                  onClick={handlePreviousStep}
                  disabled={isProcessing}
                  className="px-4 py-2 rounded bg-gray-300 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={handleNextStep}
                  disabled={isProcessing}
                  className="px-6 py-2 rounded bg-blue-700 text-white disabled:opacity-50"
                >
                  {isProcessing ? "Processing..." : "Complete Booking"}
                </button>
              </div>
            </div>
          )}

          {bookingStep === "confirmation" && (
            <div className="bg-white rounded-lg p-6 shadow text-center">
              <CheckCircle className="mx-auto mb-4 text-green-600" size={48} />
              <h2 className="text-2xl mb-2 font-semibold">
                Booking Confirmed!
              </h2>
              <p className="mb-4">
                Your booking request was submitted successfully. The billboard
                owner will review your booking.
              </p>
              <div className="mb-4 bg-green-100 p-3 rounded">
                Booking ID:{" "}
                <span className="font-mono">{`BH-${Date.now()
                  .toString()
                  .slice(-8)}`}</span>
              </div>
              <button
                onClick={handleConfirmBooking}
                className="px-6 py-3 bg-blue-700 rounded text-white mb-2"
              >
                Go to Dashboard
              </button>
              <Link
                to="/explore"
                className="block text-blue-700 hover:underline"
              >
                Book Another Billboard
              </Link>
            </div>
          )}
        </div>

        {/* Booking Summary Sidebar */}
        <div>
          <div className="bg-white rounded-lg p-6 shadow sticky top-16">
            <img
              src={billboard.imageUrl}
              alt={billboard.title}
              className="w-full rounded mb-4"
            />
            <h3 className="text-xl font-semibold mb-2">{billboard.title}</h3>
            <div className="mb-2 flex items-center text-gray-500">
              <IndianRupee className="mr-1" />{" "}
              <span>{billboard.pricePerDay.toLocaleString()}</span>/day
            </div>
            <div className="mb-2">
              <strong>Location:</strong> {billboard.location}
            </div>
            <div className="mb-2">
              <strong>Selected Dates:</strong>{" "}
              {startDate && endDate
                ? `${new Date(startDate).toLocaleDateString()} - ${new Date(
                    endDate
                  ).toLocaleDateString()}`
                : "Not selected"}
            </div>
            <div className="mb-2">
              <strong>Duration:</strong> {totalDays} days
            </div>
            <div className="mb-2">
              <strong>Selected Side:</strong>{" "}
              {selectedSide === "SINGLE"
                ? "Single Side"
                : selectedSide === "A"
                ? "Side A"
                : selectedSide === "B"
                ? "Side B"
                : "Both Sides"}
            </div>
            <div className="divider mb-2"></div>
            <div className="mb-1 flex justify-between">
              <span>Subtotal</span>
              <span>₹{totalPrice.toLocaleString()}</span>
            </div>
            <div className="mb-1 flex justify-between">
              <span>GST (18%)</span>
              <span>₹{gstAmount.toLocaleString()}</span>
            </div>
            <div className="font-semibold text-lg flex justify-between">
              <span>Total</span>
              <span>₹{finalAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;
