import React from 'react';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

const Disclaimer: React.FC = () => {
  const disclaimers = [
    "POSTERBAZAR operates as a digital marketplace facilitating connections between advertisers and billboard owners. We do not own, operate, or control any billboard properties listed on our platform.",
    "While we implement quality assurance measures and verification processes, we cannot guarantee the accuracy of all information provided by billboard owners regarding their properties.",
    "POSTERBAZAR is not liable for any direct, indirect, incidental, or consequential damages arising from the use of our services, including but not limited to business losses, data loss, or service interruptions.",
    "Billboard availability, pricing, specifications, and campaign performance may vary and are subject to change by property owners and external factors beyond our control.",
    "Physical verification timelines depend on location accessibility, weather conditions, and sub-administrator availability. Delays may occur due to circumstances beyond our control.",
    "All financial transactions are processed through secure third-party payment gateways. POSTERBAZAR is not responsible for payment gateway failures or banking delays.",
    "GST rates, government regulations, and tax policies are applied as per current Indian laws and may change without notice. Users are responsible for compliance with applicable regulations.",
    "Content displayed on billboards must comply with local advertising standards and regulations. Advertisers are solely responsible for content legality and appropriateness.",
    "POSTERBAZAR reserves the right to modify, suspend, or discontinue services at any time without prior notice. We strive to provide advance notification when possible.",
    "This disclaimer is governed by Indian law and any disputes will be subject to the jurisdiction of Indian courts."
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link to="/" className="inline-flex items-center text-blue-900 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-8">
        <ArrowLeft className="h-5 w-5 mr-2" />
        Back to Home
      </Link>

      <div className="flex items-center mb-8">
        <AlertTriangle className="h-8 w-8 text-blue-900 dark:text-blue-400 mr-3" />
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Disclaimer</h1>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
        <div className="space-y-6">
          {disclaimers.map((disclaimer, index) => (
            <div key={index} className="flex items-start">
              <div className="flex-shrink-0 mt-1">
                <div className="h-2 w-2 bg-blue-900 dark:bg-blue-400 rounded-full"></div>
              </div>
              <p className="ml-4 text-gray-600 dark:text-gray-300">{disclaimer}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Disclaimer;