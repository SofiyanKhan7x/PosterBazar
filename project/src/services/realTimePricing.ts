import { supabase } from './supabase';

export interface VendorAdPricing {
  id: string;
  ad_type_id: string;
  ad_type_name: string;
  base_price: number;
  currency: string;
  effective_from: string;
  last_updated: string;
  updated_by_name?: string;
}

export interface PricingHistoryRecord {
  id: string;
  ad_type_id: string;
  ad_type_name: string;
  old_price: number;
  new_price: number;
  change_reason: string;
  changed_by_name: string;
  change_timestamp: string;
}

export interface PricingNotification {
  id: string;
  ad_type_id: string;
  notification_type: 'price_update' | 'price_freeze' | 'bulk_update';
  old_price: number;
  new_price: number;
  affected_vendors: string[];
  broadcast_timestamp: string;
}

interface PricingUpdateResult {
  success: boolean;
  ad_type_id: string;
  old_price: number;
  new_price: number;
  updated_by: string;
  timestamp: string;
  error?: string;
}

export class RealTimePricingService {
  private static subscriptions: Map<string, any> = new Map();
  private static connectionStatus: 'connected' | 'disconnected' | 'reconnecting' = 'disconnected';

  /**
   * Get current vendor ad pricing with real-time updates
   */
  static async getCurrentPricing(): Promise<VendorAdPricing[]> {
    try {
      if (!supabase) {
        throw new Error('Database service not available');
      }

      // Check if vendor_ad_pricing table exists first
      try {
        // Test if the table exists by trying a simple query
        const testQuery = await supabase
          .from('vendor_ad_pricing')
          .select('id')
          .limit(1);
        
        if (testQuery.error) {
          const errorCode = testQuery.error?.code || '';
          const errorMessage = testQuery.error?.message || '';
          
          if (errorCode === '42P01' || errorMessage.includes('does not exist')) {
            console.warn('Vendor ad pricing table not yet created. Using ad_types as fallback.');
            return await this.getFallbackPricing();
          }
          throw new Error(testQuery.error.message);
        }
        
        // If table exists, try the RPC function
        const rpcResult = await supabase.rpc('get_vendor_ad_pricing');
        
        if (rpcResult.error) {
          console.warn('RPC function not available, using direct table query.');
          
          // Fallback to direct table query
          const directResult = await supabase
            .from('vendor_ad_pricing')
            .select(`
              id,
              ad_type_id,
              ad_types!inner(type_name),
              base_price,
              currency,
              effective_from,
              last_updated,
              users(name)
            `)
            .eq('is_active', true)
            .order('ad_types(type_name)');
          
          if (directResult.error) {
            throw new Error(directResult.error.message);
          }
          
          return directResult.data?.map((item: any) => ({
            id: item.id,
            ad_type_id: item.ad_type_id,
            ad_type_name: item.ad_types.type_name,
            base_price: item.base_price,
            currency: item.currency,
            effective_from: item.effective_from,
            last_updated: item.last_updated,
            updated_by_name: item.users?.name || 'System'
          })) || [];
        }
        
        return rpcResult.data || [];
      } catch (tableError: any) {
        // Handle missing table/relation errors
        const errorMessage = tableError?.message || tableError?.toString() || '';
        const errorCode = tableError?.code || '';
        
        if (errorCode === '42P01' || 
            errorMessage.includes('relation') && errorMessage.includes('does not exist')) {
          console.warn('Vendor ad pricing system not available. Using ad_types as fallback.');
          return await this.getFallbackPricing();
        }
        
        throw tableError;
      }
    } catch (error) {
      console.error('Error in getCurrentPricing:', error);
      throw error;
    }
  }

  /**
   * Fallback pricing from ad_types table
   */
  private static async getFallbackPricing(): Promise<VendorAdPricing[]> {
    const fallbackResult = await supabase
      .from('ad_types')
      .select('id, type_name, base_price')
      .eq('is_active', true)
      .order('type_name');
    
    if (fallbackResult.error) {
      throw new Error(fallbackResult.error.message);
    }
    
    return fallbackResult.data?.map((item: any) => ({
      id: item.id,
      ad_type_id: item.id,
      ad_type_name: item.type_name,
      base_price: item.base_price || 100,
      currency: 'INR',
      effective_from: new Date().toISOString(),
      last_updated: new Date().toISOString(),
      updated_by_name: 'System'
    })) || [];
  }

  /**
   * Update vendor ad pricing (admin only)
   */
  static async updatePricing(
    adTypeId: string,
    newPrice: number,
    adminId: string,
    changeReason: string = 'Admin price update'
  ): Promise<PricingUpdateResult> {
    try {
      if (!supabase) {
        throw new Error('Database service not available');
      }

      // Validate input
      if (newPrice < 0) {
        throw new Error('Price must be positive');
      }

      if (!adTypeId || !adminId) {
        throw new Error('Ad type ID and admin ID are required');
      }

      // Try RPC function first, fallback to manual update
      let data, error;
      
      try {
        const rpcResult = await supabase.rpc('update_vendor_ad_pricing', {
          p_ad_type_id: adTypeId,
          p_new_price: newPrice,
          p_admin_id: adminId,
          p_change_reason: changeReason
        });
        data = rpcResult.data;
        error = rpcResult.error;
      } catch (rpcError) {
        console.warn('RPC function not available, using manual update:', rpcError);
        
        // Fallback to manual update
        // Update the ad_types table directly
        const { error: adTypesDirectUpdateError } = await supabase
          .from('ad_types')
          .update({
            base_price: newPrice,
            updated_at: new Date().toISOString()
          })
          .eq('id', adTypeId);
        
        if (adTypesDirectUpdateError) {
          console.error('Error updating pricing:', adTypesDirectUpdateError);
          throw new Error(adTypesDirectUpdateError.message || 'Failed to update pricing');
        }

        // Return success result for manual update
        data = {
          success: true,
          ad_type_id: adTypeId,
          old_price: 0, // We don't have the old price in this fallback
          new_price: newPrice,
          updated_by: adminId,
          timestamp: new Date().toISOString()
        };
      }

      if (error) {
        console.error('Error updating pricing:', error);
        throw new Error(error.message || 'Failed to update pricing');
      }

      return data;
    } catch (error) {
      console.error('Error in updatePricing:', error);
      throw error;
    }
  }

  /**
   * Get pricing history for audit trail
   */
  static async getPricingHistory(
    adTypeId?: string,
    limit: number = 50
  ): Promise<PricingHistoryRecord[]> {
    try {
      if (!supabase) {
        throw new Error('Database service not available');
      }

      // Try RPC function first, fallback to direct query
      let data, error;
      
      try {
        const rpcResult = await supabase.rpc('get_pricing_history', {
          p_ad_type_id: adTypeId || null,
          p_limit: limit
        });
        data = rpcResult.data;
        error = rpcResult.error;
      } catch (rpcError) {
        console.warn('RPC function not available, returning empty history:', rpcError);
        
        // Fallback to direct table query
        try {
          let query = supabase
            .from('pricing_history')
            .select(`
              id,
              ad_type_id,
              ad_types!inner(type_name),
              old_price,
              new_price,
              change_reason,
              users(name),
              change_timestamp
            `)
            .order('change_timestamp', { ascending: false })
            .limit(limit);
          
          if (adTypeId) {
            query = query.eq('ad_type_id', adTypeId);
          }
          
          const queryResult = await query;
          
          data = queryResult.data?.map((item: any) => ({
            id: item.id,
            ad_type_id: item.ad_type_id,
            ad_type_name: item.ad_types.type_name,
            old_price: item.old_price,
            new_price: item.new_price,
            change_reason: item.change_reason,
            changed_by_name: item.users?.name || 'Unknown',
            change_timestamp: item.change_timestamp
          }));
          error = queryResult.error;
        } catch (fallbackError) {
          // Check if this is a missing relation error
          const errorMessage = (fallbackError as any)?.message || '';
          if (errorMessage.includes('relation') && errorMessage.includes('does not exist')) {
            console.warn('Pricing history table not yet created. Returning empty history.');
            return [];
          }
          throw fallbackError;
        }
      }

      if (error) {
        // Check if this is a missing relation error
        const errorMessage = error?.message || '';
        if (errorMessage.includes('relation') && errorMessage.includes('does not exist')) {
          console.warn('Pricing history table not yet created. Returning empty history.');
          return [];
        }
        console.error('Error fetching pricing history:', error);
        throw new Error('Failed to fetch pricing history');
      }

      return data || [];
    } catch (error) {
      console.error('Error in getPricingHistory:', error);
      throw error;
    }
  }

  /**
   * Subscribe to real-time pricing updates
   */
  static subscribeToRealTimePricing(
    onPricingUpdate: (pricing: VendorAdPricing[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    try {
      if (!supabase) {
        console.warn('Real-time pricing not available - Supabase client missing');
        return () => {};
      }

      this.connectionStatus = 'connected';

      // Subscribe to pricing table changes
      const pricingSubscription = supabase
        .channel('vendor_pricing_updates')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'vendor_ad_pricing'
          },
          async (payload: any) => {
            console.log('Real-time pricing update received:', payload);
            
            try {
              // Fetch updated pricing data
              const updatedPricing = await this.getCurrentPricing();
              onPricingUpdate(updatedPricing);
            } catch (error) {
              console.error('Error handling pricing update:', error);
              if (onError) onError(error as Error);
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'pricing_notifications'
          },
          (payload: any) => {
            console.log('Pricing notification received:', payload);
            // Handle pricing notifications for additional UI updates
          }
        )
        .subscribe((status: any) => {
          console.log('Pricing subscription status:', status);
          
          if (status === 'SUBSCRIBED') {
            this.connectionStatus = 'connected';
          } else if (status === 'CHANNEL_ERROR') {
            this.connectionStatus = 'disconnected';
            console.warn('Real-time pricing connection failed - database tables may not exist yet');
            // Don't call onError for missing tables, just log the warning
          }
        });

      // Store subscription for cleanup
      const subscriptionKey = `pricing_${Date.now()}`;
      this.subscriptions.set(subscriptionKey, pricingSubscription);

      // Return cleanup function
      return () => {
        const subscription = this.subscriptions.get(subscriptionKey);
        if (subscription) {
          subscription.unsubscribe();
          this.subscriptions.delete(subscriptionKey);
        }
      };
    } catch (error) {
      console.error('Failed to set up real-time pricing subscription:', error);
      this.connectionStatus = 'disconnected';
      if (onError) onError(error as Error);
      return () => {};
    }
  }

  /**
   * Subscribe to pricing notifications for vendors
   */
  static subscribeToVendorNotifications(
    vendorId: string,
    onNotification: (notification: PricingNotification) => void
  ): () => void {
    try {
      if (!supabase) {
        return () => {};
      }

      const notificationSubscription = supabase
        .channel('vendor_pricing_notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'pricing_notifications'
          },
          (payload: any) => {
            console.log('Vendor pricing notification:', payload);
            
            if (payload.new && payload.new.affected_vendors?.includes(vendorId)) {
              onNotification({
                id: payload.new.id,
                ad_type_id: payload.new.ad_type_id,
                notification_type: payload.new.notification_type,
                old_price: payload.new.old_price,
                new_price: payload.new.new_price,
                affected_vendors: payload.new.affected_vendors,
                broadcast_timestamp: payload.new.broadcast_timestamp
              });
            }
          }
        )
        .subscribe();

      const subscriptionKey = `vendor_notifications_${vendorId}`;
      this.subscriptions.set(subscriptionKey, notificationSubscription);

      return () => {
        const subscription = this.subscriptions.get(subscriptionKey);
        if (subscription) {
          subscription.unsubscribe();
          this.subscriptions.delete(subscriptionKey);
        }
      };
    } catch (error) {
      console.error('Failed to set up vendor notification subscription:', error);
      return () => {};
    }
  }

  /**
   * Get connection status
   */
  static getConnectionStatus(): 'connected' | 'disconnected' | 'reconnecting' {
    return this.connectionStatus;
  }

  /**
   * Manually refresh pricing data
   */
  static async refreshPricing(): Promise<VendorAdPricing[]> {
    try {
      return await this.getCurrentPricing();
    } catch (error) {
      console.error('Error refreshing pricing:', error);
      throw error;
    }
  }

  /**
   * Validate pricing input
   */
  static validatePricing(price: number): { valid: boolean; error?: string } {
    if (isNaN(price)) {
      return { valid: false, error: 'Price must be a valid number' };
    }

    if (price < 0) {
      return { valid: false, error: 'Price must be positive' };
    }

    if (price > 1000000) {
      return { valid: false, error: 'Price cannot exceed ₹10,00,000' };
    }

    return { valid: true };
  }

  /**
   * Format currency for display
   */
  static formatCurrency(amount: number, currency: string = 'INR'): string {
    try {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      }).format(amount);
    } catch (error) {
      // Fallback formatting
      return `₹${amount.toLocaleString()}`;
    }
  }

  /**
   * Calculate price change percentage
   */
  static calculatePriceChange(oldPrice: number, newPrice: number): {
    percentage: number;
    direction: 'increase' | 'decrease' | 'no_change';
  } {
    if (oldPrice === 0) {
      return { percentage: 0, direction: 'no_change' };
    }

    const percentage = ((newPrice - oldPrice) / oldPrice) * 100;
    
    return {
      percentage: Math.abs(percentage),
      direction: percentage > 0 ? 'increase' : percentage < 0 ? 'decrease' : 'no_change'
    };
  }

  /**
   * Cleanup all subscriptions
   */
  static cleanup(): void {
    this.subscriptions.forEach((subscription) => {
      try {
        subscription.unsubscribe();
      } catch (error) {
        console.warn('Error unsubscribing:', error);
      }
    });
    this.subscriptions.clear();
    this.connectionStatus = 'disconnected';
  }
}