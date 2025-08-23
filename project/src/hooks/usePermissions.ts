import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { AuthService } from '../services/auth';

interface Permission {
  name: string;
  granted: boolean;
  expires?: Date;
}

export const usePermissions = () => {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadUserPermissions();
    } else {
      setPermissions([]);
      setLoading(false);
    }
  }, [user]);

  const loadUserPermissions = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // For sub-admins, provide default permissions
      if (user.role === 'sub_admin') {
        const defaultSubAdminPermissions = [
          'view_billboards',
          'verify_billboards', 
          'upload_verification_photos',
          'submit_verification_reports',
          'view_site_visits',
          'manage_verification_history',
          'access_subadmin_dashboard',
          'conduct_site_visits',
          'manage_billboard_verification'
        ];
        setPermissions(defaultSubAdminPermissions);
      } else {
        try {
          const userPermissions = await AuthService.getUserPermissions(user.id);
          setPermissions(userPermissions);
        } catch (error) {
          console.error('Error loading permissions from service, using defaults:', error);
          // Fallback permissions based on role
          const fallbackPermissions = user.role === 'admin' ? ['*'] : [];
          setPermissions(fallbackPermissions);
        }
      }
    } catch (error) {
      console.error('Error loading permissions:', error);
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (permission: string): boolean => {
    return permissions.includes(permission);
  };

  const hasAnyPermission = (permissionList: string[]): boolean => {
    return permissionList.some(permission => permissions.includes(permission));
  };

  const hasAllPermissions = (permissionList: string[]): boolean => {
    return permissionList.every(permission => permissions.includes(permission));
  };

  // Role-based permission checks
  const canViewBillboards = (): boolean => {
    return user?.role === 'admin' || hasPermission('view_billboards');
  };

  const canVerifyBillboards = (): boolean => {
    return user?.role === 'admin' || hasPermission('verify_billboards');
  };

  const canUploadVerificationPhotos = (): boolean => {
    return user?.role === 'admin' || hasPermission('upload_verification_photos');
  };

  const canSubmitVerificationReports = (): boolean => {
    return user?.role === 'admin' || hasPermission('submit_verification_reports');
  };

  const canViewSiteVisits = (): boolean => {
    return user?.role === 'admin' || hasPermission('view_site_visits');
  };

  const canManageVerificationHistory = (): boolean => {
    return user?.role === 'admin' || hasPermission('manage_verification_history');
  };

  const canManageUsers = (): boolean => {
    return user?.role === 'admin';
  };

  const canManageSubAdmins = (): boolean => {
    return user?.role === 'admin';
  };

  const canApproveRejectBillboards = (): boolean => {
    return user?.role === 'admin';
  };

  const canManageSystemSettings = (): boolean => {
    return user?.role === 'admin';
  };

  return {
    permissions,
    loading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canViewBillboards,
    canVerifyBillboards,
    canUploadVerificationPhotos,
    canSubmitVerificationReports,
    canViewSiteVisits,
    canManageVerificationHistory,
    canManageUsers,
    canManageSubAdmins,
    canApproveRejectBillboards,
    canManageSystemSettings,
    refreshPermissions: loadUserPermissions
  };
};