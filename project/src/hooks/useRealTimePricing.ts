import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { RealTimePricingService, VendorAdPricing, PricingHistoryRecord } from '../services/realTimePricing';

interface RealTimePricingState {
  pricing: VendorAdPricing[];
  history: PricingHistoryRecord[];
  loading: boolean;
  updating: boolean;
  error: string | null;
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
  lastUpdated: Date | null;
}

export const useRealTimePricing = () => {
  const { user } = useAuth();
  const [state, setState] = useState<RealTimePricingState>({
    pricing: [],
    history: [],
    loading: true,
    updating: false,
    error: null,
    connectionStatus: 'disconnected',
    lastUpdated: null
  });

  // Load initial pricing data
  const loadPricing = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const [pricingData, historyData] = await Promise.all([
        RealTimePricingService.getCurrentPricing(),
        RealTimePricingService.getPricingHistory(undefined, 20)
      ]);

      setState(prev => ({
        ...prev,
        pricing: pricingData,
        history: historyData,
        loading: false,
        lastUpdated: new Date()
      }));
    } catch (error) {
      console.error('Error loading pricing data:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load pricing data'
      }));
    }
  }, []);

  // Update pricing (admin only)
  const updatePricing = useCallback(async (
    adTypeId: string,
    newPrice: number,
    changeReason?: string
  ) => {
    if (!user || user.role !== 'admin') {
      throw new Error('Only administrators can update pricing');
    }

    try {
      setState(prev => ({ ...prev, updating: true, error: null }));

      const result = await RealTimePricingService.updatePricing(
        adTypeId,
        newPrice,
        user.id,
        changeReason
      );

      if (result.success) {
        // Update local state optimistically
        setState(prev => ({
          ...prev,
          pricing: prev.pricing.map(p => 
            p.ad_type_id === adTypeId 
              ? { ...p, base_price: newPrice, last_updated: result.timestamp }
              : p
          ),
          updating: false,
          lastUpdated: new Date()
        }));

        // Refresh history to include new change
        const updatedHistory = await RealTimePricingService.getPricingHistory(undefined, 20);
        setState(prev => ({ ...prev, history: updatedHistory }));

        return result;
      } else {
        throw new Error(result.error || 'Failed to update pricing');
      }
    } catch (error) {
      console.error('Error updating pricing:', error);
      setState(prev => ({
        ...prev,
        updating: false,
        error: error instanceof Error ? error.message : 'Failed to update pricing'
      }));
      throw error;
    }
  }, [user]);

  // Set up real-time subscription
  useEffect(() => {
    if (!user) return;

    // Load initial data
    loadPricing();

    // Set up real-time subscription
    const unsubscribe = RealTimePricingService.subscribeToRealTimePricing(
      (updatedPricing) => {
        console.log('Real-time pricing update received:', updatedPricing);
        setState(prev => ({
          ...prev,
          pricing: updatedPricing,
          connectionStatus: 'connected',
          lastUpdated: new Date()
        }));
      },
      (error) => {
        console.error('Real-time pricing error:', error);
        setState(prev => ({
          ...prev,
          connectionStatus: 'disconnected',
          error: error.message
        }));
      }
    );

    // Update connection status
    setState(prev => ({ 
      ...prev, 
      connectionStatus: RealTimePricingService.getConnectionStatus() 
    }));

    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
    };
  }, [user, loadPricing]);

  // Manual refresh function
  const refreshPricing = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, error: null }));
      const updatedPricing = await RealTimePricingService.refreshPricing();
      setState(prev => ({
        ...prev,
        pricing: updatedPricing,
        lastUpdated: new Date()
      }));
    } catch (error) {
      console.error('Error refreshing pricing:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to refresh pricing'
      }));
    }
  }, []);

  // Validate pricing input
  const validatePricing = useCallback((price: number) => {
    return RealTimePricingService.validatePricing(price);
  }, []);

  // Format currency
  const formatCurrency = useCallback((amount: number, currency: string = 'INR') => {
    return RealTimePricingService.formatCurrency(amount, currency);
  }, []);

  // Calculate price change
  const calculatePriceChange = useCallback((oldPrice: number, newPrice: number) => {
    return RealTimePricingService.calculatePriceChange(oldPrice, newPrice);
  }, []);

  return {
    ...state,
    updatePricing,
    refreshPricing,
    validatePricing,
    formatCurrency,
    calculatePriceChange,
    loadPricing
  };
};