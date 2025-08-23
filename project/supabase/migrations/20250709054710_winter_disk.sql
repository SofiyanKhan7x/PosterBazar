/*
  # Create testimonials table
  
  1. New Tables
    - `testimonials` - Stores client testimonials for the homepage
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `role` (text)
      - `quote` (text, not null)
      - `avatar` (text)
      - `is_active` (boolean, default true)
      - `created_at` (timestamp with time zone)
      - `updated_at` (timestamp with time zone)
  
  2. Sample Data
    - Adds 5 initial testimonials with sample data
*/

-- Create testimonials table
CREATE TABLE IF NOT EXISTS public.testimonials (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    role text,
    quote text NOT NULL,
    avatar text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_testimonials_is_active ON public.testimonials(is_active);
CREATE INDEX IF NOT EXISTS idx_testimonials_created_at ON public.testimonials(created_at);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_testimonials_updated_at
    BEFORE UPDATE ON public.testimonials
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample testimonials
INSERT INTO public.testimonials (name, role, quote, avatar, is_active) VALUES
('Rajesh Gupta', 'Marketing Director, TechCorp India', 'POSTERBAZAR made our outdoor advertising campaign incredibly easy to manage. The platform is intuitive and the billboard quality exceeded our expectations.', 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', true),
('Priya Sharma', 'Brand Manager, Fashion Forward', 'The variety of billboard locations and the transparent pricing helped us reach our target audience effectively. Highly recommend POSTERBAZAR!', 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', true),
('Amit Patel', 'CEO, StartupXYZ', 'As a startup, budget was crucial for us. POSTERBAZAR offered competitive rates and excellent service. Our brand visibility increased significantly.', 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', true),
('Sneha Reddy', 'Digital Marketing Head, RetailMax', 'The real-time analytics and reporting features helped us track our campaign performance effectively. Great ROI on our investment!', 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', true),
('Vikram Singh', 'Brand Director, FoodChain Plus', 'POSTERBAZAR''s customer support team was exceptional. They helped us choose the perfect locations for maximum brand visibility.', 'https://images.pexels.com/photos/697509/pexels-photo-697509.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', true)
ON CONFLICT (id) DO NOTHING;