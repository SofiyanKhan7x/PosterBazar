



import { supabase } from "./supabase";
import {
  CartSession,
  CartItem,
  BillboardAvailability,
} from "../types/billboard";

/**
 * CartService - responsible for cart session creation, adding/removing items,
 * and returning normalized cart sessions for the UI.
 *
 * Key changes:
 * - getUserCart: DOES NOT create a session. It only reads the existing active session for a user.
 * - getOrCreateCartSession: creates a session only when explicitly needed (used by addToCart).
 * - addToCart: returns the refreshed CartSession after inserting the cart item so the UI can update.
 * - Defensive mapping: numeric strings -> numbers for totals.
 */

export class CartService {
 

  static async getOrCreateCartSession(userId: string): Promise<string> {
    if (!supabase) {
      throw new Error("Database service not available");
    }

    // 1. Check for existing active cart
    const { data: existingCart, error: selectError } = await supabase
      .from("cart_sessions")
      .select("id")
      .eq("user_id", userId)
      .eq("is_active", true)
      .maybeSingle();

    if (selectError && selectError.code !== "PGRST116") {
      console.error("getOrCreateCartSession selectError:", selectError);
      throw selectError;
    }

    if (existingCart) {
      return existingCart.id; // ✅ reuse active cart
    }

    // 2. Generate a new session_token
    const sessionToken = `cart_${userId}_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 10)}`;

    // 3. Insert a new cart session
    const { data: newCart, error: insertError } = await supabase
      .from("cart_sessions")
      .insert([
        {
          user_id: userId,
          session_token: sessionToken,
          is_active: true,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
      ])
      .select("id")
      .single();

    if (insertError) {
      console.error("getOrCreateCartSession insertError:", insertError);
      throw insertError;
    }

    return newCart.id;
  }

  // Get cart item count for user (will create a session if none exists)
  static async getCartItemCount(userId: string): Promise<number> {
    if (!supabase) {
      return 0;
    }

    try {
      const sessionId = await this.getOrCreateCartSession(userId);

      const { count, error } = await supabase
        .from("cart_items")
        .select("*", { count: "exact", head: true })
        .eq("cart_session_id", sessionId);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error("Error getting cart count:", error);
      return 0;
    }
  }

  // Get user's cart with items — READ ONLY: does not create a session
  static async getUserCart(userId: string): Promise<CartSession | null> {
    if (!supabase) return null;

    try {
      // Find active session for user (do NOT create one here)
      const { data: sessionRow, error: sessionRowError } = await supabase
        .from("cart_sessions")
        .select(
          `
          id,
          user_id,
          session_token,
          expires_at,
          is_active,
          created_at,
          updated_at,
          cart_items (
            id,
            cart_session_id,
            billboard_id,
            billboard_side_id,
            start_date,
            end_date,
            total_days,
            price_per_day,
            total_amount,
            ad_content,
            ad_type,
            side_booked,
            availability_checked_at,
            is_available,
            created_at,
            updated_at,
            billboards (
              id,
              title,
              location_address,
              billboard_images ( image_url )
            )
          )
        `
        )
        .eq("user_id", userId)
        .eq("is_active", true)
        .gt("expires_at", new Date().toISOString())
        .maybeSingle();

      if (sessionRowError) {
        console.error("getUserCart: sessionRowError", sessionRowError);
        throw sessionRowError;
      }
      if (!sessionRow) {
        // No active session found -> return null
        return null;
      }

      const cartItems: CartItem[] = (sessionRow.cart_items || []).map(
        (item: any) => ({
          id: item.id,
          cart_session_id: item.cart_session_id,
          billboard_id: item.billboard_id,
          billboard_side_id: item.billboard_side_id,
          start_date: item.start_date,
          end_date: item.end_date,
          total_days: Number(item.total_days),
          price_per_day: Number(item.price_per_day),
          total_amount: Number(item.total_amount),
          ad_content: item.ad_content,
          ad_type: item.ad_type,
          side_booked: item.side_booked,
          availability_checked_at: item.availability_checked_at,
          is_available: item.is_available,
          created_at: item.created_at,
          updated_at: item.updated_at,
          billboard_title: item.billboards?.title || "Unknown Billboard",
          billboard_location:
            item.billboards?.location_address || "Unknown Location",
          billboard_image:
            item.billboards?.billboard_images?.[0]?.image_url ||
            "https://images.pexels.com/photos/1666021/pexels-photo-1666021.jpeg?auto=compress&cs=tinysrgb&w=800&h=450&fit=crop",
        })
      );

      const cartSession: CartSession = {
        id: sessionRow.id,
        user_id: sessionRow.user_id,
        session_token: sessionRow.session_token,
        expires_at: sessionRow.expires_at,
        is_active: sessionRow.is_active,
        created_at: sessionRow.created_at,
        updated_at: sessionRow.updated_at,
        items: cartItems,
        total_items: cartItems.length,
        total_amount: cartItems.reduce(
          (sum, item) => sum + Number(item.total_amount || 0),
          0
        ),
      };

      return cartSession;
    } catch (error) {
      console.error("Error getting user cart:", error);
      return null;
    }
  }

  // Add item to cart — returns the refreshed CartSession so callers can update UI reliably
  static async addToCart(
    userId: string,
    billboardId: string,
    side: "A" | "B" | "BOTH" | "SINGLE",
    startDate: string,
    endDate: string,
    adContent: string = "",
    adType: string = "static",
    pricePerDay?: number
  ): Promise<CartSession | null> {
    if (!supabase) {
      throw new Error("Database service not available");
    }

    try {
      // Ensure a cart session exists (this will create only if none exists)
      const sessionId = await this.getOrCreateCartSession(userId);

      // Calculate total days (inclusive difference logic consistent with your earlier code)
      const start = new Date(startDate);
      const end = new Date(endDate);
      const totalDays = Math.ceil(
        (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Determine pricePerDay
      let finalPricePerDay = pricePerDay;
      if (!finalPricePerDay) {
        const { data: billboard, error: billboardError } = await supabase
          .from("billboards")
          .select("price_per_day")
          .eq("id", billboardId)
          .maybeSingle();

        if (billboardError) throw billboardError;
        finalPricePerDay = Number(billboard.price_per_day);
      }

      const totalAmount = Number(finalPricePerDay) * totalDays;

      // Prevent duplicate identical items
      const { data: existingItem } = await supabase
        .from("cart_items")
        .select("id")
        .eq("cart_session_id", sessionId)
        .eq("billboard_id", billboardId)
        .eq("start_date", startDate)
        .eq("end_date", endDate)
        .eq("side_booked", side)
        .maybeSingle();

      if (existingItem) {
        throw new Error(
          "This billboard is already in your cart for the selected dates"
        );
      }

      // Insert cart item
      const { error: insertError } = await supabase.from("cart_items").insert({
        cart_session_id: sessionId,
        billboard_id: billboardId,
        start_date: startDate,
        end_date: endDate,
        total_days: totalDays,
        price_per_day: finalPricePerDay,
        total_amount: totalAmount,
        ad_content: adContent,
        ad_type: adType,
        side_booked: side,
        availability_checked_at: new Date().toISOString(),
        is_available: true,
      });

      if (insertError) {
        console.error("addToCart insertError", insertError);
        throw insertError;
      }

      // Return fresh cart for UI
      const refreshedCart = await this.getUserCart(userId);
      return refreshedCart;
    } catch (error) {
      console.error("Error adding to cart:", error);
      throw error;
    }
  }

  // Remove item from cart
  static async removeFromCart(_userId: string, itemId: string): Promise<void> {
    if (!supabase) {
      throw new Error("Database service not available");
    }

    try {
      const { error } = await supabase
        .from("cart_items")
        .delete()
        .eq("id", itemId);
      if (error) throw error;
    } catch (error) {
      console.error("Error removing from cart:", error);
      throw error;
    }
  }

  // Update cart item
  static async updateCartItem(
    _userId: string,
    itemId: string,
    updates: {
      start_date?: string;
      end_date?: string;
      ad_content?: string;
      ad_type?: string;
    }
  ): Promise<void> {
    if (!supabase) {
      throw new Error("Database service not available");
    }

    try {
      const { error } = await supabase
        .from("cart_items")
        .update(updates)
        .eq("id", itemId);
      if (error) throw error;
    } catch (error) {
      console.error("Error updating cart item:", error);
      throw error;
    }
  }

  // Validate cart for checkout (unchanged logic)
  static async validateCartForCheckout(userId: string): Promise<{
    valid: boolean;
    invalidItems: Array<{ itemId: string; reason: string }>;
  }> {
    if (!supabase) return { valid: false, invalidItems: [] };

    try {
      const cart = await this.getUserCart(userId);
      if (!cart || cart.items.length === 0)
        return { valid: false, invalidItems: [] };

      const invalidItems: Array<{ itemId: string; reason: string }> = [];
      for (const item of cart.items) {
        const availability = await this.getBillboardDetailedAvailability(
          item.billboard_id,
          item.start_date,
          item.end_date
        );
        const sideAvailable = availability.availability_details.find(
          (d: any) => d.side === item.side_booked
        )?.available;
        if (!sideAvailable)
          invalidItems.push({
            itemId: item.id,
            reason: "No longer available for selected dates",
          });
      }

      return { valid: invalidItems.length === 0, invalidItems };
    } catch (error) {
      console.error("Error validating cart:", error);
      return { valid: false, invalidItems: [] };
    }
  }

  // Process cart checkout (unchanged logic)
  static async processCartCheckout(
    userId: string
  ): Promise<{ success: boolean; bookingIds?: string[]; errors?: string[] }> {
    if (!supabase) throw new Error("Database service not available");

    try {
      const cart = await this.getUserCart(userId);
      if (!cart || cart.items.length === 0)
        return { success: false, errors: ["Cart is empty"] };

      const validation = await this.validateCartForCheckout(userId);
      if (!validation.valid)
        return {
          success: false,
          errors: validation.invalidItems.map(
            (i) => `Item ${i.itemId}: ${i.reason}`
          ),
        };

      const bookingIds: string[] = [];
      const errors: string[] = [];

      for (const item of cart.items) {
        try {
          const { data: booking, error: bookingError } = await supabase
            .from("bookings")
            .insert({
              billboard_id: item.billboard_id,
              user_id: userId,
              start_date: item.start_date,
              end_date: item.end_date,
              total_days: item.total_days,
              price_per_day: item.price_per_day,
              total_amount: item.total_amount,
              gst_amount: item.total_amount * 0.18,
              final_amount: item.total_amount * 1.18,
              ad_content: item.ad_content,
              ad_type: item.ad_type,
              status: "pending",
              payment_status: "pending",
              side_booked: item.side_booked,
              cart_session_id: cart.id,
            })
            .select("id")
            .single();

          if (bookingError) throw bookingError;
          bookingIds.push(booking.id);
        } catch (error) {
          console.error("Error creating booking for item:", item.id, error);
          errors.push(`Failed to create booking for ${item.billboard_title}`);
        }
      }

      if (bookingIds.length > 0) {
        await supabase
          .from("cart_sessions")
          .update({ is_active: false })
          .eq("id", cart.id);
      }

      return {
        success: bookingIds.length > 0,
        bookingIds,
        errors: errors.length ? errors : undefined,
      };
    } catch (error) {
      console.error("Error processing checkout:", error);
      return { success: false, errors: ["Checkout processing failed"] };
    }
  }

  // Availability (unchanged)
  static async getBillboardDetailedAvailability(
    billboardId: string,
    startDate: string,
    endDate: string
  ): Promise<BillboardAvailability> {
    if (!supabase)
      return {
        billboard_id: billboardId,
        available: true,
        side_a_available: false,
        side_b_available: false,
        single_side_available: true,
        availability_details: [{ side: "SINGLE", available: true }],
      };

    try {
      const { data: existingBookings, error } = await supabase
        .from("bookings")
        .select("side_booked, start_date, end_date")
        .eq("billboard_id", billboardId)
        .in("status", ["pending", "approved", "active"])
        .or(`and(start_date.lte.${endDate},end_date.gte.${startDate})`);

      if (error) throw error;

      const { data: sides, error: sidesError } = await supabase
        .from("billboard_sides")
        .select("side_identifier")
        .eq("billboard_id", billboardId);

      if (sidesError) throw sidesError;

      const availableSides = sides || [{ side_identifier: "SINGLE" }];
      const bookedSides = new Set(
        existingBookings?.map((b: any) => b.side_booked) || []
      );

      const availabilityDetails = availableSides.map((side: any) => ({
        side: side.side_identifier as "A" | "B" | "SINGLE",
        available: !bookedSides.has(side.side_identifier),
      }));

      return {
        billboard_id: billboardId,
        available: availabilityDetails.some((d: any) => d.available),
        side_a_available:
          availabilityDetails.find((d: any) => d.side === "A")?.available ||
          false,
        side_b_available:
          availabilityDetails.find((d: any) => d.side === "B")?.available ||
          false,
        single_side_available:
          availabilityDetails.find((d: any) => d.side === "SINGLE")
            ?.available || false,
        availability_details: availabilityDetails,
      };
    } catch (error) {
      console.error("Error checking availability:", error);
      return {
        billboard_id: billboardId,
        available: true,
        side_a_available: false,
        side_b_available: false,
        single_side_available: true,
        availability_details: [{ side: "SINGLE", available: true }],
      };
    }
  }

  // Get user cart session ID (helper)
  static async getUserCartSessionId(userId: string): Promise<string | null> {
    if (!supabase) return null;

    try {
      const { data: session } = await supabase
        .from("cart_sessions")
        .select("id")
        .eq("user_id", userId)
        .eq("is_active", true)
        .gt("expires_at", new Date().toISOString())
        .maybeSingle();

      return session?.id || null;
    } catch (error) {
      console.error("Error getting cart session ID:", error);
      return null;
    }
  }
}
