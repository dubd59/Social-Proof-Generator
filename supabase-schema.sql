-- Supabase SQL Schema for Social Proof Generator

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create testimonials table
CREATE TABLE public.testimonials (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    testimonial_text TEXT NOT NULL CHECK (length(testimonial_text) <= 1000),
    author_name VARCHAR(255) NOT NULL,
    author_title VARCHAR(255),
    author_image_url TEXT,
    author_email VARCHAR(255),
    is_approved BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    source VARCHAR(100) DEFAULT 'website'
);

-- Create admin users table (optional - for admin access)
CREATE TABLE public.admin_users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE public.notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    testimonial_id UUID REFERENCES public.testimonials(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL DEFAULT 'new_testimonial',
    message TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create email_queue table for email notifications
CREATE TABLE public.email_queue (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    to_email VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sent_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX idx_testimonials_created_at ON public.testimonials(created_at DESC);
CREATE INDEX idx_testimonials_approved ON public.testimonials(is_approved);
CREATE INDEX idx_testimonials_featured ON public.testimonials(is_featured);
CREATE INDEX idx_notifications_read ON public.notifications(is_read);
CREATE INDEX idx_email_queue_status ON public.email_queue(status);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for testimonials
CREATE TRIGGER update_testimonials_updated_at 
    BEFORE UPDATE ON public.testimonials 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;

-- Policy for public read access to approved testimonials
CREATE POLICY "Public can read approved testimonials" ON public.testimonials
    FOR SELECT USING (is_approved = true);

-- Policy for public insert (customer submissions)
CREATE POLICY "Anyone can submit testimonials" ON public.testimonials
    FOR INSERT WITH CHECK (true);

-- Policy for admin access (you'll need to set up authentication)
CREATE POLICY "Admin can do everything" ON public.testimonials
    FOR ALL USING (auth.role() = 'authenticated');

-- Create a function to automatically create notification when testimonial is inserted
CREATE OR REPLACE FUNCTION create_testimonial_notification()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert notification
    INSERT INTO public.notifications (testimonial_id, type, message)
    VALUES (
        NEW.id,
        'new_testimonial',
        'New testimonial submitted by ' || NEW.author_name
    );
    
    -- Queue email notification
    INSERT INTO public.email_queue (to_email, subject, body)
    VALUES (
        'your-email@example.com', -- Replace with your email
        'New Testimonial Submitted',
        'A new testimonial has been submitted by ' || NEW.author_name || E'\n\n' ||
        'Rating: ' || NEW.rating || ' stars' || E'\n' ||
        'Message: ' || NEW.testimonial_text || E'\n' ||
        'Author: ' || NEW.author_name || 
        CASE 
            WHEN NEW.author_title IS NOT NULL THEN E'\n' || 'Title: ' || NEW.author_title
            ELSE ''
        END || E'\n\n' ||
        'View and manage: https://your-app.netlify.app/admin'
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new testimonial notifications
CREATE TRIGGER testimonial_notification_trigger
    AFTER INSERT ON public.testimonials
    FOR EACH ROW
    EXECUTE FUNCTION create_testimonial_notification();

-- Sample data (optional)
INSERT INTO public.testimonials (rating, testimonial_text, author_name, author_title, is_approved, is_featured) VALUES
(5, 'This social proof generator has transformed how we showcase customer feedback. The templates are beautiful and the export options make it so easy to use testimonials across all our marketing channels.', 'Sarah Johnson', 'Marketing Director, TechStartup Inc.', true, true),
(5, 'I love how professional and clean the testimonials look. The drag-and-drop interface makes it incredibly easy to create stunning testimonial displays in minutes.', 'Mike Chen', 'Founder, GrowthCorp', true, true),
(5, 'As a freelance designer, this tool saves me hours of work. The export quality is fantastic and my clients are always impressed with the final results.', 'Alex Morgan', 'Freelance Designer', true, false);
