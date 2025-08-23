export interface Billboard {
  id: string;
  title: string;
  location: string;
  imageUrl: string;
  additionalImages?: string[];
  pricePerDay: number;
  impressions: number;
  minDays: number;
  type: string;
  size: string;
  dimensions: string;
  facing: string;
  features: string[];
  description: string;
  additionalInfo: string;
  owner: string;
  featured: boolean;
  // New two-sided billboard properties
  isTwoSided: boolean;
  sideADescription?: string;
  sideBDescription?: string;
  sides?: BillboardSide[];
}

export interface BillboardSide {
  id: string;
  billboard_id: string;
  side_identifier: 'A' | 'B' | 'SINGLE';
  side_name: string;
  description?: string;
  features?: string;
  price_per_day: number;
  is_available: boolean;
  availability_status?: 'available' | 'partially_booked' | 'fully_booked';
  next_available_date?: string;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  id: string;
  cart_session_id: string;
  billboard_id: string;
  billboard_side_id?: string;
  billboard_title: string;
  billboard_location: string;
  billboard_image: string;
  start_date: string;
  end_date: string;
  total_days: number;
  price_per_day: number;
  total_amount: number;
  ad_content?: string;
  ad_type: string;
  side_booked: 'A' | 'B' | 'BOTH' | 'SINGLE';
  availability_checked_at: string;
  is_available: boolean;
  conflict_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface CartSession {
  id: string;
  user_id: string;
  session_token: string;
  expires_at: string;
  is_active: boolean;
  total_items: number;
  total_amount: number;
  created_at: string;
  updated_at: string;
  items: CartItem[];
}

interface AvailabilityCheck {
  side_a_available: boolean;
  side_b_available: boolean;
  single_side_available: boolean;
  availability_details: {
    side: 'A' | 'B' | 'SINGLE';
    available: boolean;
    next_available_date?: string;
    conflicting_bookings?: {
      start_date: string;
      end_date: string;
      user_name: string;
    }[];
  }[];
}

export interface BillboardAvailability {
  billboard_id: string;
  available: boolean;
  side_a_available: boolean;
  side_b_available: boolean;
  single_side_available: boolean;
  availability_details: {
    side: 'A' | 'B' | 'SINGLE';
    available: boolean;
    next_available_date?: string;
    conflicting_bookings?: {
      start_date: string;
      end_date: string;
      user_name: string;
    }[];
  }[];
}

interface BookingConflict {
  billboard_id: string;
  side: string;
  conflicting_dates: {
    start_date: string;
    end_date: string;
  }[];
  suggested_alternatives: {
    start_date: string;
    end_date: string;
  }[];
}