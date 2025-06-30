# Social Proof Generator

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/dubd59/Social-Proof-Generator)

A professional, full-stack web application for creating, managing, and collecting customer testimonials with star ratings. Features a modern sidebar interface, real-time notifications, and complete backend integration.

## ✨ Features

### 📝 Admin Interface (Main App)
- **Interactive Dashboard**: Clean sidebar navigation with real-time stats
- **Testimonial Management**: Create, edit, approve, and delete testimonials
- **Live Preview**: See testimonials as you type with real-time updates
- **Template System**: Multiple beautiful testimonial layouts
- **Export Options**: HTML, PNG/JPG images, and clipboard integration
- **Real-time Notifications**: Get notified instantly when customers submit testimonials

### � Customer Submission Portal (`/submit`)
- **Public Submission Form**: Beautiful landing page for customer testimonials
- **5-Star Rating System**: Interactive star rating with visual feedback
- **Photo Upload**: Profile image upload with drag & drop support
- **Mobile Optimized**: Responsive design works perfectly on all devices
- **Spam Protection**: Rate limiting and validation to prevent abuse

### �️ Backend Integration
- **Supabase Database**: Cloud PostgreSQL with real-time subscriptions
- **Email Notifications**: Instant email alerts for new submissions
- **Netlify Functions**: Serverless API endpoints for data management
- **Real-time Sync**: Live updates across all admin panels
- **Data Security**: Row-level security and proper authentication

### 🎨 Modern Interface
- **Clean Design**: Professional UI with #38beba accent color
- **Responsive Layout**: Works on desktop, tablet, and mobile
- **Smooth Animations**: Polished user experience with CSS transitions
- **Accessibility**: WCAG compliant interface elements

## 🚀 Quick Start

### Local Development
1. **Clone/Download** this repository
2. **Open** `index.html` in any modern web browser
3. **Configure** backend (optional - works offline with sample data)

### Full Deployment (Recommended)
See [DEPLOYMENT.md](DEPLOYMENT.md) for complete setup guide with:
- Netlify frontend hosting
- Supabase backend database
- Email notification system
- Customer submission portal

## 📁 Project Structure

```
social-proof-generator/
├── index.html              # Main admin interface
├── submit.html             # Customer submission portal
├── style.css               # Complete styling system
├── script.js               # Frontend application logic
├── config.js               # Configuration settings
├── netlify.toml            # Netlify deployment config
├── package.json            # Dependencies for Netlify Functions
├── supabase-schema.sql     # Database schema and setup
├── DEPLOYMENT.md           # Complete deployment guide
├── .env.example            # Environment variables template
├── netlify/functions/      # Serverless backend functions
│   ├── submit-testimonial.js   # Handle customer submissions
│   └── api-testimonials.js     # Admin API endpoints
└── assets/                 # Static assets directory
    ├── fonts/              # Custom font files
    └── images/             # Logo and background images
```

## 🎯 Two-Way System

### 1. Admin Interface (`/` or `/admin`)
**For You (Business Owner)**
- Manage all testimonials from a professional dashboard
- Create testimonials manually for existing customers
- Approve/reject customer submissions
- Export testimonials for use in marketing materials
- Get real-time notifications for new submissions
- Customize appearance and settings

### 2. Customer Portal (`/submit`)
**For Your Customers**
- Beautiful, mobile-friendly submission form
- Rate their experience with interactive stars
- Write detailed testimonials with character counting
- Upload profile photos with drag & drop
- Secure submission with validation and rate limiting
- Professional thank you message after submission

## 🔧 Configuration Options

### Frontend Settings (`config.js`)
```javascript
const SUPABASE_CONFIG = {
    url: 'your-supabase-url',
    anonKey: 'your-anon-key'
};

const APP_CONFIG = {
    maxTestimonialLength: 1000,
    autoApprove: false,
    emailNotifications: true,
    rateLimiting: {
        maxSubmissionsPerIP: 5,
        timeWindowHours: 24
    }
};
```

### Backend Settings (Environment Variables)
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for admin operations
- `ADMIN_EMAIL` - Your email for notifications
- `SMTP_*` - Email server configuration

## 📱 Mobile Experience

- **Touch-Friendly**: Large touch targets optimized for mobile
- **Responsive Design**: Adapts perfectly to any screen size
- **Fast Loading**: Optimized assets and efficient code
- **Offline Capable**: Works without internet connection
- **Progressive Enhancement**: Graceful degradation for older browsers

## 🔒 Security Features

- **Row Level Security**: Database-level access control
- **Rate Limiting**: Prevents spam and abuse
- **Input Validation**: Server-side validation for all data
- **CSRF Protection**: Secure form submissions
- **Sanitization**: XSS protection for user content

## 📧 Email Notification System

When customers submit testimonials, you'll receive:
- **Instant Email Alerts** with testimonial details
- **Direct Admin Links** to review and approve
- **Professional Email Templates** with your branding
- **Rich HTML Formatting** with star ratings and content

## 🎨 Customization

### Brand Colors
Update the CSS custom properties:
```css
:root {
    --accent: #38beba;          /* Your brand color */
    --accent-hover: #2a9a96;    /* Darker shade */
    --accent-light: rgba(56, 190, 186, 0.1);
}
```

### Email Templates
Customize notification emails in `netlify/functions/submit-testimonial.js`

### Testimonial Templates
Add new layouts in the Templates section of `index.html`

## 🛠️ Technical Details

### Dependencies
- **Supabase**: Backend database and real-time subscriptions
- **html2canvas**: Client-side image generation
- **Font Awesome**: Icons and visual elements
- **EmailJS**: Client-side email sending (optional)

### Browser Support
- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Edge 80+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

### Performance
- **Lightweight**: ~100KB total size with all assets
- **Fast Loading**: Optimized CSS and JavaScript
- **Efficient Database**: Indexed queries and caching
- **CDN Ready**: Static assets served from global CDN

## � Workflow

1. **Customer visits** `/submit` page (you share this link)
2. **Customer submits** testimonial with rating and optional photo
3. **You receive email** notification immediately
4. **You review** submission in admin dashboard
5. **You approve** testimonial to make it public
6. **You export** testimonial for use in marketing

## 📊 Analytics & Insights

Track these metrics from your admin dashboard:
- Total testimonials collected
- Average rating across all testimonials
- Submission trends over time
- Most active customers
- Approval rates and response times

## 🆘 Troubleshooting

### Common Issues

**Testimonials not syncing**
- Check Supabase configuration
- Verify internet connection
- Look for JavaScript console errors

**Email notifications not working**
- Verify SMTP settings in environment variables
- Check spam folder
- Test email configuration

**Customer submissions failing**
- Check Netlify Functions deployment
- Verify database permissions
- Test form validation

### Debug Mode
Enable detailed logging by adding to console:
```javascript
localStorage.setItem('debug', 'true');
```

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🤝 Support

For deployment help, see [DEPLOYMENT.md](DEPLOYMENT.md)

For issues:
1. Check troubleshooting section above
2. Review browser console for errors
3. Check Netlify/Supabase logs
4. Verify all configuration settings

---

Transform your customer feedback into powerful social proof with this complete testimonial management system! 🚀✨
