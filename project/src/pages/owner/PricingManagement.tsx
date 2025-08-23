import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
   ArrowLeft, IndianRupee, Edit, Save, TrendingUp, 
  Calendar, BarChart, Calculator, Info
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface PricingRule {
  id: string;
  billboardId: string;
  billboardName: string;
  basePrice: number;
  weekendMultiplier: number;
  holidayMultiplier: number;
  longTermDiscount: {
    days: number;
    discount: number;
  }[];
  seasonalPricing: {
    season: string;
    multiplier: number;
    startDate: string;
    endDate: string;
  }[];
  minimumDays: number;
  gstRate: number;
  lastUpdated: string;
}

const PricingManagement: React.FC = () => {
  const { user } = useAuth();
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);

  const [editingRule, setEditingRule] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<PricingRule>>({});
  const [calculatorDays, setCalculatorDays] = useState(30);
  const [calculatorDate, setCalculatorDate] = useState(new Date().toISOString().split('T')[0]);

  const handleEdit = (rule: PricingRule) => {
    setEditingRule(rule.id);
    setEditForm({ ...rule });
  };

  const handleSave = () => {
    if (editingRule && editForm) {
      setPricingRules(rules => 
        rules.map(rule => 
          rule.id === editingRule 
            ? { ...rule, ...editForm, lastUpdated: new Date().toISOString().split('T')[0] }
            : rule
        )
      );
      setEditingRule(null);
      setEditForm({});
    }
  };

  const handleCancel = () => {
    setEditingRule(null);
    setEditForm({});
  };

  const calculatePrice = (rule: PricingRule, days: number, startDate: string) => {
    let totalPrice = rule.basePrice * days;
    
    // Apply long-term discount
    const applicableDiscount = rule.longTermDiscount
      .filter(d => days >= d.days)
      .sort((a, b) => b.discount - a.discount)[0];
    
    if (applicableDiscount) {
      totalPrice = totalPrice * (1 - applicableDiscount.discount / 100);
    }

    // Apply seasonal pricing (simplified)
    const date = new Date(startDate);
    const isHoliday = date.getDay() === 0 || date.getDay() === 6; // Weekend as holiday for demo
    
    if (isHoliday) {
      totalPrice = totalPrice * rule.weekendMultiplier;
    }

    const gstAmount = totalPrice * (rule.gstRate / 100);
    const finalAmount = totalPrice + gstAmount;

    return {
      baseAmount: rule.basePrice * days,
      discountAmount: applicableDiscount ? (rule.basePrice * days * applicableDiscount.discount / 100) : 0,
      subtotal: totalPrice,
      gstAmount,
      finalAmount
    };
  };

  if (!user || user.role !== 'owner') {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Access Denied</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Only billboard owners can manage pricing.
        </p>
        <Link to="/dashboard" className="text-blue-900 dark:text-blue-400 hover:underline">
          Go to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link 
        to="/dashboard" 
        className="inline-flex items-center text-blue-900 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-8"
      >
        <ArrowLeft className="h-5 w-5 mr-2" />
        Back to Dashboard
      </Link>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pricing Management</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Set rates, discounts, and view GST breakdown for your billboards.
          </p>
        </div>

        <div className="p-6">
          <div className="space-y-8">
            {pricingRules.map((rule) => (
              <div key={rule.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{rule.billboardName}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Last updated: {rule.lastUpdated}</p>
                  </div>
                  {editingRule !== rule.id && (
                    <button
                      onClick={() => handleEdit(rule)}
                      className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit Pricing
                    </button>
                  )}
                </div>

                {editingRule === rule.id ? (
                  // Edit Form
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Base Price (₹/day)
                        </label>
                        <input
                          type="number"
                          value={editForm.basePrice || ''}
                          onChange={(e) => setEditForm({...editForm, basePrice: parseFloat(e.target.value)})}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Weekend Multiplier
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={editForm.weekendMultiplier || ''}
                          onChange={(e) => setEditForm({...editForm, weekendMultiplier: parseFloat(e.target.value)})}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Holiday Multiplier
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={editForm.holidayMultiplier || ''}
                          onChange={(e) => setEditForm({...editForm, holidayMultiplier: parseFloat(e.target.value)})}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Minimum Days
                        </label>
                        <input
                          type="number"
                          value={editForm.minimumDays || ''}
                          onChange={(e) => setEditForm({...editForm, minimumDays: parseInt(e.target.value)})}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          GST Rate (%)
                        </label>
                        <input
                          type="number"
                          value={editForm.gstRate || ''}
                          onChange={(e) => setEditForm({...editForm, gstRate: parseFloat(e.target.value)})}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={handleCancel}
                        className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-blue-900 dark:bg-blue-700 text-white rounded-md hover:bg-blue-800 dark:hover:bg-blue-600 transition-colors flex items-center"
                      >
                        <Save className="h-4 w-4 mr-1" />
                        Save Changes
                      </button>
                    </div>
                  </div>
                ) : (
                  // Display Mode
                  <div className="space-y-6">
                    {/* Basic Pricing */}
                    <div>
                      <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">Basic Pricing</h4>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                          <div className="flex items-center">
                            <IndianRupee className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
                            <div>
                              <p className="text-sm text-blue-600 dark:text-blue-400">Base Price</p>
                              <p className="text-lg font-semibold text-blue-900 dark:text-blue-300">₹{rule.basePrice}/day</p>
                            </div>
                          </div>
                        </div>
                        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                          <div className="flex items-center">
                            <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
                            <div>
                              <p className="text-sm text-green-600 dark:text-green-400">Weekend</p>
                              <p className="text-lg font-semibold text-green-900 dark:text-green-300">{rule.weekendMultiplier}x</p>
                            </div>
                          </div>
                        </div>
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                          <div className="flex items-center">
                            <Calendar className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-2" />
                            <div>
                              <p className="text-sm text-yellow-600 dark:text-yellow-400">Holiday</p>
                              <p className="text-lg font-semibold text-yellow-900 dark:text-yellow-300">{rule.holidayMultiplier}x</p>
                            </div>
                          </div>
                        </div>
                        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                          <div className="flex items-center">
                            <BarChart className="h-5 w-5 text-purple-600 dark:text-purple-400 mr-2" />
                            <div>
                              <p className="text-sm text-purple-600 dark:text-purple-400">GST Rate</p>
                              <p className="text-lg font-semibold text-purple-900 dark:text-purple-300">{rule.gstRate}%</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Long-term Discounts */}
                    <div>
                      <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">Long-term Discounts</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {rule.longTermDiscount.map((discount, index) => (
                          <div key={index} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                            <p className="text-sm text-gray-600 dark:text-gray-400">{discount.days}+ days</p>
                            <p className="text-lg font-semibold text-gray-900 dark:text-white">{discount.discount}% off</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Price Calculator */}
                    <div>
                      <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3 flex items-center">
                        <Calculator className="h-5 w-5 mr-2" />
                        Price Calculator
                      </h4>
                      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Number of Days
                            </label>
                            <input
                              type="number"
                              value={calculatorDays}
                              onChange={(e) => setCalculatorDays(parseInt(e.target.value))}
                              min={rule.minimumDays}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Start Date
                            </label>
                            <input
                              type="date"
                              value={calculatorDate}
                              onChange={(e) => setCalculatorDate(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:text-white"
                            />
                          </div>
                        </div>
                        
                        {calculatorDays >= rule.minimumDays && (
                          <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                            {(() => {
                              const calculation = calculatePrice(rule, calculatorDays, calculatorDate);
                              return (
                                <div className="space-y-2">
                                  <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">Base Amount ({calculatorDays} days):</span>
                                    <span className="font-medium">₹{calculation.baseAmount.toLocaleString()}</span>
                                  </div>
                                  {calculation.discountAmount > 0 && (
                                    <div className="flex justify-between text-green-600 dark:text-green-400">
                                      <span>Long-term Discount:</span>
                                      <span>-₹{calculation.discountAmount.toLocaleString()}</span>
                                    </div>
                                  )}
                                  <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                                    <span className="font-medium">₹{calculation.subtotal.toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">GST ({rule.gstRate}%):</span>
                                    <span className="font-medium">₹{calculation.gstAmount.toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between text-lg font-bold border-t border-gray-200 dark:border-gray-600 pt-2">
                                    <span>Total Amount:</span>
                                    <span className="text-blue-600 dark:text-blue-400">₹{calculation.finalAmount.toLocaleString()}</span>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        )}
                        
                        {calculatorDays < rule.minimumDays && (
                          <div className="flex items-center text-amber-600 dark:text-amber-400">
                            <Info className="h-4 w-4 mr-2" />
                            <span className="text-sm">Minimum booking period is {rule.minimumDays} days</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {pricingRules.length === 0 && (
            <div className="text-center py-12">
              <IndianRupee className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No pricing rules found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Add billboards to your account to manage their pricing.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PricingManagement;