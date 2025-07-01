-- Fix customer_email to allow NULL values
ALTER TABLE testimonials ALTER COLUMN customer_email DROP NOT NULL;
