const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async (event, context) => {
    // Enable CORS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
    };

    // Handle preflight request
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    try {
        const { httpMethod, path, queryStringParameters } = event;
        const pathParts = path.split('/').filter(part => part !== '');
        
        // Remove 'api' and 'testimonials' from path parts
        const actionParts = pathParts.slice(2);
        
        switch (httpMethod) {
            case 'GET':
                return await handleGet(queryStringParameters, actionParts, headers);
            case 'POST':
                return await handlePost(JSON.parse(event.body || '{}'), headers);
            case 'PUT':
                return await handlePut(actionParts, JSON.parse(event.body || '{}'), headers);
            case 'DELETE':
                return await handleDelete(actionParts, headers);
            default:
                return {
                    statusCode: 405,
                    headers,
                    body: JSON.stringify({ error: 'Method not allowed' })
                };
        }
    } catch (error) {
        console.error('API Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};

async function handleGet(queryParams, actionParts, headers) {
    try {
        // If specific ID requested
        if (actionParts.length > 0) {
            const id = actionParts[0];
            const { data, error } = await supabase
                .from('testimonials')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(data)
            };
        }

        // Build query
        let query = supabase.from('testimonials').select('*');

        // Apply filters
        if (queryParams) {
            if (queryParams.approved === 'true') {
                query = query.eq('is_approved', true);
            }
            if (queryParams.featured === 'true') {
                query = query.eq('is_featured', true);
            }
            if (queryParams.rating) {
                query = query.eq('rating', parseInt(queryParams.rating));
            }
            if (queryParams.limit) {
                query = query.limit(parseInt(queryParams.limit));
            }
        }

        // Default ordering
        query = query.order('created_at', { ascending: false });

        const { data, error } = await query;

        if (error) throw error;

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                testimonials: data,
                count: data.length
            })
        };
    } catch (error) {
        console.error('Get error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Failed to fetch testimonials' })
        };
    }
}

async function handlePost(body, headers) {
    try {
        const { rating, testimonial_text, author_name, author_title, author_email, author_image_url } = body;

        // Validation
        if (!rating || !testimonial_text || !author_name) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Missing required fields' })
            };
        }

        const testimonialData = {
            rating: parseInt(rating),
            testimonial_text: testimonial_text.trim(),
            author_name: author_name.trim(),
            author_title: author_title?.trim() || null,
            author_email: author_email?.trim() || null,
            author_image_url: author_image_url || null,
            source: 'admin_created',
            is_approved: true // Admin created testimonials are auto-approved
        };

        const { data, error } = await supabase
            .from('testimonials')
            .insert([testimonialData])
            .select()
            .single();

        if (error) throw error;

        return {
            statusCode: 201,
            headers,
            body: JSON.stringify(data)
        };
    } catch (error) {
        console.error('Post error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Failed to create testimonial' })
        };
    }
}

async function handlePut(actionParts, body, headers) {
    try {
        if (actionParts.length === 0) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Testimonial ID required' })
            };
        }

        const id = actionParts[0];
        const updates = {};

        // Only allow certain fields to be updated
        const allowedFields = [
            'rating', 'testimonial_text', 'author_name', 'author_title', 
            'author_email', 'author_image_url', 'is_approved', 'is_featured'
        ];

        allowedFields.forEach(field => {
            if (body[field] !== undefined) {
                updates[field] = body[field];
            }
        });

        if (Object.keys(updates).length === 0) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'No valid fields to update' })
            };
        }

        const { data, error } = await supabase
            .from('testimonials')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(data)
        };
    } catch (error) {
        console.error('Put error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Failed to update testimonial' })
        };
    }
}

async function handleDelete(actionParts, headers) {
    try {
        if (actionParts.length === 0) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Testimonial ID required' })
            };
        }

        const id = actionParts[0];

        const { error } = await supabase
            .from('testimonials')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ message: 'Testimonial deleted successfully' })
        };
    } catch (error) {
        console.error('Delete error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Failed to delete testimonial' })
        };
    }
}
