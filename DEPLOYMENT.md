# Deployment Guide

Get your Crew Performance Scorecard Dashboard live with a permanent, shareable URL. This guide provides step-by-step instructions for deploying to various platforms.

## 🎯 Quick Start

This is a static web application (HTML, CSS, and vanilla JavaScript) that requires no build process or server-side code. You can deploy it to any static hosting service.

---

## Option 1: GitHub Pages (Current Setup - Already Configured) ✅

Your repository is already configured to deploy to GitHub Pages automatically.

### Current Status
- **Automatic Deployment**: Enabled via GitHub Actions workflow
- **Trigger**: Deploys automatically on every push to the `main` branch
- **URL Pattern**: `https://[your-username].github.io/scorecard-dashboard`

### How It Works
1. Push changes to the `main` branch
2. GitHub Actions workflow (`.github/workflows/deploy.yml`) automatically triggers
3. Site deploys to GitHub Pages
4. Access your dashboard at the GitHub Pages URL

### Custom Domain (Optional)
1. Go to your repository **Settings** → **Pages**
2. Under "Custom domain", enter your domain (e.g., `dashboard.example.com`)
3. Update your domain's DNS records:
   - Add a `CNAME` record pointing to `[your-username].github.io`
4. Enable **Enforce HTTPS** after DNS propagation (usually 24-48 hours)

### Manual Deployment
If you need to manually trigger deployment:
1. Go to the **Actions** tab in your repository
2. Select the "Deploy static content to Pages" workflow
3. Click **Run workflow** → **Run workflow**

---

## Option 2: Deploy to Vercel (Recommended for Fast Deployment)

Vercel offers fast deployment with automatic HTTPS and global CDN.

### Method A: Via GitHub (Recommended)

1. **Sign up at [vercel.com](https://vercel.com)**
   - Use your GitHub account for easy integration

2. **Import Repository**
   - Click **"New Project"**
   - Select **"Import Git Repository"**
   - Choose `scorecard-dashboard` from your GitHub repositories
   - Click **"Import"**

3. **Configure Project**
   - **Framework Preset**: Select "Other" or "Static"
   - **Build Command**: Leave empty (no build required)
   - **Output Directory**: Leave as `.` (root directory)
   - **Install Command**: Leave empty

4. **Deploy**
   - Click **"Deploy"**
   - Vercel will deploy your site in ~30 seconds
   - You'll get a URL like: `https://scorecard-dashboard-[your-username].vercel.app`

5. **Automatic Updates**
   - Every push to `main` triggers a new deployment automatically
   - Pull requests get preview deployments

### Method B: Via Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Navigate to your project directory
cd /path/to/scorecard-dashboard

# Deploy
vercel

# For production deployment
vercel --prod
```

### Custom Domain on Vercel
1. Go to your project dashboard on Vercel
2. Navigate to **Settings** → **Domains**
3. Click **"Add"** and enter your domain
4. Follow the DNS configuration instructions provided
5. Vercel will automatically provision an SSL certificate

---

## Option 3: Deploy to Netlify

Netlify provides continuous deployment with a generous free tier.

### Method A: Via Git Integration

1. **Sign up at [netlify.com](https://netlify.com)**
   - Connect your GitHub account

2. **Create New Site**
   - Click **"Add new site"** → **"Import an existing project"**
   - Select **"GitHub"**
   - Choose your `scorecard-dashboard` repository

3. **Configure Build Settings**
   - **Build command**: Leave empty (no build required)
   - **Publish directory**: Leave as `.` or `/`
   - Click **"Deploy site"**

4. **Access Your Site**
   - Netlify generates a random URL: `https://random-name-123.netlify.app`
   - You can customize this in **Site settings** → **Change site name**

5. **Automatic Deployments**
   - Every push to `main` automatically deploys
   - Branch deploys and deploy previews available

### Method B: Drag and Drop

1. Go to [app.netlify.com/drop](https://app.netlify.com/drop)
2. Drag your project folder into the upload zone
3. Netlify instantly deploys your site
4. Get an instant URL: `https://[random-name].netlify.app`

### Method C: Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Navigate to your project directory
cd /path/to/scorecard-dashboard

# Login to Netlify
netlify login

# Initialize and deploy
netlify init

# For subsequent deployments
netlify deploy --prod
```

### Custom Domain on Netlify
1. Go to **Site settings** → **Domain management**
2. Click **"Add custom domain"**
3. Enter your domain name
4. Follow the DNS configuration instructions
5. Netlify auto-provisions SSL certificate via Let's Encrypt

---

## Option 4: Other Static Hosting Services

This application can be deployed to any static hosting service:

### Cloudflare Pages
1. Visit [pages.cloudflare.com](https://pages.cloudflare.com)
2. Connect your GitHub repository
3. Build command: (none)
4. Output directory: `.`
5. Deploy!

### Render
1. Visit [render.com](https://render.com)
2. Create a new **Static Site**
3. Connect your GitHub repository
4. Build command: (none)
5. Publish directory: `.`
6. Deploy!

### Azure Static Web Apps
1. Visit [portal.azure.com](https://portal.azure.com)
2. Create a new Static Web App
3. Connect to your GitHub repository
4. App location: `/`
5. Output location: `.`
6. Deploy!

---

## 🔧 Configuration Files

You may want to add configuration files for specific platforms:

### For Vercel (`vercel.json`)
```json
{
  "version": 2,
  "public": true,
  "cleanUrls": true
}
```

### For Netlify (`netlify.toml`)
```toml
[build]
  publish = "."
  
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

## 🌐 Custom Domain Setup (General Guide)

### DNS Configuration

For most hosting providers, you'll need to update your DNS records:

**For apex domain (example.com):**
- Add `A` records pointing to your provider's IP addresses
- Or add an `ALIAS` record (if supported)

**For subdomain (dashboard.example.com):**
- Add a `CNAME` record pointing to your hosting provider's URL

### SSL/HTTPS

All modern hosting platforms provide free SSL certificates:
- **GitHub Pages**: Automatic via Let's Encrypt
- **Vercel**: Automatic SSL for all domains
- **Netlify**: Automatic via Let's Encrypt
- **Cloudflare Pages**: Automatic via Cloudflare

---

## 🚀 Deployment Checklist

Before deploying, ensure:

- [ ] All local testing is complete
- [ ] Browser console shows no errors
- [ ] Application works in different browsers (Chrome, Firefox, Safari)
- [ ] Mobile responsiveness is tested
- [ ] All links and navigation work correctly
- [ ] localStorage functionality works as expected
- [ ] Charts render correctly
- [ ] Role-based access control functions properly

---

## 📊 Monitoring Your Deployment

### GitHub Pages
- Check deployment status: Repository **Actions** tab
- View deployment history: **Deployments** section

### Vercel
- Real-time deployment logs in dashboard
- Analytics available (page views, performance metrics)
- Error tracking with Vercel CLI

### Netlify
- Deployment logs in site dashboard
- Analytics on free tier (page views, bandwidth)
- Form submissions tracking (if using Netlify Forms)

---

## 🆘 Troubleshooting

### Site Not Loading
- **Check deployment status**: Ensure the deployment completed successfully
- **Clear browser cache**: Try hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
- **Check DNS propagation**: Use [whatsmydns.net](https://whatsmydns.net) for custom domains

### 404 Errors
- Ensure all file paths are relative
- Check that `index.html` is in the root directory
- Verify the publish directory is set correctly

### JavaScript Not Working
- Check browser console for errors
- Ensure all `.js` files are uploaded
- Verify file permissions are correct

### Data Not Persisting
- This app uses localStorage which is domain-specific
- Data won't transfer between different deployment URLs
- Ensure browser allows localStorage (not in private/incognito mode)

---

## 🎓 Best Practices

1. **Use Git Tags**: Tag releases for easy rollback
2. **Environment URLs**: Use different domains for staging/production
3. **Monitor Performance**: Use built-in analytics to track usage
4. **Regular Backups**: Export snapshots regularly for data backup
5. **Security**: Don't commit sensitive data or tokens to the repository

---

## 📞 Support

- **GitHub Issues**: Report bugs or request features
- **Documentation**: Refer to README.md for application usage
- **Platform Support**: 
  - Vercel: [vercel.com/support](https://vercel.com/support)
  - Netlify: [netlify.com/support](https://netlify.com/support)
  - GitHub Pages: [docs.github.com/pages](https://docs.github.com/pages)

---

## 🎉 Your Dashboard is Now Live!

Once deployed, your Crew Performance Scorecard Dashboard will be:
- ✅ Accessible 24/7 from anywhere
- ✅ Secured with HTTPS
- ✅ Optimized for performance with global CDN
- ✅ Automatically updated on every code push
- ✅ Mobile-friendly and responsive

Share your dashboard URL with your team and start tracking crew performance!
