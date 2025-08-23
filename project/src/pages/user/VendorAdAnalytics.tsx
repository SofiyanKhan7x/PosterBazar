import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { 
   ArrowLeft, TrendingUp, Eye, MousePointer, 
  Calendar, IndianRupee, Target, Clock, Download
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface AnalyticsData {
  impressions: number;
  clicks: number;
  ctr: number;
  spend: number;
  cpm: number;
  conversions: number;
  conversionRate: number;
  reachPercentage: number;
  dailyData: {
    date: string;
    impressions: number;
    clicks: number;
    spend: number;
  }[];
}

const VendorAdAnalytics: React.FC = () => {
  const { user } = useAuth();
  const { adId } = useParams<{ adId: string }>();
  const [analytics] = useState<AnalyticsData>({
    impressions: 125000,
    clicks: 2500,
    ctr: 2.0,
    spend: 15000,
    cpm: 120,
    conversions: 75,
    conversionRate: 3.0,
    reachPercentage: 85,
    dailyData: [
      { date: '2024-06-01', impressions: 4200, clicks: 84, spend: 500 },
      { date: '2024-06-02', impressions: 4500, clicks: 90, spend: 500 },
      { date: '2024-06-03', impressions: 4100, clicks: 82, spend: 500 },
      { date: '2024-06-04', impressions: 4800, clicks: 96, spend: 500 },
      { date: '2024-06-05', impressions: 4300, clicks: 86, spend: 500 },
      { date: '2024-06-06', impressions: 4600, clicks: 92, spend: 500 },
      { date: '2024-06-07', impressions: 4400, clicks: 88, spend: 500 }
    ]
  });

  const [dateRange, setDateRange] = useState('7d');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load analytics data based on date range
    // This would typically fetch from an API
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, [dateRange, adId]);

  const handleExportData = () => {
    // Create CSV data
    const csvData = [
      ['Date', 'Impressions', 'Clicks', 'Spend'],
      ...analytics.dailyData.map(day => [
        day.date,
        day.impressions.toString(),
        day.clicks.toString(),
        day.spend.toString()
      ])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ad-analytics-${adId}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (!user || user.role !== 'user') {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Access Denied</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Only advertisers can view ad analytics.
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
        to="/user/vendor-ads" 
        className="inline-flex items-center text-blue-900 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-8"
      >
        <ArrowLeft className="h-5 w-5 mr-2" />
        Back to Ad Campaigns
      </Link>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Campaign Analytics</h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Detailed performance metrics for your ad campaign.
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
              <button
                onClick={handleExportData}
                className="bg-blue-900 dark:bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800 dark:hover:bg-blue-600 transition-colors flex items-center"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading analytics...</p>
            </div>
          ) : (
            <>
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <Eye className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                    <span className="text-xs text-green-600 dark:text-green-400 font-medium">+12%</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.impressions.toLocaleString()}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Impressions</p>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <MousePointer className="h-8 w-8 text-green-600 dark:text-green-400" />
                    <span className="text-xs text-green-600 dark:text-green-400 font-medium">+8%</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.clicks.toLocaleString()}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Clicks</p>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <TrendingUp className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
                    <span className="text-xs text-green-600 dark:text-green-400 font-medium">+0.3%</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.ctr}%</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Click-through Rate</p>
                </div>

                <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <IndianRupee className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                    <span className="text-xs text-red-600 dark:text-red-400 font-medium">+5%</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">₹{analytics.spend.toLocaleString()}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Spend</p>
                </div>
              </div>

              {/* Additional Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">₹{analytics.cpm}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Cost per Mille (CPM)</p>
                </div>

                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{analytics.conversions}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Conversions</p>
                </div>

                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{analytics.conversionRate}%</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Conversion Rate</p>
                </div>

                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{analytics.reachPercentage}%</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Audience Reach</p>
                </div>
              </div>

              {/* Daily Performance Chart */}
              <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Daily Performance</h3>
                <div className="space-y-4">
                  {analytics.dailyData.map((day, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-white dark:bg-gray-600 rounded-md">
                      <div className="flex items-center space-x-4">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {new Date(day.date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center space-x-6 text-sm">
                        <div className="text-center">
                          <p className="font-medium text-gray-900 dark:text-white">{day.impressions.toLocaleString()}</p>
                          <p className="text-gray-500 dark:text-gray-400">Impressions</p>
                        </div>
                        <div className="text-center">
                          <p className="font-medium text-gray-900 dark:text-white">{day.clicks}</p>
                          <p className="text-gray-500 dark:text-gray-400">Clicks</p>
                        </div>
                        <div className="text-center">
                          <p className="font-medium text-gray-900 dark:text-white">₹{day.spend}</p>
                          <p className="text-gray-500 dark:text-gray-400">Spend</p>
                        </div>
                        <div className="text-center">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {((day.clicks / day.impressions) * 100).toFixed(2)}%
                          </p>
                          <p className="text-gray-500 dark:text-gray-400">CTR</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Performance Insights */}
              <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-4">Performance Insights</h3>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <Target className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-blue-800 dark:text-blue-200 font-medium">Strong Performance</p>
                      <p className="text-blue-700 dark:text-blue-300 text-sm">
                        Your CTR of {analytics.ctr}% is above the industry average of 1.5%.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-blue-800 dark:text-blue-200 font-medium">Optimization Opportunity</p>
                      <p className="text-blue-700 dark:text-blue-300 text-sm">
                        Consider increasing budget during peak performance hours (2-4 PM).
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-blue-800 dark:text-blue-200 font-medium">Campaign Duration</p>
                      <p className="text-blue-700 dark:text-blue-300 text-sm">
                        Your campaign has been running for 15 days with consistent performance.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VendorAdAnalytics;