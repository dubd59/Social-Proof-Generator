document.addEventListener('DOMContentLoaded', function() {
    // Initialize application
    const app = new SocialProofGenerator();
    app.init();
});

class SocialProofGenerator {
    constructor() {
        this.testimonials = [];
        this.currentTemplate = 'modern';
        this.settings = {
            accentColor: '#38beba',
            fontFamily: 'Inter',
            imageFormat: 'png',
            imageQuality: 1
        };
        
        this.supabase = null;
        this.isOnline = navigator.onLine;
        this.lastSync = null;
        
        this.initSupabase();
        this.initElements();
        this.initEventListeners();
        this.loadTestimonials();
        this.setupNotificationSystem();
    }

    initElements() {
        // Navigation
        this.navItems = document.querySelectorAll('.nav-item');
        this.contentSections = document.querySelectorAll('.content-section');
        this.sectionTitle = document.getElementById('section-title');
        this.sectionSubtitle = document.getElementById('section-subtitle');

        // Form elements
        this.testimonialForm = document.getElementById('testimonial-form');
        this.ratingStars = document.querySelectorAll('.rating-stars span');
        this.ratingValue = document.getElementById('rating-value');
        this.ratingText = document.querySelector('.rating-text');
        this.testimonialText = document.getElementById('testimonial-text');
        this.authorName = document.getElementById('author-name');
        this.authorTitle = document.getElementById('author-title');
        this.authorImage = document.getElementById('author-image');
        this.charCount = document.getElementById('char-count');
        this.resetBtn = document.getElementById('reset-form');

        // Preview elements
        this.testimonialPreview = document.getElementById('testimonial-preview');
        this.testimonialsContainer = document.getElementById('testimonials-container');
        this.testimonialCount = document.getElementById('testimonial-count');

        // Export elements
        this.exportHtmlBtn = document.getElementById('export-html');
        this.exportAllImagesBtn = document.getElementById('export-all-images');
        this.exportSingleImageBtn = document.getElementById('export-single-image');
        this.copyToClipboardBtn = document.getElementById('copy-to-clipboard');
        this.imageFormatSelect = document.getElementById('image-format');

        // Modal elements
        this.imagePreviewModal = document.getElementById('image-preview-modal');
        this.previewImage = document.getElementById('preview-image');
        this.downloadImageBtn = document.getElementById('download-image');
        this.closePreviewBtn = document.getElementById('close-preview');

        // Settings elements
        this.accentColorInput = document.getElementById('accent-color');
        this.fontFamilySelect = document.getElementById('font-family');
        this.defaultFormatSelect = document.getElementById('default-format');
        this.imageQualityRange = document.getElementById('image-quality');
        this.qualityValue = document.getElementById('quality-value');

        // Template elements
        this.templateCards = document.querySelectorAll('.template-card');
    }

    initEventListeners() {
        // Navigation
        this.navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchSection(item.dataset.section);
            });
        });

        // Form events
        this.testimonialForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTestimonial();
        });

        this.resetBtn.addEventListener('click', () => this.resetForm());

        // Rating stars
        this.ratingStars.forEach(star => {
            star.addEventListener('click', () => {
                this.setRating(parseInt(star.dataset.value));
            });
        });

        // Character count
        this.testimonialText.addEventListener('input', () => {
            this.updateCharCount();
            this.updatePreview();
        });

        // Real-time preview updates
        this.authorName.addEventListener('input', () => this.updatePreview());
        this.authorTitle.addEventListener('input', () => this.updatePreview());
        this.authorImage.addEventListener('input', () => this.updatePreview());

        // Export events
        this.exportHtmlBtn.addEventListener('click', () => this.exportHTML());
        this.exportAllImagesBtn.addEventListener('click', () => this.exportAllImages());
        this.exportSingleImageBtn.addEventListener('click', () => this.exportSingleImage());
        this.copyToClipboardBtn.addEventListener('click', () => this.copyToClipboard());

        // Modal events
        this.closePreviewBtn.addEventListener('click', () => this.closeModal());
        this.downloadImageBtn.addEventListener('click', () => this.downloadCurrentImage());
        this.imagePreviewModal.addEventListener('click', (e) => {
            if (e.target === this.imagePreviewModal) this.closeModal();
        });

        // Settings events
        this.accentColorInput.addEventListener('change', (e) => {
            this.updateAccentColor(e.target.value);
        });

        this.fontFamilySelect.addEventListener('change', (e) => {
            this.updateFontFamily(e.target.value);
        });

        this.imageQualityRange.addEventListener('input', (e) => {
            this.updateImageQuality(e.target.value);
        });

        // Template selection
        this.templateCards.forEach(card => {
            card.addEventListener('click', () => {
                this.selectTemplate(card);
            });
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case 's':
                        e.preventDefault();
                        this.exportHTML();
                        break;
                    case 'Enter':
                        if (e.target.closest('.testimonial-form')) {
                            e.preventDefault();
                            this.addTestimonial();
                        }
                        break;
                }
            }
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });
    }

    switchSection(sectionId) {
        // Update navigation
        this.navItems.forEach(item => item.classList.remove('active'));
        document.querySelector(`[data-section="${sectionId}"]`).classList.add('active');

        // Update content sections
        this.contentSections.forEach(section => section.classList.remove('active'));
        document.getElementById(`${sectionId}-section`).classList.add('active');

        // Update header
        const sectionTitles = {
            testimonials: { title: 'Testimonials', subtitle: 'Create and manage customer testimonials' },
            templates: { title: 'Templates', subtitle: 'Choose from beautiful testimonial designs' },
            export: { title: 'Export', subtitle: 'Download your testimonials in various formats' },
            settings: { title: 'Settings', subtitle: 'Customize appearance and preferences' }
        };

        const section = sectionTitles[sectionId];
        this.sectionTitle.textContent = section.title;
        this.sectionSubtitle.textContent = section.subtitle;
    }

    setRating(value) {
        this.ratingValue.value = value;
        
        // Update star display
        this.ratingStars.forEach((star, index) => {
            const icon = star.querySelector('i');
            if (index < value) {
                icon.classList.remove('far');
                icon.classList.add('fas');
                star.classList.add('active');
            } else {
                icon.classList.remove('fas');
                icon.classList.add('far');
                star.classList.remove('active');
            }
        });

        // Update rating text
        const ratingTexts = {
            1: 'Poor (1 star)',
            2: 'Fair (2 stars)',
            3: 'Good (3 stars)',
            4: 'Very Good (4 stars)',
            5: 'Excellent (5 stars)'
        };
        this.ratingText.textContent = ratingTexts[value];
        
        this.updatePreview();
    }

    updateCharCount() {
        const count = this.testimonialText.value.length;
        this.charCount.textContent = count;
        
        if (count > 500) {
            this.charCount.style.color = '#e53e3e';
        } else if (count > 400) {
            this.charCount.style.color = '#f56500';
        } else {
            this.charCount.style.color = '#718096';
        }
    }

    updatePreview() {
        const previewData = {
            rating: parseInt(this.ratingValue.value),
            text: this.testimonialText.value || 'Your testimonial will appear here...',
            author: this.authorName.value || 'Customer Name',
            title: this.authorTitle.value || 'Position, Company',
            image: this.authorImage.value
        };

        this.testimonialPreview.innerHTML = this.generateTestimonialHTML(previewData, true);
    }

    async addTestimonial() {
        const testimonial = {
            rating: parseInt(this.ratingValue.value),
            text: this.testimonialText.value.trim(),
            author: this.authorName.value.trim(),
            title: this.authorTitle.value.trim(),
            image: this.authorImage.value.trim(),
            createdAt: new Date().toISOString()
        };

        if (!testimonial.text || !testimonial.author) {
            this.showNotification('Please fill in the testimonial text and customer name', 'error');
            return;
        }

        if (testimonial.text.length > 500) {
            this.showNotification('Testimonial text must be 500 characters or less', 'error');
            return;
        }

        try {
            if (this.supabase) {
                // Save to database
                const { data, error } = await this.supabase
                    .from('testimonials')
                    .insert([{
                        rating: testimonial.rating,
                        testimonial_text: testimonial.text,
                        author_name: testimonial.author,
                        author_title: testimonial.title || null,
                        author_image_url: testimonial.image || null,
                        source: 'admin_created',
                        is_approved: true // Admin created testimonials are auto-approved
                    }])
                    .select()
                    .single();

                if (error) throw error;

                // Add to local array with database ID
                testimonial.id = data.id;
                testimonial.isApproved = true;
                testimonial.isFeatured = false;
                testimonial.source = 'admin_created';
            } else {
                // Offline mode - use timestamp as ID
                testimonial.id = Date.now();
                testimonial.isApproved = true;
                testimonial.isFeatured = false;
                testimonial.source = 'offline';
            }

            this.testimonials.unshift(testimonial);
            this.renderTestimonials();
            this.resetForm();
            this.updateStats();
            this.showNotification('Testimonial added successfully!', 'success');
        } catch (error) {
            console.error('Failed to add testimonial:', error);
            this.showNotification('Failed to add testimonial', 'error');
        }
    }

    resetForm() {
        this.testimonialForm.reset();
        this.setRating(5);
        this.updateCharCount();
        this.updatePreview();
    }

    renderTestimonials() {
        if (this.testimonials.length === 0) {
            this.testimonialsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-comments"></i>
                    <h3>No testimonials yet</h3>
                    <p>Create your first testimonial using the form</p>
                </div>
            `;
            return;
        }

        this.testimonialsContainer.innerHTML = this.testimonials
            .map(testimonial => this.generateTestimonialHTML(testimonial))
            .join('');

        // Add delete event listeners
        this.testimonialsContainer.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.dataset.id);
                this.deleteTestimonial(id);
            });
        });
    }

    generateTestimonialHTML(testimonial, isPreview = false) {
        const starsHTML = this.generateStarsHTML(testimonial.rating);
        const avatarHTML = this.generateAvatarHTML(testimonial);
        const deleteBtn = !isPreview ? `
            <button class="delete-btn" data-id="${testimonial.id}">
                <i class="fas fa-times"></i>
            </button>
        ` : '';

        return `
            <div class="testimonial-card">
                ${deleteBtn}
                <div class="rating">${starsHTML}</div>
                <div class="content">"${testimonial.text}"</div>
                <div class="author-info">
                    ${avatarHTML}
                    <div class="author-details">
                        <div class="author-name">${testimonial.author}</div>
                        <div class="author-title">${testimonial.title}</div>
                    </div>
                </div>
            </div>
        `;
    }

    generateStarsHTML(rating) {
        let starsHTML = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= rating) {
                starsHTML += '<i class="fas fa-star"></i>';
            } else {
                starsHTML += '<i class="far fa-star"></i>';
            }
        }
        return starsHTML;
    }

    generateAvatarHTML(testimonial) {
        if (testimonial.image) {
            return `
                <div class="author-avatar">
                    <img src="${testimonial.image}" alt="${testimonial.author}" onerror="this.parentNode.innerHTML='${this.getInitials(testimonial.author)}'">
                </div>
            `;
        } else {
            return `
                <div class="author-avatar">${this.getInitials(testimonial.author)}</div>
            `;
        }
    }

    getInitials(name) {
        return name.split(' ')
            .map(word => word.charAt(0))
            .join('')
            .toUpperCase()
            .substring(0, 2);
    }

    deleteTestimonial(id) {
        if (confirm('Are you sure you want to delete this testimonial?')) {
            this.testimonials = this.testimonials.filter(t => t.id !== id);
            this.renderTestimonials();
            this.updateStats();
            this.showNotification('Testimonial deleted', 'success');
        }
    }

    updateStats() {
        this.testimonialCount.textContent = this.testimonials.length;
        
        // Calculate average rating
        if (this.testimonials.length > 0) {
            const avgRating = this.testimonials.reduce((sum, t) => sum + t.rating, 0) / this.testimonials.length;
            document.querySelector('.stat-number:last-child').textContent = avgRating.toFixed(1);
        }
    }

    // Export functions
    exportHTML() {
        const htmlContent = this.generateExportHTML();
        this.downloadFile(htmlContent, 'social-proof-testimonials.html', 'text/html');
        this.showNotification('HTML file downloaded successfully!', 'success');
    }

    async exportAllImages() {
        if (this.testimonials.length === 0) {
            this.showNotification('No testimonials to export', 'error');
            return;
        }

        this.showNotification('Generating images...', 'info');
        
        for (let i = 0; i < this.testimonials.length; i++) {
            try {
                await this.generateImage(this.testimonials[i], i + 1);
                await new Promise(resolve => setTimeout(resolve, 500)); // Delay between exports
            } catch (error) {
                console.error('Error generating image:', error);
            }
        }
        
        this.showNotification('All images exported successfully!', 'success');
    }

    async exportSingleImage() {
        if (this.testimonials.length === 0) {
            this.showNotification('No testimonials to export', 'error');
            return;
        }

        try {
            const imageData = await this.generateImage(this.testimonials[0]);
            this.showImagePreview(imageData);
        } catch (error) {
            this.showNotification('Error generating image', 'error');
            console.error(error);
        }
    }

    async generateImage(testimonial, index = null) {
        // Create temporary container
        const tempContainer = document.createElement('div');
        tempContainer.style.cssText = `
            position: absolute;
            left: -9999px;
            width: 600px;
            padding: 40px;
            background: white;
            border-radius: 16px;
            font-family: ${this.settings.fontFamily}, sans-serif;
        `;

        tempContainer.innerHTML = this.generateTestimonialHTML(testimonial, true);
        document.body.appendChild(tempContainer);

        try {
            const canvas = await html2canvas(tempContainer, {
                scale: 2,
                backgroundColor: '#ffffff',
                useCORS: true,
                allowTaint: true
            });

            const format = this.imageFormatSelect.value || this.settings.imageFormat;
            const imageData = canvas.toDataURL(`image/${format}`, this.settings.imageQuality);

            if (index) {
                // Auto-download for batch export
                const fileName = `testimonial-${index}.${format}`;
                this.downloadImage(imageData, fileName);
            }

            return imageData;
        } finally {
            document.body.removeChild(tempContainer);
        }
    }

    copyToClipboard() {
        const htmlContent = this.generateExportHTML();
        navigator.clipboard.writeText(htmlContent).then(() => {
            this.showNotification('HTML copied to clipboard!', 'success');
        }).catch(() => {
            this.showNotification('Failed to copy to clipboard', 'error');
        });
    }

    generateExportHTML() {
        const testimonialsHTML = this.testimonials
            .map(testimonial => this.generateTestimonialHTML(testimonial, true))
            .join('');

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Customer Testimonials</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=${this.settings.fontFamily}:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --accent: ${this.settings.accentColor};
            --accent-hover: ${this.darkenColor(this.settings.accentColor, 20)};
            --primary: #1a202c;
            --text: #2d3748;
            --text-light: #718096;
            --background: #f7fafc;
            --surface: #ffffff;
            --border: #e2e8f0;
            --radius: 12px;
        }
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: '${this.settings.fontFamily}', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: var(--background);
            color: var(--text);
            line-height: 1.6;
            padding: 40px 20px;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        
        .header {
            text-align: center;
            margin-bottom: 40px;
        }
        
        .header h1 {
            font-size: 2.5rem;
            font-weight: 700;
            color: var(--primary);
            margin-bottom: 8px;
        }
        
        .header p {
            color: var(--text-light);
            font-size: 1.1rem;
        }
        
        .testimonials-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 24px;
        }
        
        .testimonial-card {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: var(--radius);
            padding: 24px;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .testimonial-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        }
        
        .rating {
            color: #ffc107;
            font-size: 18px;
            margin-bottom: 16px;
        }
        
        .content {
            font-style: italic;
            line-height: 1.6;
            color: var(--text);
            margin-bottom: 20px;
            font-size: 16px;
        }
        
        .author-info {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        
        .author-avatar {
            width: 48px;
            height: 48px;
            border-radius: 50%;
            background: var(--accent);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 600;
            font-size: 16px;
        }
        
        .author-avatar img {
            width: 100%;
            height: 100%;
            border-radius: 50%;
            object-fit: cover;
        }
        
        .author-name {
            font-weight: 600;
            color: var(--primary);
            margin-bottom: 4px;
        }
        
        .author-title {
            font-size: 14px;
            color: var(--text-light);
        }
        
        @media (max-width: 768px) {
            .testimonials-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Customer Testimonials</h1>
            <p>See what our customers have to say about us</p>
        </div>
        <div class="testimonials-grid">
            ${testimonialsHTML}
        </div>
    </div>
</body>
</html>`;
    }

    showImagePreview(imageData) {
        this.previewImage.src = imageData;
        this.currentImageData = imageData;
        this.imagePreviewModal.classList.add('active');
    }

    closeModal() {
        this.imagePreviewModal.classList.remove('active');
    }

    downloadCurrentImage() {
        if (this.currentImageData) {
            const format = this.imageFormatSelect.value || this.settings.imageFormat;
            const fileName = `testimonial-${Date.now()}.${format}`;
            this.downloadImage(this.currentImageData, fileName);
            this.closeModal();
        }
    }

    downloadImage(imageData, fileName) {
        const a = document.createElement('a');
        a.href = imageData;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    downloadFile(content, fileName, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Settings functions
    updateAccentColor(color) {
        this.settings.accentColor = color;
        document.documentElement.style.setProperty('--accent', color);
        document.documentElement.style.setProperty('--accent-hover', this.darkenColor(color, 20));
        document.documentElement.style.setProperty('--accent-light', `${color}1a`);
    }

    updateFontFamily(fontFamily) {
        this.settings.fontFamily = fontFamily;
        document.body.style.fontFamily = `'${fontFamily}', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
    }

    updateImageQuality(quality) {
        this.settings.imageQuality = parseFloat(quality);
        this.qualityValue.textContent = `${Math.round(quality * 100)}%`;
    }

    selectTemplate(templateCard) {
        this.templateCards.forEach(card => card.classList.remove('active'));
        templateCard.classList.add('active');
        
        // Get template type from card data or class
        const templateType = templateCard.querySelector('.template-testimonial').classList[1] || 'modern';
        this.currentTemplate = templateType;
        
        this.showNotification(`Template changed to ${templateType}`, 'success');
    }

    darkenColor(hex, percent) {
        // Remove # if present
        hex = hex.replace('#', '');
        
        // Parse RGB values
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        
        // Darken each component
        const factor = (100 - percent) / 100;
        const newR = Math.round(r * factor);
        const newG = Math.round(g * factor);
        const newB = Math.round(b * factor);
        
        // Convert back to hex
        return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
            </div>
        `;

        // Add styles if not already present
        if (!document.querySelector('#notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                .notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 10000;
                    min-width: 300px;
                    padding: 16px 20px;
                    border-radius: 8px;
                    color: white;
                    font-weight: 500;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                    transform: translateX(400px);
                    transition: transform 0.3s ease;
                }
                .notification-success { background: #48bb78; }
                .notification-error { background: #f56565; }
                .notification-info { background: #4299e1; }
                .notification-content {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                .notification.show {
                    transform: translateX(0);
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(notification);

        // Show notification
        setTimeout(() => notification.classList.add('show'), 100);

        // Hide and remove notification
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    getNotificationIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    loadSampleData() {
        this.testimonials = [
            {
                id: 1,
                rating: 5,
                text: "This social proof generator has transformed how we showcase customer feedback. The templates are beautiful and the export options make it so easy to use testimonials across all our marketing channels.",
                author: "Sarah Johnson",
                title: "Marketing Director, TechStartup Inc.",
                image: "",
                createdAt: new Date().toISOString()
            },
            {
                id: 2,
                rating: 5,
                text: "I love how professional and clean the testimonials look. The drag-and-drop interface makes it incredibly easy to create stunning testimonial displays in minutes.",
                author: "Mike Chen",
                title: "Founder, GrowthCorp",
                image: "",
                createdAt: new Date().toISOString()
            },
            {
                id: 3,
                rating: 5,
                text: "As a freelance designer, this tool saves me hours of work. The export quality is fantastic and my clients are always impressed with the final results.",
                author: "Alex Morgan",
                title: "Freelance Designer",
                image: "",
                createdAt: new Date().toISOString()
            }
        ];

        this.renderTestimonials();
        this.updateStats();
        this.updatePreview();
    }

    initSupabase() {
        // Initialize Supabase if config is available
        if (window.SUPABASE_CONFIG && 
            window.SUPABASE_CONFIG.url !== 'https://your-project-id.supabase.co' &&
            window.SUPABASE_CONFIG.anonKey !== 'your-anon-key-here' &&
            window.supabase) {
            try {
                this.supabase = supabase.createClient(
                    window.SUPABASE_CONFIG.url, 
                    window.SUPABASE_CONFIG.anonKey
                );
                console.log('✅ Supabase initialized for admin panel');
            } catch (error) {
                console.error('❌ Supabase initialization failed:', error);
                this.supabase = null;
            }
        } else {
            console.log('⚠️ Supabase not configured - running in demo mode');
            this.supabase = null;
        }
    }

    async loadTestimonials() {
        try {
            if (this.supabase) {
                // Load from Supabase
                await this.syncFromDatabase();
            } else {
                // Check for demo data in localStorage first
                const demoTestimonials = JSON.parse(localStorage.getItem('demo_testimonials') || '[]');
                if (demoTestimonials.length > 0) {
                    this.loadDemoData(demoTestimonials);
                } else {
                    // Load sample data if no backend and no demo data
                    this.loadSampleData();
                }
            }
        } catch (error) {
            console.error('Failed to load testimonials:', error);
            this.loadSampleData(); // Fallback to sample data
        }
    }

    loadDemoData(demoTestimonials) {
        // Convert demo testimonials from localStorage to app format
        this.testimonials = demoTestimonials.map(item => ({
            id: item.id,
            rating: item.rating,
            text: item.testimonial_text,
            author: item.author_name,
            title: item.author_title || '',
            image: item.author_image_url || '',
            email: item.author_email || '',
            isApproved: item.status === 'approved',
            isFeatured: false,
            createdAt: item.created_at,
            source: item.source || 'demo'
        }));

        this.renderTestimonials();
        this.updateStats();
        this.updatePreview();
        this.showNotification(`Loaded ${demoTestimonials.length} testimonial(s) from demo storage`, 'info');
    }

    async syncFromDatabase() {
        try {
            const { data, error } = await this.supabase
                .from('testimonials')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Convert database format to app format
            this.testimonials = data.map(item => ({
                id: item.id,
                rating: item.rating,
                text: item.testimonial_text,
                author: item.author_name,
                title: item.author_title || '',
                image: item.author_image_url || '',
                email: item.author_email || '',
                isApproved: item.is_approved,
                isFeatured: item.is_featured,
                createdAt: item.created_at,
                source: item.source
            }));

            this.lastSync = new Date();
            this.renderTestimonials();
            this.updateStats();
            this.showNotification('Testimonials synced from database', 'success');
        } catch (error) {
            console.error('Database sync failed:', error);
            this.showNotification('Failed to sync with database', 'error');
        }
    }

    setupNotificationSystem() {
        // Set up real-time notifications for new testimonials
        if (this.supabase) {
            this.supabase
                .channel('testimonials')
                .on('postgres_changes', 
                    { event: 'INSERT', schema: 'public', table: 'testimonials' }, 
                    (payload) => {
                        this.handleNewTestimonial(payload.new);
                    }
                )
                .subscribe();

            // Check for pending notifications
            this.checkPendingNotifications();
        }
    }

    async checkPendingNotifications() {
        try {
            const { data, error } = await this.supabase
                .from('notifications')
                .select('*')
                .eq('is_read', false)
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (data && data.length > 0) {
                this.showNotification(
                    `You have ${data.length} new testimonial${data.length > 1 ? 's' : ''} to review`, 
                    'info'
                );
                
                // Update sidebar notification badge
                this.updateNotificationBadge(data.length);
            }
        } catch (error) {
            console.error('Failed to check notifications:', error);
        }
    }

    handleNewTestimonial(newTestimonial) {
        // Add new testimonial to the list
        const testimonial = {
            id: newTestimonial.id,
            rating: newTestimonial.rating,
            text: newTestimonial.testimonial_text,
            author: newTestimonial.author_name,
            title: newTestimonial.author_title || '',
            image: newTestimonial.author_image_url || '',
            email: newTestimonial.author_email || '',
            isApproved: newTestimonial.is_approved,
            isFeatured: newTestimonial.is_featured,
            createdAt: newTestimonial.created_at,
            source: newTestimonial.source
        };

        this.testimonials.unshift(testimonial);
        this.renderTestimonials();
        this.updateStats();
        
        // Show notification
        this.showNotification(
            `New testimonial from ${newTestimonial.author_name}!`, 
            'success'
        );

        // Play notification sound (optional)
        this.playNotificationSound();
    }

    async approveTestimonial(id) {
        try {
            if (this.supabase) {
                const { error } = await this.supabase
                    .from('testimonials')
                    .update({ is_approved: true })
                    .eq('id', id);

                if (error) throw error;
            }

            // Update local data
            const testimonial = this.testimonials.find(t => t.id === id);
            if (testimonial) {
                testimonial.isApproved = true;
                this.renderTestimonials();
                this.showNotification('Testimonial approved!', 'success');
            }
        } catch (error) {
            console.error('Failed to approve testimonial:', error);
            this.showNotification('Failed to approve testimonial', 'error');
        }
    }

    async toggleFeatured(id) {
        try {
            const testimonial = this.testimonials.find(t => t.id === id);
            if (!testimonial) return;

            const newFeaturedStatus = !testimonial.isFeatured;

            if (this.supabase) {
                const { error } = await this.supabase
                    .from('testimonials')
                    .update({ is_featured: newFeaturedStatus })
                    .eq('id', id);

                if (error) throw error;
            }

            // Update local data
            testimonial.isFeatured = newFeaturedStatus;
            this.renderTestimonials();
            this.showNotification(
                `Testimonial ${newFeaturedStatus ? 'featured' : 'unfeatured'}!`, 
                'success'
            );
        } catch (error) {
            console.error('Failed to toggle featured status:', error);
            this.showNotification('Failed to update testimonial', 'error');
        }
    }

    updateNotificationBadge(count) {
        // Add notification badge to sidebar
        const testimonialsNav = document.querySelector('[data-section="testimonials"]');
        if (testimonialsNav) {
            let badge = testimonialsNav.querySelector('.notification-badge');
            if (!badge && count > 0) {
                badge = document.createElement('span');
                badge.className = 'notification-badge';
                badge.style.cssText = `
                    position: absolute;
                    top: 8px;
                    right: 8px;
                    background: #f56565;
                    color: white;
                    border-radius: 50%;
                    width: 20px;
                    height: 20px;
                    font-size: 11px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 600;
                `;
                testimonialsNav.style.position = 'relative';
                testimonialsNav.appendChild(badge);
            }
            
            if (badge) {
                if (count > 0) {
                    badge.textContent = count > 99 ? '99+' : count;
                    badge.style.display = 'flex';
                } else {
                    badge.style.display = 'none';
                }
            }
        }
    }

    playNotificationSound() {
        // Optional: Play notification sound
        try {
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmeEBjuLz+3UgjMGHWq+8+OGRA0PVqzn77BdGAZAfejrWBwHM5XN9ciJTw4SVrng7KdXGA=');
            audio.volume = 0.3;
            audio.play().catch(() => {
                // Ignore autoplay restrictions
            });
        } catch (error) {
            // Ignore audio errors
        }
    }
}
