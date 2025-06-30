# Social Proof Generator - Deployment Guide

## 🚀 Complete Setup: Netlify Frontend + Supabase Backend

This guide will help you deploy your Social Proof Generator with full backend functionality including customer submissions and email notifications.

---

## 📋 Prerequisites

- [Netlify Account](https://netlify.com) (free)
- [Supabase Account](https://supabase.com) (free)
- [EmailJS Account](https://www.emailjs.com/) (optional, for email notifications)
- Git repository (GitHub/GitLab)

---

## 🗄️ Part 1: Supabase Database Setup

### 1. Create Supabase Project
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click "New Project"
3. Choose organization and enter:
   - **Name**: Social Proof Generator
   - **Database Password**: Create strong password
   - **Region**: Choose closest to your users
4. Click "Create new project"

### 2. Setup Database Schema
1. In Supabase dashboard, go to **SQL Editor**
2. Copy the entire content from `supabase-schema.sql`
3. Paste into SQL Editor and click **Run**
4. This creates all tables, policies, and triggers

### 3. Configure Storage (Optional)
1. Go to **Storage** in Supabase dashboard
2. Create new bucket: `testimonial-images`
3. Set bucket to **Public**
4. Update policies for public read access

### 4. Get API Keys
1. Go to **Settings** → **API**
2. Copy these values:
   - **Project URL**: `https://xyz.supabase.co`
   - **anon/public key**: `eyJ...`
   - **service_role key**: `eyJ...` (keep secret!)

---

## 🌐 Part 2: Netlify Deployment

### 1. Prepare Repository
1. Push your code to GitHub/GitLab
2. Ensure these files are in root directory:
   - `index.html`
   - `submit.html`
   - `config.js`
   - `netlify.toml`
   - `package.json`
   - `netlify/functions/` folder

### 2. Deploy to Netlify
1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Click "Add new site" → "Import from Git"
3. Connect your repository
4. Configure build settings:
   - **Build command**: (leave empty)
   - **Publish directory**: (leave empty or set to `./`)
5. Click "Deploy site"

### 3. Configure Environment Variables
1. In Netlify dashboard, go to **Site settings** → **Environment variables**
2. Add these variables:

```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=your-email@gmail.com
ADMIN_EMAIL=your-admin-email@gmail.com
SITE_URL=https://your-app.netlify.app
```

### 4. Update Frontend Configuration
1. Edit `config.js` with your actual values:
```javascript
const SUPABASE_CONFIG = {
    url: 'https://your-project-id.supabase.co',
    anonKey: 'your-anon-key-here'
};
```

2. Update admin email in the schema SQL:
```sql
-- Replace 'your-email@example.com' with your actual email
INSERT INTO public.email_queue (to_email, subject, body)
VALUES ('your-actual-email@gmail.com', ...);
```

---

## 📧 Part 3: Email Notifications Setup

### Option A: Gmail SMTP (Recommended)
1. Enable 2FA on your Gmail account
2. Generate an App Password:
   - Gmail → Settings → Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
3. Use this password in `SMTP_PASS` environment variable

### Option B: EmailJS (Alternative)
1. Create account at [EmailJS](https://www.emailjs.com/)
2. Create email service
3. Create email template
4. Update `config.js` with EmailJS credentials:
```javascript
emailjsConfig: {
    serviceId: 'your-service-id',
    templateId: 'your-template-id',
    publicKey: 'your-public-key'
}
```

---

## 🔗 Part 4: URL Configuration

### Customer Submission Page
- Main app: `https://your-app.netlify.app`
- Admin panel: `https://your-app.netlify.app/admin`
- Customer submissions: `https://your-app.netlify.app/submit`

### Custom Domain (Optional)
1. In Netlify: **Domain settings** → **Add custom domain**
2. Follow DNS configuration instructions
3. Enable HTTPS (automatic with Netlify)

---

## ✅ Part 5: Testing the System

### Test Customer Submission
1. Visit `/submit` page
2. Fill out testimonial form
3. Submit testimonial
4. Check:
   - ✅ Data appears in Supabase database
   - ✅ Email notification received
   - ✅ Notification appears in admin panel

### Test Admin Functions
1. Visit `/admin` (main page)
2. Check:
   - ✅ Testimonials load from database
   - ✅ Can approve/reject submissions
   - ✅ Can create new testimonials
   - ✅ Export functions work
   - ✅ Real-time notifications work

---

## 🛠️ Troubleshooting

### Common Issues

**❌ "Failed to sync with database"**
- Check Supabase URL and API keys
- Verify database schema was created
- Check browser console for errors

**❌ Email notifications not working**
- Verify SMTP credentials
- Check Gmail App Password setup
- Look at Netlify Function logs

**❌ Customer submissions not saving**
- Check Netlify Functions are deployed
- Verify environment variables
- Check RLS policies in Supabase

**❌ Images not uploading**
- Verify Storage bucket exists and is public
- Check storage policies
- Ensure file size limits

### Debug Steps
1. **Check Netlify Function Logs**:
   - Netlify Dashboard → Functions → View logs

2. **Check Supabase Logs**:
   - Supabase Dashboard → Logs → API/Database

3. **Browser Console**:
   - F12 → Console tab for JavaScript errors

4. **Network Tab**:
   - F12 → Network tab to see failed requests

---

## 🔒 Security Best Practices

1. **Never expose service role key** in frontend
2. **Use RLS policies** to protect data
3. **Validate all inputs** on server side
4. **Rate limit submissions** to prevent spam
5. **Use HTTPS** for all communications
6. **Regular database backups** via Supabase

---

## 📱 Usage Instructions

### For You (Admin)
- Use main interface (`/admin`) to manage testimonials
- Review and approve customer submissions
- Export testimonials for marketing use
- Get email notifications for new submissions

### For Your Customers
- Send customers to `/submit` page
- They can rate, write testimonial, and add photo
- Submissions require approval before showing publicly
- Mobile-friendly responsive design

---

## 🎯 Next Steps

1. **Customize branding** in CSS and config
2. **Add Google Analytics** for tracking
3. **Set up automated backups** 
4. **Create email templates** for better notifications
5. **Add customer follow-up** workflows
6. **Implement advanced filtering** and search

---

## 📞 Support

If you need help with deployment:
1. Check the troubleshooting section above
2. Review Netlify and Supabase documentation
3. Check browser console and server logs
4. Verify all environment variables are set correctly

Your Social Proof Generator is now ready to collect and manage customer testimonials professionally! 🎉
