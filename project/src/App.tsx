import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { BookingProvider } from './context/BookingContext'; 
import { ThemeProvider } from './context/ThemeContext';
import { useAuth } from './hooks/useAuth';
import Layout from './components/Layout';
import Home from './pages/Home';
import Explore from './pages/Explore';
import BillboardDetails from './pages/BillboardDetails';
import BookingPage from './pages/BookingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import VendorRegister from './pages/VendorRegister';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import KYCUpload from './pages/KYCUpload';
import BillboardUpload from './pages/BillboardUpload';
import FAQ from './pages/FAQ';
import Policies from './pages/Policies';
import Terms from './pages/Terms';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Disclaimer from './pages/Disclaimer';
import AboutUs from './pages/AboutUs';
import NotFound from './pages/NotFound';
import Checkout from './pages/Checkout';
import BookingSuccess from './pages/BookingSuccess';

// Owner Dashboard Pages
import KYCUploadPage from './pages/owner/KYCUploadPage';
import LocationManagement from './pages/owner/LocationManagement';
import SpecificationManagement from './pages/owner/SpecificationManagement';
import PricingManagement from './pages/owner/PricingManagement';

// User Dashboard Pages
import VendorAdManagement from './pages/user/VendorAdManagement';
import VendorAdAnalytics from './pages/user/VendorAdAnalytics';

// Admin Dashboard Pages
import BillboardTypeManagement from './pages/admin/BillboardTypeManagement';
import BillboardSizeFeeManagement from './pages/admin/BillboardSizeFeeManagement';
import AdminBillboardApprovals from './pages/admin/AdminBillboardApprovals';
import TestimonialManagement from './pages/admin/TestimonialManagement';
import SubAdminManagement from './pages/admin/SubAdminManagement';
import VendorAdApprovals from './pages/admin/VendorAdApprovals';
import VendorAdPricingManagement from './pages/admin/VendorAdPricingManagement';
import UserManagement from './pages/admin/UserManagement';
import ActiveHoardingsManagement from './pages/admin/ActiveHoardingsManagement';
import RevenueBreakdown from './pages/admin/RevenueBreakdown';
import KYCVerificationManagement from './pages/admin/KYCVerificationManagement';

// Vendor Ad Landing Page
import VendorAdLanding from './pages/VendorAdLanding';

// Sub-Admin Dashboard Pages
import SubAdminDashboard from './pages/subadmin/SubAdminDashboard';
import SiteVisitManagement from './pages/subadmin/SiteVisitManagement';
import VerificationForm from './pages/subadmin/VerificationForm';
import VerificationHistory from './pages/subadmin/VerificationHistory';

// Vendor Dashboard Pages
import VendorDashboard from './pages/vendor/VendorDashboard';
import CampaignManagement from './pages/vendor/CampaignManagement';
import VendorAdSystemManagement from './pages/admin/VendorAdSystemManagement';
import VendorAdWorkflow from './pages/vendor/VendorAdWorkflow';

// Protected Route Component
const ProtectedRoute: React.FC<{ 
  children: React.ReactNode; 
  allowedRoles: string[];
  redirectTo?: string;
}> = ({ children, allowedRoles, redirectTo = '/login' }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={redirectTo} replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Dashboard Route Component
const DashboardRoute: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Role-based dashboard routing
  switch (user.role) {
    case 'admin':
      return <Navigate to="/admin/dashboard" replace />;
    case 'sub_admin':
      return <Navigate to="/subadmin/dashboard" replace />;
    case 'vendor':
      return <Navigate to="/vendor/dashboard" replace />;
    case 'owner':
      return <Navigate to="/owner/dashboard" replace />;
    case 'user':
    default:
      return <Dashboard />;
  }
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <BookingProvider>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="explore" element={<Explore />} />
                <Route path="billboard/:id" element={<BillboardDetails />} />
                <Route path="book/:id" element={<BookingPage />} />
                <Route path="dashboard" element={<DashboardRoute />} />
                <Route path="kyc-upload" element={<KYCUpload />} />
                <Route path="billboard-upload" element={<BillboardUpload />} />
                
                {/* Owner Dashboard Routes */}
                <Route path="owner/dashboard" element={
                  <ProtectedRoute allowedRoles={['owner']}>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                <Route path="owner/kyc-upload" element={
                  <ProtectedRoute allowedRoles={['owner']}>
                    <KYCUploadPage />
                  </ProtectedRoute>
                } />
                <Route path="owner/location-management" element={
                  <ProtectedRoute allowedRoles={['owner']}>
                    <LocationManagement />
                  </ProtectedRoute>
                } />
                <Route path="owner/specification-management" element={
                  <ProtectedRoute allowedRoles={['owner']}>
                    <SpecificationManagement />
                  </ProtectedRoute>
                } />
                <Route path="owner/pricing-management" element={
                  <ProtectedRoute allowedRoles={['owner']}>
                    <PricingManagement />
                  </ProtectedRoute>
                } />
                
                {/* User Dashboard Routes */}
                <Route path="user/vendor-ads" element={
                  <ProtectedRoute allowedRoles={['user']}>
                    <VendorAdManagement />
                  </ProtectedRoute>
                } />
                <Route path="user/vendor-ads/:adId/analytics" element={
                  <ProtectedRoute allowedRoles={['user']}>
                    <VendorAdAnalytics />
                  </ProtectedRoute>
                } />
                
                {/* Vendor Dashboard Routes */}
                <Route path="vendor/dashboard" element={
                  <ProtectedRoute allowedRoles={['vendor']}>
                    <VendorDashboard />
                  </ProtectedRoute>
                } />
                <Route path="vendor/campaigns" element={
                  <ProtectedRoute allowedRoles={['vendor']}>
                    <CampaignManagement />
                  </ProtectedRoute>
                } />
                <Route path="vendor/campaigns/:campaignId" element={
                  <ProtectedRoute allowedRoles={['vendor']}>
                    <CampaignManagement />
                  </ProtectedRoute>
                } />
                <Route path="vendor/campaigns/:campaignId/analytics" element={
                  <ProtectedRoute allowedRoles={['vendor']}>
                    <VendorAdAnalytics />
                  </ProtectedRoute>
                } />
                <Route path="vendor/ad-workflow" element={
                  <ProtectedRoute allowedRoles={['vendor']}>
                    <VendorAdWorkflow />
                  </ProtectedRoute>
                } />
                
                {/* Admin Dashboard Routes */}
                <Route path="admin/dashboard" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                <Route path="admin/billboard-types" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <BillboardTypeManagement />
                  </ProtectedRoute>
                } />
                <Route path="admin/billboard-size-fees" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <BillboardSizeFeeManagement />
                  </ProtectedRoute>
                } />
                <Route path="admin/approvals" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminBillboardApprovals />
                  </ProtectedRoute>
                } />
                <Route path="admin/testimonials" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <TestimonialManagement />
                  </ProtectedRoute>
                } />
                <Route path="admin/sub-admins" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <SubAdminManagement />
                  </ProtectedRoute>
                } />
                <Route path="admin/vendor-ads" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <VendorAdApprovals />
                  </ProtectedRoute>
                } />
                <Route path="admin/vendor-ad-system" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <VendorAdSystemManagement />
                  </ProtectedRoute>
                } />
                <Route path="admin/vendor-ad-pricing" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <VendorAdPricingManagement />
                  </ProtectedRoute>
                } />
                <Route path="admin/vendor-ad-approvals" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <VendorAdApprovals />
                  </ProtectedRoute>
                } />
                <Route path="admin/users" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <UserManagement />
                  </ProtectedRoute>
                } />
                <Route path="admin/active-hoardings" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <ActiveHoardingsManagement />
                  </ProtectedRoute>
                } />
                <Route path="admin/revenue-breakdown" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <RevenueBreakdown />
                  </ProtectedRoute>
                } />
                <Route path="admin/kyc-verification" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <KYCVerificationManagement />
                  </ProtectedRoute>
                } />
                
                {/* Vendor Ad Landing Page */}
                <Route path="vendor-ad/:adId" element={<VendorAdLanding />} />
                
                {/* Sub-Admin Dashboard Routes */}
                <Route path="subadmin/dashboard" element={
                  <ProtectedRoute allowedRoles={['sub_admin']}>
                    <SubAdminDashboard />
                  </ProtectedRoute>
                } />
                <Route path="subadmin/site-visits" element={
                  <ProtectedRoute allowedRoles={['sub_admin']}>
                    <SiteVisitManagement />
                  </ProtectedRoute>
                } />
                <Route path="subadmin/verify/:billboardId" element={
                  <ProtectedRoute allowedRoles={['sub_admin']}>
                    <VerificationForm />
                  </ProtectedRoute>
                } />
                <Route path="subadmin/history" element={
                  <ProtectedRoute allowedRoles={['sub_admin']}>
                    <VerificationHistory />
                  </ProtectedRoute>
                } />
                
                <Route path="policies" element={<Policies />} />
                <Route path="faq" element={<FAQ />} />
                <Route path="terms" element={<Terms />} />
                <Route path="privacy" element={<PrivacyPolicy />} />
                <Route path="disclaimer" element={<Disclaimer />} />
                <Route path="about" element={<AboutUs />} />
              </Route>
              <Route path="checkout" element={<Checkout />} />
              <Route path="booking-success" element={<BookingSuccess />} />
              <Route path="login" element={<Login />} />
              <Route path="register" element={<Register />} />
              <Route path="vendor-register" element={<VendorRegister />} />
              <Route path="forgot-password" element={<ForgotPassword />} />
              <Route path="reset-password" element={<ResetPassword />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BookingProvider>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;