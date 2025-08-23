import React, { createContext, useState, useContext, ReactNode } from 'react';

interface Booking {
  id: string;
  billboardId: string;
  billboardTitle: string;
  location: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  status: 'pending' | 'approved' | 'rejected' | 'active' | 'completed';
  adType: string;
  imageUrl: string;
  createdAt: string;
}

interface BookingContextType {
  bookings: Booking[];
  addBooking: (booking: Omit<Booking, 'id' | 'createdAt'>) => void;
  updateBookingStatus: (id: string, status: Booking['status']) => void;
  getBookingById: (id: string) => Booking | undefined;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

interface BookingProviderProps {
  children: ReactNode;
}

export const BookingProvider: React.FC<BookingProviderProps> = ({ children }) => {
  // Production bookings - loaded from database
  const [bookings, setBookings] = useState<Booking[]>([]);

  const addBooking = (booking: Omit<Booking, 'id' | 'createdAt'>) => {
    const newBooking: Booking = {
      ...booking,
      id: `booking${bookings.length + 1}`,
      createdAt: new Date().toISOString(),
    };
    
    setBookings([...bookings, newBooking]);
  };

  const updateBookingStatus = (id: string, status: Booking['status']) => {
    setBookings(
      bookings.map(booking => 
        booking.id === id ? { ...booking, status } : booking
      )
    );
  };

  const getBookingById = (id: string) => {
    return bookings.find(booking => booking.id === id);
  };

  const value = {
    bookings,
    addBooking,
    updateBookingStatus,
    getBookingById,
  };

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
};

const useBookingContext = (): BookingContextType => {
  const context = useContext(BookingContext);
  if (context === undefined) {
    throw new Error('useBookingContext must be used within a BookingProvider');
  }
  return context;
};