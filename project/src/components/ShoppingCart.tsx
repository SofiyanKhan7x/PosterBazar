import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShoppingCart as CartIcon, X, Calendar, MapPin, 
  IndianRupee, Trash2, Edit, CheckCircle, AlertTriangle,
  CreditCard, Clock, Eye
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { CartService } from '../services/cartService';
import { CartSession, CartItem } from '../types/billboard';

interface ShoppingCartProps {
  isOpen: boolean;
  onClose: () => void;
  onItemCountChange: (count: number) => void;
}

const ShoppingCart: React.FC<ShoppingCartProps> = ({ isOpen, onClose, onItemCountChange }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cart, setCart] = useState<CartSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [message, setMessage] = useState('');
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editDates, setEditDates] = useState({ start_date: '', end_date: '' });

useEffect(
  () => {
    const handleCartUpdated = (e: Event) => {
      const ce = e as CustomEvent;
      console.log("cartUpdated event received (ShoppingCart):", ce.detail);
      // defensive: only set if detail present
      if (ce?.detail) {
        setCart(ce.detail);
      } else {
        // no detail -> attempt to reload from server
        if (user) loadCart();
      }
    };

    window.addEventListener("cartUpdated", handleCartUpdated);
    return () => {
      window.removeEventListener("cartUpdated", handleCartUpdated);
    };
  },
  [
    /* no deps */
  ]
);




useEffect(() => {
  // If modal opens, always fetch fresh cart. This fixes the "missed event" case.
  if (isOpen && user) {
    loadCart();
  }
}, [isOpen, user]);


  useEffect(() => {
    onItemCountChange(cart?.total_items || 0);
  }, [cart?.total_items, onItemCountChange]);



  const loadCart = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const cartData = await CartService.getUserCart(user.id);
      console.log("Loaded cart data:", cartData);
      setCart(cartData);
    } catch (error) {
      console.error("Failed to load cart: ", error);
      setMessage("Failed to load cart");
    } finally {
      setLoading(false);
    }
  };




  const handleRemoveItem = async (itemId: string) => {
    if (!user) return;

    try {
      await CartService.removeFromCart(user.id, itemId);
      await loadCart(); // Refresh cart
      setMessage('Item removed from cart');
    } catch (error) {
      console.error('Error removing item:', error);
      setMessage('Failed to remove item');
    }
  };

  const handleEditItem = (item: CartItem) => {
    setEditingItem(item.id);
    setEditDates({
      start_date: item.start_date,
      end_date: item.end_date
    });
  };

  const handleSaveEdit = async (itemId: string) => {
    if (!user) return;

    try {
      await CartService.updateCartItem(user.id, itemId, editDates);
      await loadCart(); // Refresh cart
      setEditingItem(null);
      setMessage('Booking dates updated');
    } catch (error) {
      console.error('Error updating item:', error);
      setMessage('Failed to update dates');
    }
  };

  const handleValidateCart = async () => {
    if (!user) return;

    try {
      setValidating(true);
      const validation = await CartService.validateCartForCheckout(user.id);
      
      if (validation.valid) {
        setMessage('All items are available for booking!');
      } else {
        setMessage(`${validation.invalidItems.length} item(s) are no longer available`);
        // Remove invalid items
        for (const invalidItem of validation.invalidItems) {
          await CartService.removeFromCart(user.id, invalidItem.itemId);
        }
        await loadCart(); // Refresh cart
      }
    } catch (error) {
      console.error('Error validating cart:', error);
      setMessage('Failed to validate cart');
    } finally {
      setValidating(false);
    }
  };

  const handleCheckout = async () => {
    if (!user || !cart) return;

    try {
      // Validate cart first
      const validation = await CartService.validateCartForCheckout(user.id);
      
      if (!validation.valid) {
        setMessage('Some items are no longer available. Please review your cart.');
        return;
      }

      // Navigate to checkout page with cart data
      navigate('/checkout', { 
        state: { 
          cartSessionId: cart.id,
          totalAmount: cart.total_amount,
          totalItems: cart.total_items
        }
      });
      onClose();
    } catch (error) {
      console.error('Error during checkout:', error);
      setMessage('Failed to proceed to checkout');
    }
  };

  const getSideDisplayName = (sideBooked: string) => {
    switch (sideBooked) {
      case 'A': return 'Side A';
      case 'B': return 'Side B';
      case 'BOTH': return 'Both Sides';
      default: return 'Single Side';
    }
  };

  const getSideColor = (sideBooked: string) => {
    switch (sideBooked) {
      case 'A': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-400';
      case 'B': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400';
      case 'BOTH': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-400';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div className="flex items-center">
            <CartIcon className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-3" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Shopping Cart ({cart?.total_items || 0} items)
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading cart...</p>
            </div>
          ) : !cart || cart.items.length === 0 ? (
            <div className="p-8 text-center">
              <CartIcon className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Your cart is empty</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Browse our billboard listings and add them to your cart for easy booking.
              </p>
              <button
                onClick={() => {
                  navigate('/explore');
                  onClose();
                }}
                className="bg-blue-900 dark:bg-blue-700 text-white px-6 py-3 rounded-lg hover:bg-blue-800 dark:hover:bg-blue-600 transition-colors"
              >
                Explore Billboards
              </button>
            </div>
          ) : (
            <div className="p-6">
              {message && (
                <div className={`mb-4 p-4 rounded-lg border ${
                  message.includes('available') || message.includes('updated')
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
                    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
                }`}>
                  <div className="flex items-center">
                    {message.includes('available') || message.includes('updated') ? (
                      <CheckCircle className="h-5 w-5 mr-2" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 mr-2" />
                    )}
                    {message}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {cart.items.map((item) => (
                  <div key={item.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-start space-x-4">
                      <div className="h-20 w-32 rounded-lg overflow-hidden flex-shrink-0">
                        <img 
                          src={item.billboard_image} 
                          alt={item.billboard_title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">{item.billboard_title}</h3>
                            <div className="flex items-center text-gray-600 dark:text-gray-400 mt-1">
                              <MapPin className="h-4 w-4 mr-1" />
                              <span className="text-sm">{item.billboard_location}</span>
                            </div>
                            <div className="flex items-center space-x-2 mt-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSideColor(item.side_booked)}`}>
                                {getSideDisplayName(item.side_booked)}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {item.total_days} days
                              </span>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="flex items-center text-blue-600 dark:text-blue-400 font-semibold">
                              <IndianRupee className="h-4 w-4 mr-1" />
                              <span>₹{item.total_amount.toLocaleString()}</span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              ₹{item.price_per_day.toLocaleString()}/day
                            </p>
                          </div>
                        </div>

                        {editingItem === item.id ? (
                          <div className="mt-4 grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Start Date
                              </label>
                              <input
                                type="date"
                                value={editDates.start_date}
                                onChange={(e) => setEditDates({...editDates, start_date: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                End Date
                              </label>
                              <input
                                type="date"
                                value={editDates.end_date}
                                onChange={(e) => setEditDates({...editDates, end_date: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                              />
                            </div>
                            <div className="col-span-2 flex justify-end space-x-2">
                              <button
                                onClick={() => setEditingItem(null)}
                                className="px-3 py-1 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleSaveEdit(item.id)}
                                className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-4 flex items-center justify-between">
                            <div className="flex items-center text-gray-600 dark:text-gray-400 space-x-4">
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1" />
                                <span className="text-sm">
                                  {new Date(item.start_date).toLocaleDateString()} - {new Date(item.end_date).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-1" />
                                <span className="text-sm">
                                  Added {new Date(item.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => navigate(`/billboard/${item.billboard_id}`)}
                                className="p-1 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                                title="View billboard details"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleEditItem(item)}
                                className="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-md transition-colors"
                                title="Edit dates"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleRemoveItem(item.id)}
                                className="p-1 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-md transition-colors"
                                title="Remove from cart"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {cart && cart.items.length > 0 && (
          <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  Total: ₹{cart.total_amount.toLocaleString()}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {cart.total_items} billboard(s) • GST will be added at checkout
                </p>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleValidateCart}
                  disabled={validating}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-md transition-colors flex items-center disabled:opacity-50"
                >
                  {validating ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Validate Availability
                </button>
                
                <button
                  onClick={handleCheckout}
                  className="bg-blue-900 dark:bg-blue-700 text-white px-6 py-2 rounded-md hover:bg-blue-800 dark:hover:bg-blue-600 transition-colors flex items-center"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Proceed to Checkout
                </button>
              </div>
            </div>
            
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Cart expires on {new Date(cart.expires_at).toLocaleString()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShoppingCart;


