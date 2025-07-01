const { createClient } = require('@supabase/supabase-js');
const nodemailer = require('nodemailer');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Email configuration
const emailConfig = {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
};

exports.handler = async (event, context) => {
    // Enable CORS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    // Handle preflight request
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { 
            rating, 
            testimonial_text, 
            author_name, 
            author_title, 
            author_email,
            author_image_url,
            recaptcha_token
        } = JSON.parse(event.body);

        // Basic validation
        if (!rating || !testimonial_text || !author_name) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ 
                    error: 'Missing required fields: rating, testimonial_text, author_name' 
                })
            };
        }

        // Validate rating
        if (rating < 1 || rating > 5) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Rating must be between 1 and 5' })
            };
        }

        // Rate limiting check (optional)
        const clientIP = event.headers['x-forwarded-for'] || event.headers['x-real-ip'] || 'unknown';
        
        // Check recent submissions from this IP
        const { data: recentSubmissions } = await supabase
            .from('testimonials')
            .select('created_at')
            .eq('ip_address', clientIP)
            .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

        if (recentSubmissions && recentSubmissions.length >= 5) {
            return {
                statusCode: 429,
                headers,
                body: JSON.stringify({ 
                    error: 'Too many submissions. Please try again later.' 
                })
            };
        }

        // Get the default organization (DubD Products Admin)
        const { data: organizations } = await supabase
            .from('organizations')
            .select('id')
            .eq('slug', 'dubd-admin')
            .single();

        if (!organizations) {
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: 'Organization not found' })
            };
        }

        // Insert testimonial into database
        const testimonialData = {
            organization_id: organizations.id,
            customer_name: author_name.trim(),
            customer_email: author_email?.trim() || '',
            customer_company: author_title?.trim() || '',
            customer_title: author_title?.trim() || '',
            customer_avatar_url: author_image_url || null,
            rating,
            content: testimonial_text.trim(),
            status: 'pending', // Require manual approval
            source_ip: clientIP,
            user_agent: event.headers['user-agent'] || null
        };

        const { data, error } = await supabase
            .from('testimonials')
            .insert([testimonialData])
            .select()
            .single();

        if (error) {
            console.error('Database error:', error);
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: 'Failed to save testimonial' })
            };
        }

        // Send email notification
        try {
            await sendNotificationEmail(testimonialData, data.id);
        } catch (emailError) {
            console.error('Email notification failed:', emailError);
            // Don't fail the request if email fails
        }

        return {
            statusCode: 201,
            headers,
            body: JSON.stringify({ 
                success: true, 
                message: 'Testimonial submitted successfully!',
                id: data.id
            })
        };

    } catch (error) {
        console.error('Function error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};

async function sendNotificationEmail(testimonialData, testimonialId) {
    if (!process.env.SMTP_HOST || !process.env.ADMIN_EMAIL) {
        console.log('Email not configured, skipping notification');
        return;
    }

    const transporter = nodemailer.createTransporter(emailConfig);

    const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #38beba, #2a9a96); color: white; padding: 30px; text-align: center;">
                <h1 style="margin: 0; font-size: 24px;">New Testimonial Submitted!</h1>
            </div>
            
            <div style="padding: 30px; background: #f8f9fa;">
                <div style="background: white; padding: 25px; border-radius: 8px; border-left: 4px solid #38beba;">
                    <h2 style="color: #2d3748; margin-top: 0;">Customer Feedback</h2>
                    
                    <div style="margin: 20px 0;">
                        <strong>Rating:</strong> 
                        <span style="color: #ffc107; font-size: 18px;">
                            ${'★'.repeat(testimonialData.rating)}${'☆'.repeat(5 - testimonialData.rating)}
                        </span>
                        (${testimonialData.rating}/5)
                    </div>
                    
                    <div style="margin: 20px 0;">
                        <strong>Testimonial:</strong>
                        <p style="background: #f7fafc; padding: 15px; border-radius: 5px; font-style: italic; border-left: 3px solid #38beba;">
                            "${testimonialData.content}"
                        </p>
                    </div>
                    
                    <div style="margin: 20px 0;">
                        <strong>Customer:</strong> ${testimonialData.customer_name}
                        ${testimonialData.customer_title ? `<br><strong>Position:</strong> ${testimonialData.customer_title}` : ''}
                        ${testimonialData.customer_email ? `<br><strong>Email:</strong> ${testimonialData.customer_email}` : ''}
                    </div>
                    
                    <div style="margin: 20px 0; padding: 15px; background: #e6fffa; border-radius: 5px;">
                        <small style="color: #2d3748;">
                            <strong>Submission Details:</strong><br>
                            ID: ${testimonialId}<br>
                            Date: ${new Date().toLocaleString()}<br>
                            Source: Website Submission
                        </small>
                    </div>
                    
                    <div style="text-align: center; margin-top: 30px;">
                        <a href="${process.env.SITE_URL}/admin" 
                           style="background: #38beba; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                            Review in Admin Panel
                        </a>
                    </div>
                </div>
            </div>
            
            <div style="padding: 20px; text-align: center; color: #718096; font-size: 14px;">
                <p>This notification was sent automatically from your Social Proof Generator.</p>
            </div>
        </div>
    `;

    const mailOptions = {
        from: process.env.FROM_EMAIL || process.env.SMTP_USER,
        to: process.env.ADMIN_EMAIL,
        subject: `⭐ New ${testimonialData.rating}-Star Testimonial from ${testimonialData.customer_name}`,
        html: emailHtml
    };

    await transporter.sendMail(mailOptions);
}
