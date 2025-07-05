// Supabase Configuration
// Replace these with your actual Supabase project credentials

const SUPABASE_CONFIG = {
    url: process.env.SUPABASE_URL || 'https://your-project-id.supabase.co', // Replace with your Supabase URL
    anonKey: process.env.SUPABASE_ANON_KEY || 'your-anon-key-here', // Replace with your Supabase anon key
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key-here' // Replace with your service role key (for admin functions)
};

// Email notification settings
const EMAIL_CONFIG = {
    adminEmail: process.env.ADMIN_EMAIL || 'your-email@example.com', // Replace with your email
    fromEmail: process.env.FROM_EMAIL || 'noreply@your-domain.com', // Replace with your from email
    emailService: 'emailjs', // or 'netlify' for Netlify Functions with SendGrid/Mailgun
    emailjsConfig: {
        serviceId: process.env.EMAILJS_SERVICE_ID || 'your-emailjs-service-id',
        templateId: process.env.EMAILJS_TEMPLATE_ID || 'your-emailjs-template-id',
        publicKey: process.env.EMAILJS_PUBLIC_KEY || 'your-emailjs-public-key'
    }
};

// App configuration
const APP_CONFIG = {
    appName: 'Social Proof Generator',
    adminUrl: '/admin',
    submitUrl: '/submit',
    maxTestimonialLength: 1000,
    allowedImageFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    maxImageSize: 5 * 1024 * 1024, // 5MB
    autoApprove: false, // Set to true to auto-approve submissions
    emailNotifications: true,
    rateLimiting: {
        maxSubmissionsPerIP: 5,
        timeWindowHours: 24
    }
};

// Export for ES modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SUPABASE_CONFIG, EMAIL_CONFIG, APP_CONFIG };
}

// Export for browser
if (typeof window !== 'undefined') {
    window.SUPABASE_CONFIG = SUPABASE_CONFIG;
    window.EMAIL_CONFIG = EMAIL_CONFIG;
    window.APP_CONFIG = APP_CONFIG;
}
