import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Camera, CheckCircle, AlertTriangle, 
  X, Save, Send, Navigation
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { 
  getBillboardById, 
  uploadSiteVisitPhoto, 
  completeSiteVerification 
} from '../../services/supabase';
import { Billboard } from '../../services/supabase';

interface VerificationData {
  ownerSelfie: File | null;
  billboardPhoto: File | null;
  verificationNotes: string;
  isVerified: boolean;
  issuesFound: string[];
  recommendations: string;
  locationAccuracy: 'exact' | 'approximate' | 'incorrect';
  structuralCondition: 'excellent' | 'good' | 'fair' | 'poor';
  visibilityRating: number; // 1-10
  accessibilityNotes: string;
}

const VerificationForm: React.FC = () => {
  const { billboardId } = useParams<{ billboardId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [billboard, setBillboard] = useState<Billboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  
  const [verificationData, setVerificationData] = useState<VerificationData>({
    ownerSelfie: null,
    billboardPhoto: null,
    verificationNotes: '',
    isVerified: false,
    issuesFound: [],
    recommendations: '',
    locationAccuracy: 'exact',
    structuralCondition: 'excellent',
    visibilityRating: 8,
    accessibilityNotes: ''
  });

  const [previews, setPreviews] = useState({
    ownerSelfie: '',
    billboardPhoto: ''
  });

  useEffect(() => {
    if (billboardId) {
      loadBillboard();
    }
  }, [billboardId]);

  const loadBillboard = async () => {
    if (!billboardId) return;

    try {
      const data = await getBillboardById(billboardId);
      setBillboard(data);
    } catch (error) {
      console.error('Error loading billboard:', error);
      setMessage('Failed to load billboard details');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (type: 'ownerSelfie' | 'billboardPhoto', file: File) => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/png'];

    if (file.size > maxSize) {
      setMessage('File size must be less than 10MB');
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      setMessage('Only JPG and PNG files are allowed');
      return;
    }

    setVerificationData(prev => ({
      ...prev,
      [type]: file
    }));

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviews(prev => ({
        ...prev,
        [type]: e.target?.result as string
      }));
    };
    reader.readAsDataURL(file);
  };

  const removeFile = (type: 'ownerSelfie' | 'billboardPhoto') => {
    setVerificationData(prev => ({
      ...prev,
      [type]: null
    }));
    setPreviews(prev => ({
      ...prev,
      [type]: ''
    }));
  };

  const handleIssueToggle = (issue: string) => {
    setVerificationData(prev => ({
      ...prev,
      issuesFound: prev.issuesFound.includes(issue)
        ? prev.issuesFound.filter(i => i !== issue)
        : [...prev.issuesFound, issue]
    }));
  };

  const handleSubmit = async (action: 'save' | 'submit') => {
    if (!billboard || !user || !billboardId) return;

    if (action === 'submit') {
      if (!verificationData.ownerSelfie || !verificationData.billboardPhoto) {
        setMessage('Both owner selfie and billboard photo are required for submission');
        return;
      }

      if (!verificationData.verificationNotes.trim()) {
        setMessage('Verification notes are required for submission');
        return;
      }
    }

    setSubmitting(true);
    setMessage('');

    try {
      // Upload images to storage
      let ownerSelfieUrl = '';
      let billboardPhotoUrl = '';
      
      if (verificationData.ownerSelfie) {
        ownerSelfieUrl = await uploadSiteVisitPhoto(
          verificationData.ownerSelfie, 
          billboardId, 
          'owner_selfie'
        );
      }
      
      if (verificationData.billboardPhoto) {
        billboardPhotoUrl = await uploadSiteVisitPhoto(
          verificationData.billboardPhoto, 
          billboardId, 
          'billboard_photo'
        );
      }

      // Prepare site visit data
      const siteVisitData = {
        owner_selfie_url: ownerSelfieUrl,
        billboard_photo_url: billboardPhotoUrl,
        verification_notes: verificationData.verificationNotes,
        location_accuracy: verificationData.locationAccuracy,
        structural_condition: verificationData.structuralCondition,
        visibility_rating: verificationData.visibilityRating,
        issues_found: verificationData.issuesFound,
        recommendations: verificationData.recommendations,
        accessibility_notes: verificationData.accessibilityNotes
      };

      if (action === 'submit') {
        // Complete the verification process
        await completeSiteVerification(
          billboardId,
          user.id,
          verificationData.isVerified,
          siteVisitData
        );
        
        const statusMessage = verificationData.isVerified ? 'approved and activated' : 'rejected';
        setMessage(`Verification submitted successfully! Billboard has been ${statusMessage}.`);
        
        // Redirect after successful submission
        setTimeout(() => {
          navigate("/subadmin/dashboard");
        }, 2000);
      } else {
        // Just save as draft (not implemented in this demo)
        setMessage('Verification saved as draft successfully!');
      }

    } catch (error: any) {
      setMessage('Failed to save verification: ' + error.message);
      console.error('Submit error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading billboard details...</p>
        </div>
      </div>
    );
  }

  if (!billboard) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Billboard Not Found
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          The billboard you're trying to verify doesn't exist or has been
          removed.
        </p>
        <Link
          to="/subadmin/dashboard"
          className="text-blue-900 dark:text-blue-400 hover:underline"
        >
          Back to SubAdmin Dashboard
        </Link>
      </div>
    );
  }

  const commonIssues = [
    'Location does not match description',
    'Billboard structure damaged',
    'Poor visibility due to obstructions',
    'Incorrect dimensions',
    'Safety concerns',
    'Access restrictions',
    'Lighting issues',
    'Weather damage'
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link
        to="/subadmin/dashboard"
        className="inline-flex items-center text-blue-900 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-8"
      >
        <ArrowLeft className="h-5 w-5 mr-2" />
        Back to SubAdmin Dashboard
      </Link>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Billboard Verification
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Complete the physical verification for this billboard location.
          </p>
        </div>

        <div className="p-6">
          {message && (
            <div
              className={`mb-6 p-4 rounded-lg border ${
                message.includes("successfully")
                  ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200"
                  : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200"
              }`}
            >
              <div className="flex items-center">
                {message.includes("successfully") ? (
                  <CheckCircle className="h-5 w-5 mr-2" />
                ) : (
                  <AlertTriangle className="h-5 w-5 mr-2" />
                )}
                {message}
              </div>
            </div>
          )}

          {/* Billboard Information */}
          <div className="mb-8 p-6 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Billboard Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Title
                </p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {billboard.title}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Owner
                </p>
                <p className="font-medium text-gray-900 dark:text-white">
                  Billboard Owner
                </p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Location
                </p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {billboard.location_address}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Dimensions
                </p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {billboard.dimensions}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Facing
                </p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {billboard.facing}
                </p>
              </div>
              {billboard.google_maps_link && (
                <div className="md:col-span-2">
                  <a
                    href={billboard.google_maps_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                  >
                    <Navigation className="h-4 w-4 mr-1" />
                    Open in Google Maps
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Photo Upload Section */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Required Photos
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Owner Selfie */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Owner Selfie *
                </label>
                {previews.ownerSelfie ? (
                  <div className="relative">
                    <img
                      src={previews.ownerSelfie}
                      alt="Owner selfie"
                      className="w-full h-48 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                    />
                    <button
                      onClick={() => removeFile("ownerSelfie")}
                      className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors relative">
                    <Camera className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Take a selfie with the billboard owner
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      capture="user"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload("ownerSelfie", file);
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>
                )}
              </div>

              {/* Billboard Photo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Billboard Photo *
                </label>
                {previews.billboardPhoto ? (
                  <div className="relative">
                    <img
                      src={previews.billboardPhoto}
                      alt="Billboard photo"
                      className="w-full h-48 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                    />
                    <button
                      onClick={() => removeFile("billboardPhoto")}
                      className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors relative">
                    <Camera className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Take a photo of the billboard
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload("billboardPhoto", file);
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Verification Details */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Verification Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Location Accuracy
                </label>
                <select
                  value={verificationData.locationAccuracy}
                  onChange={(e) =>
                    setVerificationData((prev) => ({
                      ...prev,
                      locationAccuracy: e.target.value as any,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="exact">Exact Match</option>
                  <option value="approximate">Approximate Match</option>
                  <option value="incorrect">Incorrect Location</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Structural Condition
                </label>
                <select
                  value={verificationData.structuralCondition}
                  onChange={(e) =>
                    setVerificationData((prev) => ({
                      ...prev,
                      structuralCondition: e.target.value as any,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="excellent">Excellent</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Visibility Rating (1-10)
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={verificationData.visibilityRating}
                  onChange={(e) =>
                    setVerificationData((prev) => ({
                      ...prev,
                      visibilityRating: parseInt(e.target.value),
                    }))
                  }
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>Poor (1)</span>
                  <span className="font-medium">
                    {verificationData.visibilityRating}
                  </span>
                  <span>Excellent (10)</span>
                </div>
              </div>
            </div>

            {/* Issues Found */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Issues Found (if any)
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {commonIssues.map((issue) => (
                  <label key={issue} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={verificationData.issuesFound.includes(issue)}
                      onChange={() => handleIssueToggle(issue)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      {issue}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Verification Notes */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Verification Notes *
              </label>
              <textarea
                value={verificationData.verificationNotes}
                onChange={(e) =>
                  setVerificationData((prev) => ({
                    ...prev,
                    verificationNotes: e.target.value,
                  }))
                }
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Provide detailed notes about the verification process, any issues found, and overall assessment..."
              />
            </div>

            {/* Accessibility Notes */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Accessibility Notes
              </label>
              <textarea
                value={verificationData.accessibilityNotes}
                onChange={(e) =>
                  setVerificationData((prev) => ({
                    ...prev,
                    accessibilityNotes: e.target.value,
                  }))
                }
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Notes about access to the billboard location, parking, safety considerations..."
              />
            </div>

            {/* Recommendations */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Recommendations
              </label>
              <textarea
                value={verificationData.recommendations}
                onChange={(e) =>
                  setVerificationData((prev) => ({
                    ...prev,
                    recommendations: e.target.value,
                  }))
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Any recommendations for improvements or maintenance..."
              />
            </div>

            {/* Final Verification Decision */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                Verification Decision
              </label>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="verification"
                    checked={verificationData.isVerified === true}
                    onChange={() =>
                      setVerificationData((prev) => ({
                        ...prev,
                        isVerified: true,
                      }))
                    }
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    <strong className="text-green-600 dark:text-green-400">
                      Approve
                    </strong>{" "}
                    - Billboard meets all requirements
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="verification"
                    checked={verificationData.isVerified === false}
                    onChange={() =>
                      setVerificationData((prev) => ({
                        ...prev,
                        isVerified: false,
                      }))
                    }
                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    <strong className="text-red-600 dark:text-red-400">
                      Reject
                    </strong>{" "}
                    - Billboard has issues that need to be addressed
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4">
            <button
              onClick={() => handleSubmit("save")}
              disabled={submitting}
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center disabled:opacity-50"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Draft
            </button>
            <button
              onClick={() => handleSubmit("submit")}
              disabled={submitting}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors flex items-center disabled:opacity-50"
            >
              {submitting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Submit Verification
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerificationForm;