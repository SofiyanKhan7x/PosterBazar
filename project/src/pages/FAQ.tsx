import React, { useState } from 'react';
import { ArrowLeft, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Link } from 'react-router-dom';

const FAQ: React.FC = () => {
  const [openItems, setOpenItems] = useState<number[]>([]);

  const toggleItem = (index: number) => {
    setOpenItems(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const faqs = [
    {
      question: "How do I book a billboard?",
      answer: "Simply browse our billboard listings, select your preferred location, choose your dates, and complete the booking process. You'll receive confirmation once the billboard owner approves your request."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards, UPI payments, and bank transfers. All payments are processed securely through our encrypted payment gateway."
    },
    {
      question: "How long does the approval process take?",
      answer: "Most bookings are approved within 24-48 hours. The billboard owner will review your request and respond promptly."
    },
    {
      question: "Can I cancel my booking?",
      answer: "Yes, you can cancel your booking according to our cancellation policy. Cancellation terms vary based on how far in advance you cancel."
    },
    {
      question: "Do you provide installation services?",
      answer: "Yes, we can arrange professional installation services for your advertisements. This service is available for an additional fee."
    },
    {
      question: "How do I list my billboard?",
      answer: "Register as a billboard owner, complete the KYC verification process, and submit your billboard details with photos. Our team will verify and approve your listing."
    },
    {
      question: "What are the GST implications?",
      answer: "All bookings include 18% GST as per Indian tax regulations. You'll receive a proper GST invoice for all transactions."
    },
    {
      question: "Can I get analytics for my campaign?",
      answer: "Yes, we provide detailed analytics including impressions, reach, and engagement metrics for digital billboards."
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link to="/" className="inline-flex items-center text-blue-900 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-8">
        <ArrowLeft className="h-5 w-5 mr-2" />
        Back to Home
      </Link>

      <div className="flex items-center mb-8">
        <HelpCircle className="h-8 w-8 text-blue-900 dark:text-blue-400 mr-3" />
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Frequently Asked Questions</h1>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
        {faqs.map((faq, index) => (
          <div key={index} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
            <button
              className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              onClick={() => toggleItem(index)}
            >
              <span className="font-medium text-gray-900 dark:text-white">{faq.question}</span>
              {openItems.includes(index) ? (
                <ChevronUp className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              )}
            </button>
            {openItems.includes(index) && (
              <div className="px-6 pb-4">
                <p className="text-gray-600 dark:text-gray-300">{faq.answer}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 text-center">
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Still have questions? We're here to help!
        </p>
        <a
          href="mailto:support@posterbazar.com"
          className="inline-flex items-center bg-blue-900 dark:bg-blue-700 text-white px-6 py-3 rounded-lg hover:bg-blue-800 dark:hover:bg-blue-600 transition-colors"
        >
          Contact Support
        </a>
      </div>
    </div>
  );
};

export default FAQ;