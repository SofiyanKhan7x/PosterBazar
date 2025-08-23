import React from 'react';
import { ArrowLeft, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

const PrivacyPolicy: React.FC = () => {
  const sections = [
    {
      title: "Data Collection",
      content: "We collect personal information including name, email, phone number, address, payment details, and business information necessary for providing our marketplace services. Billboard owners also provide property specifications and verification documents."
    },
    {
      title: "Purpose of Data Usage",
      content: "Your data is used for account management, booking processing, payment handling, verification procedures, customer support, service improvement, and compliance with legal requirements. We do not use data for unauthorized marketing or third-party sales."
    },
    {
      title: "Sharing",
      content: "We do not sell, rent, or trade your personal information. Data is shared only with authorized verification personnel, payment processors for transaction handling, and legal authorities when required by law."
    },
    {
      title: "Data Security",
      content: "We implement industry-standard security measures including encryption, secure servers, access controls, and regular security audits. All sensitive data is encrypted both in transit and at rest using bank-level security protocols."
    },
    {
      title: "Data Retention",
      content: "We retain personal data only as long as necessary for business purposes and legal compliance. Account data is retained for 7 years after account closure for audit and legal purposes, after which it is securely deleted."
    },
    {
      title: "User Rights",
      content: "You have the right to access, correct, update, or delete your personal data. You may also request data portability or object to certain processing activities. Contact support@posterbazar.com to exercise these rights."
    },
    {
      title: "Cookies and Tracking",
      content: "We use cookies to enhance user experience, maintain sessions, and analyze website usage. You can manage cookie preferences through your browser settings. Essential cookies are required for platform functionality."
    },
    {
      title: "Third-Party Services",
      content: "We use trusted third-party services for payments, analytics, and communication. These partners are bound by strict data protection agreements and process data only as instructed by us."
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link to="/" className="inline-flex items-center text-blue-900 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-8">
        <ArrowLeft className="h-5 w-5 mr-2" />
        Back to Home
      </Link>

      <div className="flex items-center mb-8">
        <Shield className="h-8 w-8 text-blue-900 dark:text-blue-400 mr-3" />
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Privacy Policy</h1>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
        <p className="text-gray-600 dark:text-gray-300 mb-8">
          At BillboardHub, we value your privacy. This policy explains how we collect, use, and protect your data.
        </p>

        <div className="space-y-8">
          {sections.map((section, index) => (
            <div key={index}>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">{section.title}</h2>
              <p className="text-gray-600 dark:text-gray-300">{section.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;