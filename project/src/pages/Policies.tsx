import React, { useState } from 'react';
import { ArrowLeft, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { Link } from 'react-router-dom';

const Policies: React.FC = () => {
  const [openSection, setOpenSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  const policies = [
    {
      id: "terms",
      title: "Terms of Service",
      content: [
        "By accessing and using POSTERBAZAR, you accept and agree to be bound by these terms and conditions.",
        "POSTERBAZAR is a digital intermediary platform connecting advertisers with billboard owners across India.",
        "Users must be at least 18 years old to use our services and must provide accurate information during registration.",
        "Billboard owners must complete KYC verification and pay applicable joining fees before listing their properties.",
        "All bookings are subject to approval by billboard owners and physical verification by our team.",
        "Payment terms include 18% GST as per Indian tax regulations, with secure processing through verified payment gateways.",
        "Cancellation policies vary based on timing - full refunds for cancellations 7+ days in advance, with fees for shorter notice.",
        "POSTERBAZAR reserves the right to suspend or terminate accounts for violations of these terms or fraudulent activity.",
        "These terms are governed by Indian law and disputes will be resolved in Indian courts."
      ]
    },
    {
      id: "privacy",
      title: "Privacy Policy",
      content: [
        "POSTERBAZAR is committed to protecting your privacy and personal information in accordance with Indian data protection laws.",
        "We collect personal information including name, email, phone number, address, and payment details necessary for our services.",
        "Business information such as billboard specifications, location data, and verification documents are collected from billboard owners.",
        "Your data is used solely for account management, booking processing, payment handling, and service improvement.",
        "We share information only with authorized personnel for verification purposes and payment processors for transactions.",
        "We implement industry-standard security measures including encryption, secure servers, and access controls.",
        "You have the right to access, correct, or delete your personal data by contacting our support team.",
        "We retain data only as long as necessary for business purposes and legal compliance.",
        "Cookies are used to enhance user experience and website functionality - you can manage cookie preferences in your browser."
      ]
    },
    {
      id: "disclaimer",
      title: "Disclaimer",
      content: [
        "POSTERBAZAR acts as a digital marketplace facilitating connections between advertisers and billboard owners.",
        "We do not own, operate, or control any of the billboard properties listed on our platform.",
        "While we verify listings through our quality assurance process, we cannot guarantee the accuracy of all information provided by billboard owners.",
        "POSTERBAZAR is not liable for any direct, indirect, incidental, or consequential damages arising from the use of our services.",
        "Billboard availability, pricing, and specifications are subject to change by property owners.",
        "Physical verification timelines depend on location accessibility and weather conditions.",
        "All financial transactions are processed through secure, third-party payment gateways.",
        "GST rates and government regulations are applied as per current Indian tax laws and may change.",
        "Users are responsible for compliance with local advertising regulations and content guidelines."
      ]
    },
    {
      id: "refund",
      title: "Refund Policy",
      content: [
        "Cancellations made 7 or more days before campaign start date: Full refund minus 5% processing fee.",
        "Cancellations made 3-6 days before start date: 70% refund of total amount paid.",
        "Cancellations made 1-2 days before start date: 50% refund of total amount paid.",
        "Cancellations made on the start date or after: No refund available.",
        "If a billboard becomes unavailable due to circumstances beyond owner control: Full refund or alternative placement offered.",
        "If verification fails due to misrepresentation: Full refund processed within 5-7 business days.",
        "Billboard owner joining fees are non-refundable once the verification process begins.",
        "Payment gateway charges (if any) are non-refundable in all scenarios.",
        "Refunds are processed to the original payment method within 7-10 business days.",
        "For refund requests, contact support@posterbazar.com with booking reference and payment details."
      ]
    },
    {
      id: "kyc",
      title: "KYC Policy",
      content: [
        "KYC (Know Your Customer) verification is mandatory for all billboard owners before listing properties.",
        "Required documents include: Valid government photo ID (Aadhar Card/PAN Card), proof of billboard ownership or lease agreement, recent bank statement or cancelled cheque, and current address proof.",
        "All documents must be clear, legible, and valid at the time of submission.",
        "Our verification team reviews submitted documents within 48-72 hours of receipt.",
        "Additional documentation may be requested if initial submissions are incomplete or unclear.",
        "KYC status affects account privileges - unverified accounts have limited access to platform features.",
        "We may require periodic re-verification (annually or upon significant account changes).",
        "All KYC data is stored securely with bank-level encryption and access is restricted to authorized personnel only.",
        "False or fraudulent documentation will result in immediate account suspension and potential legal action.",
        "Our KYC process complies with RBI guidelines and Indian digital marketplace regulations."
      ]
    },
    {
      id: "payment",
      title: "Payment Policy",
      content: [
        "POSTERBAZAR accepts multiple payment methods including credit/debit cards, UPI, net banking, and digital wallets.",
        "All transactions are processed through PCI-DSS compliant payment gateways ensuring maximum security.",
        "Bookings are confirmed only after successful payment verification and processing.",
        "All prices displayed are exclusive of 18% GST, which is added at checkout as per Indian tax regulations.",
        "Billboard owners receive payments within 7 business days after successful campaign completion.",
        "POSTERBAZAR charges a platform commission of 10% on all successful bookings.",
        "Joining fees for billboard owners are based on property size and are payable during registration.",
        "Failed payments result in booking cancellation after 24 hours unless resolved.",
        "Digital invoices with GST details are automatically generated and emailed to registered addresses.",
        "Payment disputes must be reported within 30 days of transaction with supporting documentation.",
        "International payments may incur additional gateway charges as applicable.",
        "All financial records are maintained for audit purposes and regulatory compliance."
      ]
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link to="/" className="inline-flex items-center text-blue-900 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-8">
        <ArrowLeft className="h-5 w-5 mr-2" />
        Back to Home
      </Link>

      <div className="flex items-center mb-8">
        <FileText className="h-8 w-8 text-blue-900 dark:text-blue-400 mr-3" />
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Policies</h1>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <p className="text-gray-600 dark:text-gray-300">
            Please review our policies carefully. These policies govern your use of POSTERBAZAR services and outline our commitments to you.
          </p>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {policies.map((policy) => (
            <div key={policy.id} className="p-6">
              <button
                onClick={() => toggleSection(policy.id)}
                className="w-full flex justify-between items-center text-left"
              >
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{policy.title}</h2>
                {openSection === policy.id ? (
                  <ChevronUp className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                )}
              </button>
              
              {openSection === policy.id && (
                <div className="mt-4 space-y-4">
                  {policy.content.map((paragraph, index) => (
                    <p key={index} className="text-gray-600 dark:text-gray-300">
                      {paragraph}
                    </p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Last updated: June 2025
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            For any questions regarding our policies, please contact <a href="mailto:support@posterbazar.com" className="text-blue-600 dark:text-blue-400 hover:underline">support@posterbazar.com</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Policies;