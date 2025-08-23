import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Upload, FileText, User, CreditCard, Building, 
   CheckCircle, X, Eye, AlertCircle
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { 
  uploadKYCDocument, 
  getUserKYCDocuments, 
  updateUserKYCStatus 
} from '../../services/supabase';
import { KYCDocument } from '../../services/supabase';

interface DocumentUpload {
  type: 'profile_photo' | 'aadhar_card' | 'pan_card' | 'bank_document';
  label: string;
  description: string;
  icon: React.ComponentType<any>;
  file?: File;
  preview?: string;
  status: 'pending' | 'uploaded' | 'approved' | 'rejected';
  existingDocument?: KYCDocument;
}

const KYCUploadPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [documents, setDocuments] = useState<DocumentUpload[]>([
    {
      type: 'profile_photo',
      label: 'Profile Photo',
      description: 'Clear photo of yourself (JPG, PNG)',
      icon: User,
      status: 'pending'
    },
    {
      type: 'aadhar_card',
      label: 'Aadhar Card',
      description: 'Front and back of Aadhar card (PDF, JPG)',
      icon: FileText,
      status: 'pending'
    },
    {
      type: 'pan_card',
      label: 'PAN Card',
      description: 'Clear image of PAN card (PDF, JPG)',
      icon: CreditCard,
      status: 'pending'
    },
    {
      type: 'bank_document',
      label: 'Bank Statement',
      description: 'Recent bank statement or passbook (PDF)',
      icon: Building,
      status: 'pending'
    }
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadExistingDocuments();
    }
  }, [user]);

  const loadExistingDocuments = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const existingDocs = await getUserKYCDocuments(user.id);
      
      // Update documents state with existing documents
      setDocuments(prev => prev.map(doc => {
        const existingDoc = existingDocs.find(e => e.document_type === doc.type);
        if (existingDoc) {
          return {
            ...doc,
            status: existingDoc.status as any,
            preview: existingDoc.document_url,
            existingDocument: existingDoc
          };
        }
        return doc;
      }));
      
    } catch (error) {
      console.error('Error loading existing documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (documentType: string, file: File) => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];

    if (file.size > maxSize) {
      setSubmitMessage('File size must be less than 10MB');
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      setSubmitMessage('Only JPG, PNG, and PDF files are allowed');
      return;
    }

    try {
      setIsSubmitting(true);
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      // Upload document to storage and save reference in database
      const documentUrl = await uploadKYCDocument(file, user.id, documentType);
      
      // Update local state
      setDocuments(prev => prev.map(doc => 
        doc.type === documentType 
          ? { 
              ...doc, 
              file, 
              preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
              status: 'uploaded' as const,
              existingDocument: { document_url: documentUrl } as KYCDocument
            }
          : doc
      ));
      
      setSubmitMessage('Document uploaded successfully!');
      
    } catch (error) {
      console.error('Error uploading document:', error);
      setSubmitMessage('Failed to upload document. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeDocument = (documentType: string) => {
    setDocuments(prev => prev.map(doc => 
      doc.type === documentType 
        ? { ...doc, file: undefined, preview: undefined, status: 'pending' as const }
        : doc
    ));
  };

  const handleSubmit = async () => {
    const uploadedDocs = documents.filter(doc => doc.status !== 'pending');
    
    if (uploadedDocs.length === 0) {
      setSubmitMessage('Please upload at least one document');
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      // Update user KYC status to submitted (resets from rejected to submitted)
      await updateUserKYCStatus(user.id, 'submitted');
      
      setSubmitMessage('Documents submitted successfully! Your KYC is under review.');
      
      // Redirect to dashboard after 3 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);

    } catch (error: any) {
      setSubmitMessage('Failed to submit documents: ' + error.message);
      console.error('Submit error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user || user.role !== 'owner') {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Access Denied</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Only billboard owners can upload KYC documents.
        </p>
        <Link to="/dashboard" className="text-blue-900 dark:text-blue-400 hover:underline">
          Go to Dashboard
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading your documents...</p>
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

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">KYC Document Upload</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Upload the required documents to verify your identity and start receiving payments.
          </p>
          
          {/* Show rejection notes if KYC was rejected */}
          {user?.kyc_status === 'rejected' && user?.rejection_notes && (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2 mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-red-800 dark:text-red-200 mb-1">
                    Previous Submission Rejected
                  </h3>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    <strong>Admin Feedback:</strong> {user.rejection_notes}
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                    Please address the above issues and resubmit your documents.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6">
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
                  <AlertCircle className="h-5 w-5 mr-2" />
                )}
                {submitMessage}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {documents.map((document) => {
              const IconComponent = document.icon;
              return (
                <div key={document.type} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                      <IconComponent className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">{document.label}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{document.description}</p>
                    </div>
                  </div>

                  {document.preview ? (
                    <div className="space-y-4">
                      {document.preview && document.preview.match(/\.(jpeg|jpg|png|gif)$/i) && (
                        <div className="relative">
                          <img 
                            src={document.preview} 
                            alt="Preview" 
                            className="w-full h-32 object-cover rounded-lg"
                          />
                          <button
                            onClick={() => window.open(document.preview, '_blank')}
                            className="absolute top-2 right-2 p-1 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex items-center">
                          <FileText className="h-5 w-5 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900 dark:text-white truncate">
                            {document.file?.name || document.type}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            document.status === 'approved' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400'
                              : document.status === 'rejected'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-400'
                          }`}>
                            {document.status.charAt(0).toUpperCase() + document.status.slice(1)}
                          </span>
                          {document.status !== 'approved' && document.status !== 'rejected' && (
                            <button
                              onClick={() => removeDocument(document.type)}
                              className="p-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors relative">
                      <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        Max file size: 10MB
                      </p>
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleFileUpload(document.type, file);
                          }
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        disabled={isSubmitting}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-8 flex justify-between items-center">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <p>• All documents will be securely stored and used only for verification</p>
              <p>• KYC verification typically takes 24-48 hours</p>
              <p>• You'll be notified once your documents are reviewed</p>
            </div>
            
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || documents.filter(doc => doc.status !== 'pending' && doc.status !== 'rejected').length === 0}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                isSubmitting || documents.filter(doc => doc.status !== 'pending' && doc.status !== 'rejected').length === 0
                  ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  : 'bg-blue-900 dark:bg-blue-700 text-white hover:bg-blue-800 dark:hover:bg-blue-600'
              }`}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Documents'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KYCUploadPage;