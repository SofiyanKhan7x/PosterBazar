// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { 
//   MapPin, CheckCircle, Clock, AlertTriangle, Camera, 
//    FileCheck, BarChart, Calendar,
//    Activity, Target, TrendingUp, Zap
// } from 'lucide-react';
// import { getSubAdminDashboardStats, getSubAdminAssignments } from '../../services/supabase';
// import { useAuth } from '../../hooks/useAuth';

// interface DashboardStats {
//   totalAssignedBillboards: number;
//   pendingVerifications: number;
//   completedVerifications: number;
//   rejectedVerifications: number;
//   thisMonthVisits: number;
//   averageVerificationTime: number;
//   assignedBillboards: {
//     assignment_id: string;
//     billboard_id: string;
//     billboard_title: string;
//     billboard_location: string;
//     billboard_owner_name: string;
//     assignment_status: string;
//     priority: string;
//     assigned_at: string;
//     due_date: string;
//     notes: string;
//   }[];
//   assignedBillboards: {
//     assignment_id: string;
//     billboard_id: string;
//     billboard_title: string;
//     billboard_location: string;
//     billboard_owner_name: string;
//     assignment_status: string;
//     priority: string;
//     assigned_at: string;
//     due_date: string;
//     notes: string;
//   }[];
//   pendingBillboards: {
//     id: string;
//     title: string;
//     location_address: string;
//     approved_at: string;
//     owner: {
//       name: string;
//     };
//   }[];
// }

// const SubAdminDashboard: React.FC = () => {
//   const { user } = useAuth();
//   const navigate = useNavigate();
//   const [stats, setStats] = useState<DashboardStats>({
//     totalAssignedBillboards: 0,
//     pendingVerifications: 0,
//     completedVerifications: 0,
//     rejectedVerifications: 0,
//     thisMonthVisits: 0,
//     averageVerificationTime: 0,
//     assignedBillboards: [],
//     assignedBillboards: [],
//     pendingBillboards: []
//   });
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     if (user) {
//       loadDashboardData();
//     }
//   }, [user]);

//   const loadDashboardData = async () => {
//     try {
//       setLoading(true);
//       if (!user) return;
      
//       // Load both dashboard stats and assignments
//       const [dashboardStats, assignments] = await Promise.all([
//         getSubAdminDashboardStats(user.id),
//         getSubAdminAssignments(user.id)
//       ]);
      
//       // Filter assignments to get only pending ones for the pending billboards list
//       const pendingAssignments = assignments.filter(a => a.assignment_status === 'pending');
      
//       setStats({
//         ...dashboardStats,
//         assignedBillboards: assignments,
//         pendingBillboards: pendingAssignments.map(assignment => ({
//           id: assignment.billboard_id,
//           title: assignment.billboard_title,
//           location_address: assignment.billboard_location,
//           approved_at: assignment.assigned_at,
//           owner: {
//             name: assignment.billboard_owner_name
//           },
//           priority: assignment.priority,
//           distance: Math.floor(Math.random() * 50) + 5 // Mock distance
//         }))
//       });
      
//     } catch (err) {
//       console.error('Error loading dashboard data:', err);
//       setError('Failed to load dashboard data');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleStartVerification = (billboardId: string) => {
//     navigate(`/subadmin/verify/${billboardId}`);
//   };

//   const handleViewAllSiteVisits = () => {
//     navigate('/subadmin/site-visits');
//   };

//   const handleViewHistory = () => {
//     navigate('/subadmin/history');
//   };

//   const getPriorityColor = (priority: string) => {
//     switch (priority) {
//       case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400';
//       case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-400';
//       case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400';
//       default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-400';
//     }
//   };

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center h-64">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto"></div>
//           <p className="mt-4 text-gray-600 dark:text-gray-400">
//             Loading dashboard...
//           </p>
//         </div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
//         <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
//         <h3 className="text-lg font-medium text-red-800 dark:text-red-200 mb-2">{error}</h3>
//         <button 
//           onClick={loadDashboardData}
//           className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
//         >
//           Retry
//         </button>
//       </div>
//     );
//   }

//   return (
//       <div className="space-y-8">
//       {/* Stats Grid */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
//         <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
//           <div className="flex items-center justify-between mb-4">
//             <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
//               <MapPin className="h-6 w-6 text-blue-600 dark:text-blue-400" />
//             </div>
//             <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
//               Total
//             </span>
//           </div>
//           <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalAssignedBillboards}</p>
//           <p className="text-sm text-gray-600 dark:text-gray-400">Assigned Billboards</p>
//         </div>

//         <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
//           <div className="flex items-center justify-between mb-4">
//             <div className="p-2 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg">
//               <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
//             </div>
//             <span className="text-xs font-medium text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/50 px-2 py-1 rounded-full">
//               Urgent
//             </span>
//           </div>
//           <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pendingVerifications}</p>
//           <p className="text-sm text-gray-600 dark:text-gray-400">Pending Verifications</p>
//         </div>

//         <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
//           <div className="flex items-center justify-between mb-4">
//             <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
//               <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
//             </div>
//             <span className="text-xs font-medium text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/50 px-2 py-1 rounded-full">
//               Done
//             </span>
//           </div>
//           <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.completedVerifications}</p>
//           <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
//         </div>

//         <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
//           <div className="flex items-center justify-between mb-4">
//             <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-lg">
//               <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
//             </div>
//             <span className="text-xs font-medium text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/50 px-2 py-1 rounded-full">
//               Issues
//             </span>
//           </div>
//           <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.rejectedVerifications}</p>
//           <p className="text-sm text-gray-600 dark:text-gray-400">Rejected</p>
//         </div>

//         <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
//           <div className="flex items-center justify-between mb-4">
//             <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
//               <Calendar className="h-6 w-6 text-purple-600 dark:text-purple-400" />
//             </div>
//             <span className="text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/50 px-2 py-1 rounded-full">
//               Month
//             </span>
//           </div>
//           <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.thisMonthVisits}</p>
//           <p className="text-sm text-gray-600 dark:text-gray-400">This Month</p>
//         </div>

//         <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
//           <div className="flex items-center justify-between mb-4">
//             <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
//               <Activity className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
//             </div>
//             <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/50 px-2 py-1 rounded-full">
//               Avg
//             </span>
//           </div>
//           <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.averageVerificationTime}h</p>
//           <p className="text-sm text-gray-600 dark:text-gray-400">Avg Time</p>
//         </div>
//       </div>

//       {/* Main Grid */}
//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//         {/* Pending Verifications */}
//         <div className="lg:col-span-2">
//           <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
//             <div className="p-6 border-b border-gray-200 dark:border-gray-700">
//               <div className="flex justify-between items-center">
//                 <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Pending Verifications</h2>
//                 <button 
//                   onClick={handleViewAllSiteVisits}
//                   className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium"
//                 >
//                   View All
//                 </button>
//               </div>
//             </div>
//             <div className="p-6">
//               {stats.pendingBillboards.length === 0 ? (
//                 <div className="text-center py-12">
//                   <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
//                   <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">All caught up!</h3>
//                   <p className="text-gray-600 dark:text-gray-400 mb-6">
//                     No pending verifications at the moment. Great work!
//                   </p>
//                 </div>
//               ) : (
//                 <div className="space-y-4">
//                   {stats.pendingBillboards.map((billboard) => (
//                     <div key={billboard.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
//                       <div className="flex items-center space-x-4">
//                         <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
//                           <MapPin className="h-6 w-6 text-white" />
//                         </div>
//                         <div className="flex-1">
//                           <h3 className="font-medium text-gray-900 dark:text-white">{billboard.title}</h3>
//                           <p className="text-sm text-gray-600 dark:text-gray-400">{billboard.location_address}</p>
//                           <div className="flex items-center space-x-4 mt-1">
//                             <span className="text-xs text-gray-500 dark:text-gray-400">Owner: {billboard.owner.name}</span>
//                             <span className="text-xs text-gray-500 dark:text-gray-400">~{Math.floor(Math.random() * 50) + 5}km away</span>
//                           </div>
//                         </div>
//                       </div>
//                       <div className="flex items-center space-x-3">
//                         <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor('high')}`}>
//                           high
//                         </span>
//                         <button
//                           onClick={() => handleStartVerification(billboard.id)}
//                           className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center"
//                         >
//                           <Camera className="h-4 w-4 mr-1" />
//                           Verify
//                         </button>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>

//         {/* Right Sidebar */}
//         <div className="space-y-8">
//           {/* Quick Actions */}
//           <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
//             <div className="p-6 border-b border-gray-200 dark:border-gray-700">
//               <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Quick Actions</h2>
//             </div>
//             <div className="p-6">
//               <div className="space-y-3">
//                 <button 
//                   onClick={handleViewAllSiteVisits}
//                   className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg hover:from-blue-100 hover:to-blue-200 dark:hover:from-blue-800/30 dark:hover:to-blue-700/30 transition-all"
//                 >
//                   <span className="text-gray-900 dark:text-white font-medium">Site Visits</span>
//                   <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400" />
//                 </button>
//                 <button 
//                   onClick={handleViewHistory}
//                   className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg hover:from-green-100 hover:to-green-200 dark:hover:from-green-800/30 dark:hover:to-green-700/30 transition-all"
//                 >
//                   <span className="text-gray-900 dark:text-white font-medium">History</span>
//                   <FileCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
//                 </button>
//                 <button className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg hover:from-purple-100 hover:to-purple-200 dark:hover:from-purple-800/30 dark:hover:to-purple-700/30 transition-all">
//                   <span className="text-gray-900 dark:text-white font-medium">Reports</span>
//                   <BarChart className="h-5 w-5 text-purple-600 dark:text-purple-400" />
//                 </button>
//               </div>
//             </div>
//           </div>

//           {/* Performance Overview */}
//           <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
//             <div className="p-6 border-b border-gray-200 dark:border-gray-700">
//               <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Performance</h2>
//             </div>
//             <div className="p-6">
//               <div className="space-y-4">
//                 <div className="flex items-center justify-between">
//                   <div className="flex items-center space-x-3">
//                     <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
//                       <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
//                     </div>
//                     <span className="text-sm text-gray-600 dark:text-gray-400">Success Rate</span>
//                   </div>
//                   <span className="text-sm font-semibold text-green-600 dark:text-green-400">95%</span>
//                 </div>
//                 <div className="flex items-center justify-between">
//                   <div className="flex items-center space-x-3">
//                     <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
//                       <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
//                     </div>
//                     <span className="text-sm text-gray-600 dark:text-gray-400">Accuracy Score</span>
//                   </div>
//                   <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">98%</span>
//                 </div>
//                 <div className="flex items-center justify-between">
//                   <div className="flex items-center space-x-3">
//                     <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
//                       <Zap className="h-4 w-4 text-purple-600 dark:text-purple-400" />
//                     </div>
//                     <span className="text-sm text-gray-600 dark:text-gray-400">Response Time</span>
//                   </div>
//                   <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">2.1h</span>
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Recent Activity */}
//           <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
//             <div className="p-6 border-b border-gray-200 dark:border-gray-700">
//               <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Recent Activity</h2>
//             </div>
//             <div className="p-6">
//               <div className="space-y-4">
//                 <div className="flex items-start p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
//                   <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
//                   <div className="ml-3">
//                     <p className="text-sm text-green-800 dark:text-green-200">Verified billboard successfully</p>
//                     <p className="text-xs text-green-600 dark:text-green-300 mt-1">2 hours ago</p>
//                   </div>
//                 </div>
//                 <div className="flex items-start p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
//                   <Camera className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
//                   <div className="ml-3">
//                     <p className="text-sm text-blue-800 dark:text-blue-200">Started site visit</p>
//                     <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">4 hours ago</p>
//                   </div>
//                 </div>
//                 <div className="flex items-start p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
//                   <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
//                   <div className="ml-3">
//                     <p className="text-sm text-yellow-800 dark:text-yellow-200">Requested re-verification</p>
//                     <p className="text-xs text-yellow-600 dark:text-yellow-300 mt-1">1 day ago</p>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//       </div>
//   );
// };

// export default SubAdminDashboard;