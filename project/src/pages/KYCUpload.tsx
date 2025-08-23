import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Upload, FileText, User, CreditCard, Building, 
   CheckCircle, AlertCircle, X, Eye
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface DocumentUpload {
  type: 'profile_photo' | 'aadhar_card' | 'pan_card' | 'bank_document';
  label: string;
  description: string;
  icon: React.ComponentType<any>;
  file?: File;
  preview?: string;
  status: 'pending' | 'uploaded' | 'verified' | 'rejected';
}

const KYCUpload: React.FC = () => {
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

  const handleFileUpload = (documentType: string, file: File) => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];

    if (file.size > maxSize) {
      alert('File size must be less than 10MB');
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      alert('Only JPG, PNG, and PDF files are allowed');
      return;
    }

    // Create preview URL for images
    let preview = '';
    if (file.type.startsWith('image/')) {
      preview = URL.createObjectURL(file);
    }

    setDocuments(prev => prev.map(doc => 
      doc.type === documentType 
        ? { ...doc, file, preview, status: 'uploaded' as const }
        : doc
    ));
  };

  const removeDocument = (documentType: string) => {
    setDocuments(prev => prev.map(doc => 
      doc.type === documentType 
        ? { ...doc, file: undefined, preview: undefined, status: 'pending' as const }
        : doc
    ));
  };

  const handleSubmit = async () => {
    const uploadedDocs = documents.filter(doc => doc.file);
    
    if (uploadedDocs.length === 0) {
      setSubmitMessage('Please upload at least one document');
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      // Simulate API call to upload documents
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In a real application, you would upload files to storage and save references to database
      setSubmitMessage('Documents uploaded successfully! Your KYC is under review.');
      
      // Update document status
      setDocuments(prev => prev.map(doc => 
        doc.file ? { ...doc, status: 'verified' as const } : doc
      ));

      // Redirect to dashboard after 3 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);

    } catch (error) {
      setSubmitMessage('Failed to upload documents. Please try again.');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Access Denied</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">Please log in to upload KYC documents.</p>
        <Link to="/login" className="text-blue-900 dark:text-blue-400 hover:underline">
          Go to Login
        </Link>
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
            Upload the required documents to verify your identity and start using all platform features.
          </p>
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

                  {document.file ? (
                    <div className="space-y-4">
                      {document.preview && (
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
                            {document.file.name}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            document.status === 'verified' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-400'
                          }`}>
                            {document.status === 'verified' ? 'Verified' : 'Uploaded'}
                          </span>
                          <button
                            onClick={() => removeDocument(document.type)}
                            className="p-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors">
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
              disabled={isSubmitting || documents.filter(doc => doc.file).length === 0}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                isSubmitting || documents.filter(doc => doc.file).length === 0
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

export default KYCUpload;