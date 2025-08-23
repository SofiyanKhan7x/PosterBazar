import React, { useState, useEffect } from 'react';
import { ShoppingCart as ShoppingCartIcon } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { CartService } from '../services/cartService';
import ShoppingCart from './ShoppingCart';

const CartIcon: React.FC = () => {
  const { user } = useAuth();
  const [itemCount, setItemCount] = useState(0);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadCartCount();
      
      // Set up periodic refresh of cart count
      const interval = setInterval(loadCartCount, 30000); // Every 30 seconds
      
      // Listen for cart updates
      const handleCartUpdate = () => {
        loadCartCount();
      };
      
      window.addEventListener('cartUpdated', handleCartUpdate);
      
        window.removeEventListener('cartUpdated', handleCartUpdate);
      return () => clearInterval(interval);
    } else {
      setItemCount(0);
      setLoading(false); // Ensure loading state is cleared for unauthenticated users
    }
  }, [user]);

  const loadCartCount = async () => {
    if (!user) {
      setItemCount(0);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const count = await CartService.getCartItemCount(user.id);
      setItemCount(count);
    } catch (error) {
      // Only log cart errors for authenticated users to reduce noise
      if (user) {
        console.error('Error loading cart count:', error);
      }
      setItemCount(0);
    } finally {
      setLoading(false);
    }
  };

  const handleCartClick = () => {
    if (!user) {
      // Redirect to login if not authenticated
      window.location.href = '/login';
      return;
    }
    setIsCartOpen(true);
  };

  const handleItemCountChange = (count: number) => {
    setItemCount(count);
  };


  return (
    <>
      <button
        onClick={handleCartClick}
        className="relative p-3 rounded-lg bg-primary-100 dark:bg-accent-800 hover:bg-primary-200 dark:hover:bg-accent-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
        aria-label={`Shopping cart with ${itemCount} items`}
        title={`Shopping cart (${itemCount} items)`}
      >
        <ShoppingCartIcon className="h-6 w-6 text-primary-800 dark:text-accent-200" />
        
        {itemCount > 0 && (
          <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center animate-pulse">
            {itemCount > 99 ? '99+' : itemCount}
          </div>
        )}
        
        {loading && (
          <div className="absolute inset-0 bg-white dark:bg-gray-800 bg-opacity-50 rounded-lg flex items-center justify-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          </div>
        )}
      </button>

      <ShoppingCart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onItemCountChange={handleItemCountChange}
      />
    </>
  );
};

export default CartIcon;