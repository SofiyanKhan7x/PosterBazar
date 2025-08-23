import React from 'react';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

const Terms: React.FC = () => {
  const sections = [
    {
      title: "Acceptance of Terms",
      content: "By accessing and using POSTERBAZAR, you accept and agree to be bound by these terms and conditions. These terms constitute a legally binding agreement between you and POSTERBAZAR."
    },
    {
      title: "Platform Description",
      content: "POSTERBAZAR is a digital marketplace that connects advertisers with billboard owners across India. We facilitate the discovery, booking, and management of outdoor advertising spaces."
    },
    {
      title: "User Eligibility",
      content: "Users must be at least 18 years old and legally capable of entering into contracts. You must provide accurate, current, and complete information during registration and maintain the accuracy of such information."
    },
    {
      title: "Account Responsibilities",
      content: "You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. Billboard owners must complete KYC verification and pay applicable joining fees."
    },
    {
      title: "Booking and Payment Terms",
      content: "All bookings are subject to approval by billboard owners and verification by our team. Payments include 18% GST and are processed through secure gateways. Cancellation policies apply based on timing of cancellation."
    },
    {
      title: "Prohibited Activities",
      content: "Users may not engage in fraudulent activities, provide false information, violate intellectual property rights, or use the platform for illegal advertising content. Violations may result in account suspension or termination."
    },
    {
      title: "Limitation of Liability",
      content: "POSTERBAZAR's liability is limited to the amount paid for services. We are not liable for indirect, incidental, or consequential damages. Our role is limited to facilitating connections between parties."
    },
    {
      title: "Governing Law",
      content: "These terms are governed by Indian law. Any disputes will be resolved through arbitration in accordance with the Arbitration and Conciliation Act, 2015, with proceedings conducted in English in Mumbai, India."
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link to="/" className="inline-flex items-center text-blue-900 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-8">
        <ArrowLeft className="h-5 w-5 mr-2" />
        Back to Home
      </Link>

      <div className="flex items-center mb-8">
        <BookOpen className="h-8 w-8 text-blue-900 dark:text-blue-400 mr-3" />
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Terms & Conditions</h1>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
        <p className="text-gray-600 dark:text-gray-300 mb-8">
          Please read these Terms and Conditions carefully before using BillboardHub.
        </p>

        <div className="space-y-8">
          {sections.map((section, index) => (
            <div key={index}>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">{section.title}</h2>
              <p className="text-gray-600 dark:text-gray-300">{section.content}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Last updated: January 2025
          </p>
        </div>
      </div>
    </div>
  );
};

export default Terms;