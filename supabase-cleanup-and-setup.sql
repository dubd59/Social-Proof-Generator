-- Cleanup and Fresh Setup Script for Social Proof Generator
-- This script safely removes existing structures and creates the complete multi-tenant schema

-- Drop existing tables if they exist (in correct order to handle foreign keys)
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS exports CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS testimonials CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;
DROP TABLE IF EXISTS templates CASCADE;

-- Drop existing views
DROP VIEW IF EXISTS testimonials_with_stats CASCADE;
DROP VIEW IF EXISTS organization_stats CASCADE;

-- Drop existing functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS notify_new_testimonial() CASCADE;
DROP FUNCTION IF EXISTS log_activity(UUID, UUID, VARCHAR, VARCHAR, UUID, JSONB) CASCADE;

-- Drop existing types
DROP TYPE IF EXISTS subscription_status CASCADE;
DROP TYPE IF EXISTS testimonial_status CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

-- Now create everything fresh
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE subscription_status AS ENUM ('trial', 'active', 'canceled', 'past_due', 'incomplete');
CREATE TYPE testimonial_status AS ENUM ('pending', 'approved', 'rejected', 'archived');
CREATE TYPE user_role AS ENUM ('admin', 'owner', 'member', 'customer');

-- Organizations table (tenancy structure)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    domain VARCHAR(255),
    logo_url TEXT,
    settings JSONB DEFAULT '{}',
    
    -- Subscription fields (Stripe-ready)
    subscription_status subscription_status DEFAULT 'trial',
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    subscription_ends_at TIMESTAMP WITH TIME ZONE,
    trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    
    -- Limits
    testimonial_limit INTEGER DEFAULT 10, -- Trial limit
    user_limit INTEGER DEFAULT 1,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table (with role-based access)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    avatar_url TEXT,
    role user_role DEFAULT 'member',
    
    -- Organization relationship
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Authentication (if needed beyond Supabase Auth)
    email_verified BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Testimonials table (main data)
CREATE TABLE testimonials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Customer information
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255),
    customer_company VARCHAR(255),
    customer_title VARCHAR(255),
    customer_avatar_url TEXT,
    
    -- Testimonial content
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    content TEXT NOT NULL,
    
    -- Metadata
    status testimonial_status DEFAULT 'pending',
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    
    -- Source tracking
    source_url TEXT,
    source_ip INET,
    user_agent TEXT,
    
    -- Display settings
    featured BOOLEAN DEFAULT FALSE,
    template_id VARCHAR(50) DEFAULT 'modern',
    custom_styles JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Exports table (track what's been exported)
CREATE TABLE exports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    
    export_type VARCHAR(50) NOT NULL, -- 'html', 'png', 'jpg', 'pdf'
    testimonial_ids UUID[] NOT NULL,
    file_url TEXT,
    download_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Templates table (for different testimonial designs)
CREATE TABLE templates (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    css_styles JSONB NOT NULL,
    is_premium BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    
    type VARCHAR(50) NOT NULL, -- 'new_testimonial', 'export_ready', 'subscription_update'
    title VARCHAR(255) NOT NULL,
    message TEXT,
    data JSONB DEFAULT '{}',
    read BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activity log table (audit trail)
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    details JSONB DEFAULT '{}',
    ip_address INET,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_testimonials_org_status ON testimonials(organization_id, status);
CREATE INDEX idx_testimonials_created ON testimonials(created_at DESC);
CREATE INDEX idx_testimonials_rating ON testimonials(rating);
CREATE INDEX idx_users_organization ON users(organization_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_exports_organization ON exports(organization_id);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, read);
CREATE INDEX idx_activity_logs_org_created ON activity_logs(organization_id, created_at DESC);

-- Row Level Security (RLS) Policies
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Organization policies
CREATE POLICY "Users can view their own organization" ON organizations
    FOR SELECT USING (id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
    ));

CREATE POLICY "Organization owners can update their org" ON organizations
    FOR UPDATE USING (id IN (
        SELECT organization_id FROM users 
        WHERE id = auth.uid() AND role IN ('admin', 'owner')
    ));

-- User policies
CREATE POLICY "Users can view users in their organization" ON users
    FOR SELECT USING (organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
    ));

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (id = auth.uid());

-- Testimonial policies
CREATE POLICY "Users can view testimonials in their organization" ON testimonials
    FOR SELECT USING (organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
    ));

CREATE POLICY "Organization members can insert testimonials" ON testimonials
    FOR INSERT WITH CHECK (organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
    ));

CREATE POLICY "Organization admins can update testimonials" ON testimonials
    FOR UPDATE USING (organization_id IN (
        SELECT organization_id FROM users 
        WHERE id = auth.uid() AND role IN ('admin', 'owner')
    ));

-- Public submission policy (for customer submissions)
CREATE POLICY "Anyone can submit testimonials" ON testimonials
    FOR INSERT WITH CHECK (true);

-- Export policies
CREATE POLICY "Users can view exports in their organization" ON exports
    FOR SELECT USING (organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
    ));

CREATE POLICY "Users can create exports in their organization" ON exports
    FOR INSERT WITH CHECK (organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
    ));

-- Functions and triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_testimonials_updated_at BEFORE UPDATE ON testimonials
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Function to create notification on new testimonial
CREATE OR REPLACE FUNCTION notify_new_testimonial()
RETURNS TRIGGER AS $$
BEGIN
    -- Create notification for organization admins
    INSERT INTO notifications (organization_id, title, message, type, data)
    VALUES (
        NEW.organization_id,
        'New Testimonial Submitted',
        'A new testimonial from ' || NEW.customer_name || ' is awaiting approval.',
        'new_testimonial',
        jsonb_build_object('testimonial_id', NEW.id, 'customer_name', NEW.customer_name)
    );
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_notify_new_testimonial
    AFTER INSERT ON testimonials
    FOR EACH ROW EXECUTE PROCEDURE notify_new_testimonial();

-- Function to log activities
CREATE OR REPLACE FUNCTION log_activity(
    p_organization_id UUID,
    p_user_id UUID,
    p_action VARCHAR(100),
    p_resource_type VARCHAR(50) DEFAULT NULL,
    p_resource_id UUID DEFAULT NULL,
    p_details JSONB DEFAULT '{}'
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO activity_logs (organization_id, user_id, action, resource_type, resource_id, details)
    VALUES (p_organization_id, p_user_id, p_action, p_resource_type, p_resource_id, p_details);
END;
$$ language 'plpgsql';

-- Insert default templates
INSERT INTO templates (id, name, description, css_styles, is_premium) VALUES
('modern', 'Modern Card', 'Clean, professional design with subtle shadows', '{
    "backgroundColor": "#ffffff",
    "borderRadius": "12px",
    "padding": "24px",
    "boxShadow": "0 4px 6px rgba(0, 0, 0, 0.1)",
    "fontFamily": "Inter, sans-serif"
}', false),

('minimal', 'Minimal', 'Simple, text-focused layout', '{
    "backgroundColor": "#ffffff",
    "borderRadius": "8px",
    "padding": "20px",
    "border": "1px solid #e5e7eb",
    "fontFamily": "Inter, sans-serif"
}', false),

('gradient', 'Gradient Card', 'Eye-catching with gradient backgrounds', '{
    "background": "linear-gradient(135deg, #38beba 0%, #2a9a96 100%)",
    "borderRadius": "16px",
    "padding": "24px",
    "color": "#ffffff",
    "fontFamily": "Inter, sans-serif"
}', true),

('social', 'Social Media', 'Optimized for social media posts', '{
    "backgroundColor": "#ffffff",
    "borderRadius": "12px",
    "padding": "20px",
    "border": "2px solid #38beba",
    "fontFamily": "Inter, sans-serif",
    "aspectRatio": "1:1"
}', false);

-- Create the admin organization and user
DO $$
DECLARE
    admin_org_id UUID;
    admin_user_id UUID;
BEGIN
    -- Create admin organization
    INSERT INTO organizations (
        name, 
        slug, 
        subscription_status, 
        testimonial_limit, 
        user_limit,
        trial_ends_at,
        settings
    ) VALUES (
        'DubD Products Admin',
        'dubd-admin',
        'active', -- Set as active, not trial
        1000, -- High limit for admin
        10, -- Multiple users allowed
        NOW() + INTERVAL '1 year', -- Long trial
        '{"isAdmin": true, "features": ["unlimited_testimonials", "premium_templates", "api_access"]}'
    ) RETURNING id INTO admin_org_id;

    -- Create admin user
    INSERT INTO users (
        email,
        full_name,
        role,
        organization_id,
        email_verified
    ) VALUES (
        'dubdproducts@gmail.com',
        'DubD Products Admin',
        'admin',
        admin_org_id,
        true
    ) RETURNING id INTO admin_user_id;

    -- Log the admin creation
    PERFORM log_activity(
        admin_org_id,
        admin_user_id,
        'admin_account_created',
        'user',
        admin_user_id,
        '{"isInitialSetup": true}'
    );

    -- Create welcome notification
    INSERT INTO notifications (organization_id, user_id, title, message, type, data)
    VALUES (
        admin_org_id,
        admin_user_id,
        'Welcome to Social Proof Generator!',
        'Your admin account has been set up successfully. You can now start collecting and managing testimonials.',
        'system_notification',
        '{"isWelcome": true}'
    );

END $$;

-- Create a view for easy testimonial management
CREATE VIEW testimonials_with_stats AS
SELECT 
    t.*,
    o.name as organization_name,
    u.full_name as approved_by_name,
    CASE 
        WHEN t.created_at > NOW() - INTERVAL '24 hours' THEN 'new'
        WHEN t.created_at > NOW() - INTERVAL '7 days' THEN 'recent'
        ELSE 'older'
    END as age_category
FROM testimonials t
LEFT JOIN organizations o ON t.organization_id = o.id
LEFT JOIN users u ON t.approved_by = u.id;

-- Create a view for organization dashboard stats
CREATE VIEW organization_stats AS
SELECT 
    o.id as organization_id,
    o.name as organization_name,
    COUNT(t.id) as total_testimonials,
    COUNT(CASE WHEN t.status = 'pending' THEN 1 END) as pending_testimonials,
    COUNT(CASE WHEN t.status = 'approved' THEN 1 END) as approved_testimonials,
    ROUND(AVG(CASE WHEN t.status = 'approved' THEN t.rating END), 1) as average_rating,
    COUNT(CASE WHEN t.created_at > NOW() - INTERVAL '7 days' THEN 1 END) as testimonials_this_week,
    COUNT(CASE WHEN t.created_at > NOW() - INTERVAL '30 days' THEN 1 END) as testimonials_this_month
FROM organizations o
LEFT JOIN testimonials t ON o.id = t.organization_id
GROUP BY o.id, o.name;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Final confirmation
SELECT 
    'Database Setup Complete!' as status,
    o.name as organization,
    u.email as admin_email,
    u.role as role,
    o.subscription_status as subscription
FROM organizations o
JOIN users u ON o.id = u.organization_id
WHERE u.email = 'dubdproducts@gmail.com';
