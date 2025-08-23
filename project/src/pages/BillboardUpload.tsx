import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Upload, MapPin, IndianRupee, Calendar, AlertTriangle,
  CheckCircle, X, Eye, Save, Send
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useFormAutoSave } from '../hooks/useFormAutoSave';
import { 
  createBillboard, 
  uploadBillboardImage, 
  saveBillboardImages,
  getBillboardTypes,
  getBillboardSizeFees,
  BillboardSizeFee,
  supabase
} from '../services/supabase';

interface BillboardType {
  id: number;
  type_name: string;
  description: string;
  is_active: boolean;
}

interface BillboardUploadState {
  step: 'form' | 'fees' | 'payment' | 'confirmation';
  selectedFee?: BillboardSizeFee;
  paymentMethod: 'credit_card' | 'upi' | 'bank_transfer';
  paymentData: {
    cardNumber: string;
    expiryDate: string;
    cvv: string;
    nameOnCard: string;
    upiId: string;
    bankAccount: string;
  };
}

const BillboardUpload: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const initialFormData = {
    title: '',
    state: '',
    city: '',
    locationAddress: '',
    googleMapsLink: '',
    pricePerDay: '',
    dailyViews: '',
    minDays: '7',
    billboardTypeId: '',
    dimensions: '',
    facing: 'North',
    features: '',
    description: '',
    isTwoSided: false,
    sideADescription: '',
    sideBDescription: ''
  };

  const [kycBlocked, setKycBlocked] = useState(false);
  const [kycMessage, setKycMessage] = useState('');

  const {
    formData,
    updateFormData,
    lastSaved,
    isSaving,
    clearSavedData,
    restoreFromSave,
    hasUnsavedChanges
  } = useFormAutoSave(initialFormData, {
    key: 'billboard_upload',
    delay: 2000,
    enabled: true
  });

  const [billboardTypes, setBillboardTypes] = useState<BillboardType[]>([]);
  const [billboardSizeFees, setBillboardSizeFees] = useState<BillboardSizeFee[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [loadingFees, setLoadingFees] = useState(true);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [showRestorePrompt, setShowRestorePrompt] = useState(false);
  
  const [uploadState, setUploadState] = useState<BillboardUploadState>({
    step: 'form',
    paymentMethod: 'credit_card',
    paymentData: {
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      nameOnCard: '',
      upiId: '',
      bankAccount: ''
    }
  });

  const checkKYCStatus = () => {
    if (!user) return;
    
    // Check if user is owner and KYC status
    if (user.role === 'owner') {
      if (user.kyc_status === 'pending') {
        setKycBlocked(true);
        setKycMessage('Your KYC verification is still pending. Please wait for admin approval before uploading billboards.');
      } else if (user.kyc_status === 'rejected') {
        setKycBlocked(true);
        setKycMessage('Your KYC verification was rejected. Please resubmit your documents and wait for approval before uploading billboards.');
      } else if (user.kyc_status === 'submitted') {
        setKycBlocked(true);
        setKycMessage('Your KYC documents are under review. Please wait for admin approval before uploading billboards.');
      } else if (user.kyc_status === 'approved') {
        setKycBlocked(false);
        setKycMessage('');
      } else {
        setKycBlocked(true);
        setKycMessage('Please complete your KYC verification before uploading billboards.');
      }
    }
  };

  const indianStates = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
    'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
  ];

  const citiesByState: { [key: string]: string[] } = {
    'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Kurnool', 'Rajahmundry', 'Tirupati', 'Kadapa', 'Anantapur', 'Eluru'],
    'Arunachal Pradesh': ['Itanagar', 'Naharlagun', 'Pasighat', 'Tezpur', 'Bomdila', 'Ziro', 'Along', 'Changlang', 'Tezu', 'Khonsa'],
    'Assam': ['Guwahati', 'Silchar', 'Dibrugarh', 'Jorhat', 'Nagaon', 'Tinsukia', 'Tezpur', 'Bongaigaon', 'Karimganj', 'Sivasagar'],
    'Bihar': ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Purnia', 'Darbhanga', 'Bihar Sharif', 'Arrah', 'Begusarai', 'Katihar'],
    'Chhattisgarh': ['Raipur', 'Bhilai', 'Korba', 'Bilaspur', 'Durg', 'Rajnandgaon', 'Jagdalpur', 'Raigarh', 'Ambikapur', 'Mahasamund'],
    'Goa': ['Panaji', 'Vasco da Gama', 'Margao', 'Mapusa', 'Ponda', 'Bicholim', 'Curchorem', 'Sanquelim', 'Cuncolim', 'Quepem'],
    'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar', 'Gandhinagar', 'Junagadh', 'Anand', 'Nadiad', 'Morbi', 'Mehsana', 'Bharuch', 'Vapi', 'Navsari'],
    'Haryana': ['Gurugram', 'Faridabad', 'Panipat', 'Ambala', 'Yamunanagar', 'Rohtak', 'Hisar', 'Karnal', 'Sonipat', 'Panchkula', 'Bhiwani', 'Sirsa', 'Bahadurgarh', 'Jind', 'Thanesar'],
    'Himachal Pradesh': ['Shimla', 'Dharamshala', 'Solan', 'Mandi', 'Palampur', 'Baddi', 'Nahan', 'Paonta Sahib', 'Sundarnagar', 'Chamba'],
    'Jharkhand': ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Deoghar', 'Phusro', 'Hazaribagh', 'Giridih', 'Ramgarh', 'Medininagar'],
    'Karnataka': ['Bangalore', 'Mysore', 'Hubli-Dharwad', 'Mangalore', 'Belgaum', 'Gulbarga', 'Davanagere', 'Bellary', 'Bijapur', 'Shimoga', 'Tumkur', 'Raichur', 'Bidar', 'Hospet', 'Hassan'],
    'Kerala': ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur', 'Kollam', 'Palakkad', 'Alappuzha', 'Malappuram', 'Kannur', 'Kasaragod', 'Kottayam', 'Pathanamthitta', 'Idukki', 'Wayanad'],
    'Madhya Pradesh': ['Bhopal', 'Indore', 'Gwalior', 'Jabalpur', 'Ujjain', 'Sagar', 'Dewas', 'Satna', 'Ratlam', 'Rewa', 'Murwara', 'Singrauli', 'Burhanpur', 'Khandwa', 'Bhind'],
    'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Thane', 'Nashik', 'Aurangabad', 'Solapur', 'Amravati', 'Kolhapur', 'Sangli', 'Malegaon', 'Jalgaon', 'Akola', 'Latur', 'Dhule', 'Ahmednagar', 'Chandrapur', 'Parbhani', 'Ichalkaranji', 'Jalna'],
    'Manipur': ['Imphal', 'Thoubal', 'Lilong', 'Mayang Imphal', 'Kakching'],
    'Meghalaya': ['Shillong', 'Tura', 'Nongstoin', 'Jowai', 'Baghmara'],
    'Mizoram': ['Aizawl', 'Lunglei', 'Saiha', 'Champhai', 'Kolasib'],
    'Nagaland': ['Kohima', 'Dimapur', 'Mokokchung', 'Tuensang', 'Wokha'],
    'Odisha': ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Brahmapur', 'Sambalpur', 'Puri', 'Balasore', 'Bhadrak', 'Baripada', 'Jharsuguda'],
    'Punjab': ['Chandigarh', 'Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'Mohali', 'Firozpur', 'Batala', 'Pathankot', 'Moga', 'Abohar', 'Malerkotla', 'Khanna', 'Phagwara'],
    'Rajasthan': ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Bikaner', 'Ajmer', 'Bhilwara', 'Alwar', 'Bharatpur', 'Sikar', 'Pali', 'Sri Ganganagar', 'Kishangarh', 'Baran', 'Dhaulpur'],
    'Sikkim': ['Gangtok', 'Namchi', 'Geyzing', 'Mangan'],
    'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tirunelveli', 'Tiruppur', 'Ranipet', 'Nagercoil', 'Thanjavur', 'Vellore', 'Kancheepuram', 'Erode', 'Tiruvannamalai', 'Pollachi', 'Rajapalayam', 'Sivakasi', 'Pudukkottai', 'Neyveli', 'Nagapattinam'],
    'Telangana': ['Hyderabad', 'Warangal', 'Nizamabad', 'Khammam', 'Karimnagar', 'Ramagundam', 'Mahabubnagar', 'Nalgonda', 'Adilabad', 'Suryapet', 'Miryalaguda', 'Jagtial', 'Mancherial', 'Nirmal', 'Kothagudem'],
    'Tripura': ['Agartala', 'Dharmanagar', 'Udaipur', 'Kailasahar', 'Belonia'],
    'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Ghaziabad', 'Agra', 'Varanasi', 'Meerut', 'Allahabad', 'Bareilly', 'Aligarh', 'Moradabad', 'Saharanpur', 'Gorakhpur', 'Noida', 'Firozabad', 'Jhansi', 'Muzaffarnagar', 'Mathura', 'Rampur', 'Shahjahanpur', 'Farrukhabad', 'Mau', 'Hapur', 'Etawah', 'Mirzapur', 'Bulandshahr', 'Sambhal', 'Amroha', 'Hardoi', 'Fatehpur', 'Raebareli'],
    'Uttarakhand': ['Dehradun', 'Haridwar', 'Roorkee', 'Haldwani-cum-Kathgodam', 'Rudrapur', 'Kashipur', 'Rishikesh'],
    'West Bengal': ['Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri', 'Malda', 'Bardhaman', 'Baharampur', 'Habra', 'Kharagpur', 'Shantipur', 'Dankuni', 'Dhulian', 'Ranaghat', 'Haldia', 'Raiganj', 'Krishnanagar', 'Nabadwip', 'Medinipur', 'Jalpaiguri'],
    'Andaman and Nicobar Islands': ['Port Blair', 'Bamboo Flat', 'Garacharma', 'Diglipur'],
    'Chandigarh': ['Chandigarh'],
    'Dadra and Nagar Haveli and Daman and Diu': ['Daman', 'Diu', 'Silvassa'],
    'Delhi': ['New Delhi', 'North Delhi', 'South Delhi', 'East Delhi', 'West Delhi', 'Central Delhi', 'North East Delhi', 'North West Delhi', 'South East Delhi', 'South West Delhi', 'Shahdara'],
    'Jammu and Kashmir': ['Srinagar', 'Jammu', 'Baramulla', 'Anantnag', 'Sopore', 'KathuaUdhampur', 'Punch', 'Rajauri'],
    'Ladakh': ['Leh', 'Kargil'],
    'Lakshadweep': ['Kavaratti', 'Agatti', 'Minicoy'],
    'Puducherry': ['Puducherry', 'Karaikal', 'Yanam', 'Mahe']
  };

  useEffect(() => {
    // Check KYC status first
    checkKYCStatus();
    loadBillboardTypes();
    loadBillboardSizeFees();

    
    // Check for auto-saved data
    const hasAutoSave = localStorage.getItem('autosave_billboard_upload');
    if (hasAutoSave) {
      setShowRestorePrompt(true);
    }
  }, []);

  const loadBillboardTypes = async () => {
    try {
      setLoadingTypes(true);
      const types = await getBillboardTypes();
      setBillboardTypes(types);
    } catch (error) {
      console.error('Error loading billboard types:', error);
      setBillboardTypes([]);
    } finally {
      setLoadingTypes(false);
    }
  };

  const loadBillboardSizeFees = async () => {
    try {
      setLoadingFees(true);
      const fees = await getBillboardSizeFees();
      setBillboardSizeFees(fees);
    } catch (error) {
      console.error('Error loading billboard size fees:', error);
      setBillboardSizeFees([]);
    } finally {
      setLoadingFees(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      updateFormData({ [name]: checked });
    } else {
      // Reset city when state changes
      if (name === 'state') {
        updateFormData({ [name]: value, city: '' });
      } else {
        updateFormData({ [name]: value });
      }
    }
  };

  const handleImageUpload = (files: FileList) => {
    const maxFiles = 5;
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];

    const validFiles: File[] = [];
    const newPreviews: string[] = [];

    for (let i = 0; i < Math.min(files.length, maxFiles); i++) {
      const file = files[i];
      
      if (file.size > maxSize) {
        setSubmitMessage(`File ${file.name} is too large. Maximum size is 10MB.`);
        continue;
      }

      if (!allowedTypes.includes(file.type)) {
        setSubmitMessage(`File ${file.name} is not a valid image type. Only JPG and PNG are allowed.`);
        continue;
      }

      validFiles.push(file);
      newPreviews.push(URL.createObjectURL(file));
    }

    setImages(prev => [...prev, ...validFiles].slice(0, maxFiles));
    setImagePreviews(prev => [...prev, ...newPreviews].slice(0, maxFiles));
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => {
      const newPreviews = prev.filter((_, i) => i !== index);
      // Revoke the URL to free memory
      URL.revokeObjectURL(prev[index]);
      return newPreviews;
    });
  };

  const handleFormSubmit = async (action: 'save' | 'submit') => {
    if (!user) {
      setSubmitMessage('User not authenticated');
      return;
    }

    // Check KYC status
    if (user.kyc_status !== 'approved') {
      setSubmitMessage('Please complete your KYC verification before adding billboards.');
      return;
    }

    // Validate required fields for submission
    if (action === 'submit') {
      const requiredFields = [
        'title', 'state', 'city', 'locationAddress', 'pricePerDay', 
        'dailyViews', 'minDays', 'billboardTypeId', 'dimensions', 
        'facing', 'features', 'description'
      ];

      for (const field of requiredFields) {
        if (!formData[field as keyof typeof formData]) {
          setSubmitMessage(`Please fill in the ${field.replace(/([A-Z])/g, ' $1').toLowerCase()} field.`);
          return;
        }
      }

      if (images.length === 0) {
        setSubmitMessage('Please upload at least one image of your billboard.');
        return;
      }
      
      // Move to fees selection step
      setUploadState(prev => ({ ...prev, step: 'fees' }));
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      // Create billboard data
      const billboardData = {
        owner_id: user.id,
        title: formData.title.trim(),
        state: formData.state,
        city: formData.city,
        location_address: formData.locationAddress.trim(),
        google_maps_link: formData.googleMapsLink.trim() || undefined,
        price_per_day: parseFloat(formData.pricePerDay),
        daily_views: parseInt(formData.dailyViews),
        min_days: parseInt(formData.minDays),
        billboard_type_id: formData.billboardTypeId ? parseInt(formData.billboardTypeId) : undefined,
        dimensions: formData.dimensions.trim(),
        facing: formData.facing,
        features: formData.features.trim(),
        description: formData.description.trim(),
        status: action === 'submit' ? 'pending' : 'draft',
        is_two_sided: formData.isTwoSided,
        side_a_description: formData.isTwoSided ? formData.sideADescription.trim() : undefined,
        side_b_description: formData.isTwoSided ? formData.sideBDescription.trim() : undefined
      };

      // Create billboard
      const billboard = await createBillboard(billboardData);

      // Upload images if any
      if (images.length > 0) {
        const imageUrls: string[] = [];
        
        for (const image of images) {
          try {
            const imageUrl = await uploadBillboardImage(image, billboard.id);
            imageUrls.push(imageUrl);
          } catch (uploadError) {
            console.warn('Image upload failed, continuing without image:', uploadError);
          }
        }

        if (imageUrls.length > 0) {
          await saveBillboardImages(billboard.id, imageUrls);
        }
      }

      // Clear auto-saved data on successful submission
      if (action === 'submit') {
        clearSavedData();
      }

      const successMessage = action === 'submit' 
        ? 'Billboard submitted successfully! It will be reviewed by our admin team.'
        : 'Billboard saved as draft successfully!';
      
      setSubmitMessage(successMessage);

      // Redirect after successful submission
      if (action === 'submit') {
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      }

    } catch (error: any) {
      setSubmitMessage('Failed to save billboard: ' + error.message);
      console.error('Submit error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFeeSelection = (fee: BillboardSizeFee) => {
    setUploadState(prev => ({ 
      ...prev, 
      selectedFee: fee,
      step: 'payment'
    }));
  };

  const handlePaymentSubmit = async () => {
    if (!uploadState.selectedFee) return;
    
    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Create billboard with joining fee paid status
      const billboardData = {
        owner_id: user!.id,
        title: formData.title.trim(),
        state: formData.state,
        city: formData.city,
        location_address: formData.locationAddress.trim(),
        google_maps_link: formData.googleMapsLink.trim() || undefined,
        price_per_day: parseFloat(formData.pricePerDay),
        daily_views: parseInt(formData.dailyViews),
        min_days: parseInt(formData.minDays),
        billboard_type_id: formData.billboardTypeId ? parseInt(formData.billboardTypeId) : undefined,
        dimensions: formData.dimensions.trim(),
        facing: formData.facing,
        features: formData.features.trim(),
        description: formData.description.trim(),
        status: 'pending',
        is_two_sided: formData.isTwoSided,
        side_a_description: formData.isTwoSided ? formData.sideADescription.trim() : undefined,
        side_b_description: formData.isTwoSided ? formData.sideBDescription.trim() : undefined,
        joining_fee_paid: true,
        joining_fee_amount: uploadState.selectedFee.fee_amount,
        joining_fee_payment_id: `PAY_${Date.now()}_${Math.random().toString(36).substring(2)}`,
        joining_fee_payment_date: new Date().toISOString()
      };

      // Create billboard
      const billboard = await createBillboard(billboardData);

      // Upload images if any
      if (images.length > 0) {
        const imageUrls: string[] = [];
        
        for (const image of images) {
          try {
            const imageUrl = await uploadBillboardImage(image, billboard.id);
            imageUrls.push(imageUrl);
          } catch (uploadError) {
            console.warn('Image upload failed, continuing without image:', uploadError);
          }
        }

        if (imageUrls.length > 0) {
          await saveBillboardImages(billboard.id, imageUrls);
        }
      }

      setUploadState(prev => ({ ...prev, step: 'confirmation' }));
      clearSavedData();
      
    } catch (error: any) {
      setSubmitMessage('Payment failed: ' + error.message);
      console.error('Payment error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestoreData = () => {
    const restored = restoreFromSave();
    if (restored) {
      setShowRestorePrompt(false);
      setSubmitMessage('Previous form data restored successfully!');
    }
  };

  const handleDiscardSave = () => {
    clearSavedData();
    setShowRestorePrompt(false);
  };

  const availableCities = formData.state ? (citiesByState[formData.state] || []) : [];

  if (!user || user.role !== 'owner') {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Access Denied</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Only billboard owners can upload billboards.
        </p>
        <Link to="/register" className="text-blue-900 dark:text-blue-400 hover:underline">
          Register as Billboard Owner
        </Link>
      </div>
    );
  }

  // Block billboard upload if KYC is not approved
  if (kycBlocked) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link 
          to="/dashboard" 
          className="inline-flex items-center text-blue-900 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-8"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Dashboard
        </Link>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <div className="p-8 text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/50 mb-6">
              <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              KYC Verification Required
            </h2>
            
            <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-md mx-auto">
              {kycMessage}
            </p>
            
            <div className="space-y-4">
              {user.kyc_status === 'rejected' && (
                <>
                  {user.rejection_notes && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                      <h3 className="text-sm font-semibold text-red-800 dark:text-red-200 mb-2">
                        Admin Feedback:
                      </h3>
                      <p className="text-sm text-red-700 dark:text-red-300">
                        {user.rejection_notes}
                      </p>
                    </div>
                  )}
                  <Link
                    to="/owner/kyc-upload"
                    className="inline-flex items-center bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                  >
                    Resubmit KYC Documents
                  </Link>
                </>
              )}
              
              {(user.kyc_status === 'pending' || user.kyc_status === 'submitted') && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
                  <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                    Your KYC documents are being reviewed by our admin team. This process typically takes 24-48 hours.
                  </p>
                </div>
              )}
              
              {!user.kyc_status || user.kyc_status === 'pending' && (
                <Link
                  to="/owner/kyc-upload"
                  className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  Complete KYC Verification
                </Link>
              )}
              
              <Link
                to="/dashboard"
                className="block bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link 
        to="/dashboard" 
        className="inline-flex items-center text-blue-900 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-8"
      >
        <ArrowLeft className="h-5 w-5 mr-2" />
        Back to Dashboard
      </Link>

      {/* Auto-save Restore Prompt */}
      {showRestorePrompt && (
        <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
              <span className="text-blue-800 dark:text-blue-200">
                We found previously saved form data. Would you like to restore it?
              </span>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleRestoreData}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
              >
                Restore
              </button>
              <button
                onClick={handleDiscardSave}
                className="bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-3 py-1 rounded text-sm hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {uploadState.step === 'form' && 'Add Your Billboard'}
                {uploadState.step === 'fees' && 'Select Joining Fee'}
                {uploadState.step === 'payment' && 'Complete Payment'}
                {uploadState.step === 'confirmation' && 'Billboard Submitted'}
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                {uploadState.step === 'form' && 'List your billboard on our platform to start earning revenue.'}
                {uploadState.step === 'fees' && 'Choose the appropriate joining fee based on your billboard size.'}
                {uploadState.step === 'payment' && 'Pay the joining fee to submit your billboard for admin approval.'}
                {uploadState.step === 'confirmation' && 'Your billboard has been submitted for admin review.'}
              </p>
            </div>
            
            {/* Auto-save Status */}
            <div className="flex items-center space-x-4">
              {isSaving && (
                <div className="flex items-center text-blue-600 dark:text-blue-400">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  <span className="text-sm">Saving...</span>
                </div>
              )}
              {lastSaved && (
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Last saved: {lastSaved.toLocaleTimeString()}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Step Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-center space-x-4">
              <div className={`flex items-center ${uploadState.step === 'form' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${uploadState.step === 'form' ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'}`}>1</div>
                <span className="ml-2 font-medium">Billboard Details</span>
              </div>
              <div className="w-8 h-px bg-gray-300"></div>
              <div className={`flex items-center ${uploadState.step === 'fees' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${uploadState.step === 'fees' ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'}`}>2</div>
                <span className="ml-2 font-medium">Joining Fee</span>
              </div>
              <div className="w-8 h-px bg-gray-300"></div>
              <div className={`flex items-center ${uploadState.step === 'payment' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${uploadState.step === 'payment' ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'}`}>3</div>
                <span className="ml-2 font-medium">Payment</span>
              </div>
              <div className="w-8 h-px bg-gray-300"></div>
              <div className={`flex items-center ${uploadState.step === 'confirmation' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${uploadState.step === 'confirmation' ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'}`}>4</div>
                <span className="ml-2 font-medium">Confirmation</span>
              </div>
            </div>
          </div>

          {submitMessage && (
            <div className={`mb-6 p-4 rounded-lg border ${
              submitMessage.includes('successfully') 
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
            }`}>
              <div className="flex items-center">
                {submitMessage.includes('successfully') ? (
                  <CheckCircle className="h-5 w-5 mr-2" />
                ) : (
                  <AlertTriangle className="h-5 w-5 mr-2" />
                )}
                {submitMessage}
              </div>
            </div>
          )}

          {/* Step 1: Billboard Form */}
          {uploadState.step === 'form' && (
            <form className="space-y-6">
            {/* Basic Information */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Basic Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Billboard Title *
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                    placeholder="e.g., Premium Highway Billboard"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="billboardTypeId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Billboard Type *
                  </label>
                  {loadingTypes ? (
                    <div className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                      Loading billboard types...
                    </div>
                  ) : billboardTypes.length === 0 ? (
                    <div className="w-full px-4 py-2 border border-red-300 dark:border-red-600 rounded-md bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300">
                      No billboard types available. Please contact admin.
                    </div>
                  ) : (
                    <select
                      name="billboardTypeId"
                      value={formData.billboardTypeId}
                      onChange={handleInputChange}
                      required
                      disabled={loadingTypes}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-700"
                    >
                      <option value="">
                        {loadingTypes ? 'Loading...' : 'Select Billboard Type'}
                      </option>
                      {billboardTypes.map(type => (
                        <option key={type.id} value={type.id.toString()}>
                          {type.type_name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </div>

            {/* Location Details */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Location Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="state" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    State *
                  </label>
                  <select
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                    required
                  >
                    <option value="">Select State</option>
                    {indianStates.map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    City *
                  </label>
                  <select
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                    disabled={!formData.state}
                    required
                  >
                    <option value="">Select City</option>
                    {availableCities.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="locationAddress" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Detailed Address *
                  </label>
                  <textarea
                    id="locationAddress"
                    name="locationAddress"
                    value={formData.locationAddress}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                    placeholder="Complete address with landmarks"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="googleMapsLink" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Google Maps Link
                  </label>
                  <input
                    type="url"
                    id="googleMapsLink"
                    name="googleMapsLink"
                    value={formData.googleMapsLink}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                    placeholder="https://maps.google.com/?q=lat,lng"
                  />
                </div>
              </div>
            </div>

            {/* Pricing & Visibility */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Pricing & Visibility</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label htmlFor="pricePerDay" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Price Per Day (₹) *
                  </label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="number"
                      id="pricePerDay"
                      name="pricePerDay"
                      value={formData.pricePerDay}
                      onChange={handleInputChange}
                      className="pl-10 w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                      placeholder="5000"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="dailyViews" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Daily Views *
                  </label>
                  <input
                    type="number"
                    id="dailyViews"
                    name="dailyViews"
                    value={formData.dailyViews}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                    placeholder="50000"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="minDays" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Minimum Days *
                  </label>
                  <input
                    type="number"
                    id="minDays"
                    name="minDays"
                    value={formData.minDays}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                    min="1"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Specifications */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Specifications</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="dimensions" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Dimensions *
                  </label>
                  <input
                    type="text"
                    id="dimensions"
                    name="dimensions"
                    value={formData.dimensions}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                    placeholder="e.g., 20x10 ft"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="facing" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Facing Direction *
                  </label>
                  <select
                    id="facing"
                    name="facing"
                    value={formData.facing}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                    required
                  >
                    <option value="North">North</option>
                    <option value="South">South</option>
                    <option value="East">East</option>
                    <option value="West">West</option>
                    <option value="Northeast">Northeast</option>
                    <option value="Northwest">Northwest</option>
                    <option value="Southeast">Southeast</option>
                    <option value="Southwest">Southwest</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="features" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Features *
                  </label>
                  <input
                    type="text"
                    id="features"
                    name="features"
                    value={formData.features}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                    placeholder="e.g., LED Display, Night Illumination, Weather Resistant"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Two-Sided Billboard Option */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Billboard Configuration</h2>
              <div className="space-y-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="isTwoSided"
                    checked={formData.isTwoSided}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    This is a two-sided billboard (different content on each side)
                  </span>
                </label>

                {formData.isTwoSided && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    <div>
                      <label htmlFor="sideADescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Side A Description
                      </label>
                      <textarea
                        id="sideADescription"
                        name="sideADescription"
                        value={formData.sideADescription}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                        placeholder="Describe side A features and visibility"
                      />
                    </div>
                    <div>
                      <label htmlFor="sideBDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Side B Description
                      </label>
                      <textarea
                        id="sideBDescription"
                        name="sideBDescription"
                        value={formData.sideBDescription}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                        placeholder="Describe side B features and visibility"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Description</h2>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Billboard Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                  placeholder="Detailed description of your billboard, its location advantages, and target audience"
                  required
                />
              </div>
            </div>

            {/* Image Upload */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Images</h2>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400 mb-2">
                    Upload billboard images (up to 5 images)
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
                    JPG, PNG up to 10MB each
                  </p>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files) {
                        handleImageUpload(e.target.files);
                      }
                    }}
                    className="hidden"
                    id="imageUpload"
                  />
                  <label
                    htmlFor="imageUpload"
                    className="bg-blue-900 dark:bg-blue-700 text-white px-6 py-2 rounded-lg hover:bg-blue-800 dark:hover:bg-blue-600 transition-colors cursor-pointer inline-block"
                  >
                    Choose Images
                  </label>
                </div>

                {/* Image Previews */}
                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img 
                          src={preview} 
                          alt={`Preview ${index + 1}`} 
                          className="w-full h-24 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => window.open(preview, '_blank')}
                          className="absolute bottom-1 right-1 bg-blue-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Eye className="h-3 w-3" />
                        </button>
                        {index === 0 && (
                          <div className="absolute top-1 left-1 bg-green-600 text-white text-xs px-2 py-1 rounded">
                            Main
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {hasUnsavedChanges && (
                  <span className="text-yellow-600 dark:text-yellow-400">
                    You have unsaved changes
                  </span>
                )}
              </div>
              
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => handleFormSubmit('save')}
                  disabled={isSubmitting}
                  className="bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors flex items-center disabled:opacity-50"
                >
                  <Save className="h-5 w-5 mr-2" />
                  {isSubmitting ? 'Saving...' : 'Save as Draft'}
                </button>
                
                <button
                  type="button"
                  onClick={() => handleFormSubmit('submit')}
                  disabled={isSubmitting}
                  className="bg-blue-900 dark:bg-blue-700 text-white px-6 py-3 rounded-lg hover:bg-blue-800 dark:hover:bg-blue-600 transition-colors flex items-center disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5 mr-2" />
                      Continue to Fee Selection
                    </>
                  )}
                </button>
              </div>
            </div>
            </form>
          )}

          {/* Step 2: Fee Selection */}
          {uploadState.step === 'fees' && (
            <div className="space-y-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-2">Joining Fee Required</h3>
                <p className="text-blue-800 dark:text-blue-200">
                  To list your billboard on PosterBazar, you need to pay a one-time joining fee based on your billboard size. 
                  This fee helps us maintain the platform and verify all listings.
                </p>
              </div>

              {loadingFees ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900 mx-auto"></div>
                  <p className="mt-4 text-gray-600 dark:text-gray-400">Loading fee options...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {billboardSizeFees.map((fee) => (
                    <div
                      key={fee.id}
                      className={`border rounded-lg p-6 cursor-pointer transition-all ${
                        uploadState.selectedFee?.id === fee.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600'
                      }`}
                      onClick={() => setUploadState(prev => ({ ...prev, selectedFee: fee }))}
                    >
                      <div className="text-center">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                          {fee.size_name}
                        </h3>
                        <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                          ₹{typeof fee.fee_amount === 'number' ? fee.fee_amount.toLocaleString() : parseFloat(fee.fee_amount).toLocaleString()}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                          One-time joining fee
                        </p>
                        {fee.description && (
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {fee.description}
                          </p>
                        )}
                        {uploadState.selectedFee?.id === fee.id && (
                          <div className="mt-4">
                            <CheckCircle className="h-6 w-6 text-blue-600 mx-auto" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-between pt-6">
                <button
                  onClick={() => setUploadState(prev => ({ ...prev, step: 'form' }))}
                  className="bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                >
                  Back to Form
                </button>
                <button
                  onClick={() => setUploadState(prev => ({ ...prev, step: 'payment' }))}
                  disabled={!uploadState.selectedFee}
                  className="bg-blue-900 dark:bg-blue-700 text-white px-6 py-3 rounded-lg hover:bg-blue-800 dark:hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Proceed to Payment
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Payment */}
          {uploadState.step === 'payment' && uploadState.selectedFee && (
            <div className="space-y-6">
              {/* Payment Summary */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Payment Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Billboard: {formData.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Size Category: {uploadState.selectedFee.size_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Joining Fee:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      ₹{typeof uploadState.selectedFee.fee_amount === 'number' ? uploadState.selectedFee.fee_amount.toLocaleString() : parseFloat(uploadState.selectedFee.fee_amount).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">GST (18%):</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      ₹{Math.round((typeof uploadState.selectedFee.fee_amount === 'number' ? uploadState.selectedFee.fee_amount : parseFloat(uploadState.selectedFee.fee_amount)) * 0.18).toLocaleString()}
                    </span>
                  </div>
                  <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
                    <div className="flex justify-between">
                      <span className="text-lg font-semibold text-gray-900 dark:text-white">Total Amount:</span>
                      <span className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                        ₹{Math.round((typeof uploadState.selectedFee.fee_amount === 'number' ? uploadState.selectedFee.fee_amount : parseFloat(uploadState.selectedFee.fee_amount)) * 1.18).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Method Selection */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Payment Method</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div 
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      uploadState.paymentMethod === 'credit_card' 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                        : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600'
                    }`}
                    onClick={() => setUploadState(prev => ({ ...prev, paymentMethod: 'credit_card' }))}
                  >
                    <div className="flex justify-between mb-2">
                      <span className="font-medium text-gray-900 dark:text-white">Credit Card</span>
                      {uploadState.paymentMethod === 'credit_card' && <CheckCircle className="h-5 w-5 text-blue-600" />}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Visa, Mastercard, Amex</p>
                  </div>
                  
                  <div 
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      uploadState.paymentMethod === 'upi' 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                        : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600'
                    }`}
                    onClick={() => setUploadState(prev => ({ ...prev, paymentMethod: 'upi' }))}
                  >
                    <div className="flex justify-between mb-2">
                      <span className="font-medium text-gray-900 dark:text-white">UPI</span>
                      {uploadState.paymentMethod === 'upi' && <CheckCircle className="h-5 w-5 text-blue-600" />}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">PhonePe, GPay, Paytm</p>
                  </div>
                  
                  <div 
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      uploadState.paymentMethod === 'bank_transfer' 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                        : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600'
                    }`}
                    onClick={() => setUploadState(prev => ({ ...prev, paymentMethod: 'bank_transfer' }))}
                  >
                    <div className="flex justify-between mb-2">
                      <span className="font-medium text-gray-900 dark:text-white">Bank Transfer</span>
                      {uploadState.paymentMethod === 'bank_transfer' && <CheckCircle className="h-5 w-5 text-blue-600" />}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">NEFT/RTGS/IMPS</p>
                  </div>
                </div>
              </div>

              {/* Payment Form Fields */}
              {uploadState.paymentMethod === 'credit_card' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Card Number
                    </label>
                    <input
                      type="text"
                      value={uploadState.paymentData.cardNumber}
                      onChange={(e) => setUploadState(prev => ({
                        ...prev,
                        paymentData: { ...prev.paymentData, cardNumber: e.target.value }
                      }))}
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
                        value={uploadState.paymentData.expiryDate}
                        onChange={(e) => setUploadState(prev => ({
                          ...prev,
                          paymentData: { ...prev.paymentData, expiryDate: e.target.value }
                        }))}
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
                        value={uploadState.paymentData.cvv}
                        onChange={(e) => setUploadState(prev => ({
                          ...prev,
                          paymentData: { ...prev.paymentData, cvv: e.target.value }
                        }))}
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
                      value={uploadState.paymentData.nameOnCard}
                      onChange={(e) => setUploadState(prev => ({
                        ...prev,
                        paymentData: { ...prev.paymentData, nameOnCard: e.target.value }
                      }))}
                      placeholder="John Doe"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
              )}

              {uploadState.paymentMethod === 'upi' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    UPI ID
                  </label>
                  <input
                    type="text"
                    value={uploadState.paymentData.upiId}
                    onChange={(e) => setUploadState(prev => ({
                      ...prev,
                      paymentData: { ...prev.paymentData, upiId: e.target.value }
                    }))}
                    placeholder="yourname@paytm"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              )}

              {uploadState.paymentMethod === 'bank_transfer' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Bank Account Number
                  </label>
                  <input
                    type="text"
                    value={uploadState.paymentData.bankAccount}
                    onChange={(e) => setUploadState(prev => ({
                      ...prev,
                      paymentData: { ...prev.paymentData, bankAccount: e.target.value }
                    }))}
                    placeholder="Account number"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              )}

              <div className="flex justify-between pt-6">
                <button
                  onClick={() => setUploadState(prev => ({ ...prev, step: 'fees' }))}
                  className="bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                >
                  Back to Fee Selection
                </button>
                <button
                  onClick={handlePaymentSubmit}
                  disabled={isSubmitting}
                  className="bg-blue-900 dark:bg-blue-700 text-white px-6 py-3 rounded-lg hover:bg-blue-800 dark:hover:bg-blue-600 transition-colors flex items-center disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing Payment...
                    </>
                  ) : (
                    <>
                      <IndianRupee className="h-5 w-5 mr-2" />
                      Pay ₹{Math.round((typeof uploadState.selectedFee.fee_amount === 'number' ? uploadState.selectedFee.fee_amount : parseFloat(uploadState.selectedFee.fee_amount)) * 1.18).toLocaleString()}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Confirmation */}
          {uploadState.step === 'confirmation' && (
            <div className="text-center space-y-6">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/50">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Billboard Submitted Successfully!
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Your billboard has been submitted for admin review. You'll receive a notification once it's approved.
                </p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-3">What happens next?</h4>
                <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                  <div className="flex items-center">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">1</div>
                    <span>Admin reviews your billboard details and payment</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">2</div>
                    <span>Sub-admin conducts physical verification</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">3</div>
                    <span>Billboard goes live on the platform</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">4</div>
                    <span>Start receiving booking requests</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="bg-blue-900 dark:bg-blue-700 text-white px-8 py-3 rounded-lg hover:bg-blue-800 dark:hover:bg-blue-600 transition-colors"
                >
                  Go to Dashboard
                </button>
                <button
                  onClick={() => {
                    setUploadState({
                      step: 'form',
                      paymentMethod: 'credit_card',
                      paymentData: {
                        cardNumber: '',
                        expiryDate: '',
                        cvv: '',
                        nameOnCard: '',
                        upiId: '',
                        bankAccount: ''
                      }
                    });
                    // Reset form data
                    updateFormData(initialFormData);
                    setImages([]);
                    setImagePreviews([]);
                  }}
                  className="bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-8 py-3 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                >
                  Add Another Billboard
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BillboardUpload;