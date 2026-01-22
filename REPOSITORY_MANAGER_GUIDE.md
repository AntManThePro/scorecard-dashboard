# GitHub Repository Privacy Management - Usage Guide

## Overview
This feature allows you to manage the privacy settings of your GitHub repositories directly from the scorecard dashboard.

## Getting Started

### Step 1: Create a GitHub Personal Access Token
1. Go to https://github.com/settings/tokens/new
2. Give your token a descriptive name (e.g., "Scorecard Dashboard Access")
3. Select the following scope:
   - ✅ **repo** (Full control of private repositories)
4. Click "Generate token"
5. **Important**: Copy your token immediately - you won't be able to see it again!

### Step 2: Access the Repository Manager
1. Open the scorecard dashboard
2. Click the **"🔒 Manage Repositories"** button in the header
3. You'll be taken to the Repository Manager page

### Step 3: Authenticate
1. Paste your GitHub Personal Access Token into the password field
2. Click **"Load My Repositories"**
3. Your token is stored in sessionStorage (cleared when you close the browser)

### Step 4: Manage Repository Privacy

#### Make All Repositories Private (Bulk Operation)
1. After loading your repositories, click **"Make All Public Repositories Private"**
2. Review the confirmation dialog showing which repositories will be affected
3. Click "OK" to proceed
4. The system will update each repository with a small delay to respect GitHub's rate limits
5. Progress will be shown as each repository is updated

#### Make Individual Repositories Private
1. Browse through your repository list
2. Public repositories are shown with an orange badge and "Make Private" button
3. Private repositories are shown with a green badge and checkmark
4. Click **"Make Private"** on any public repository
5. Confirm the action
6. The repository will be updated immediately

## Features

### Visual Indicators
- **Green Background**: Repository is private ✓
- **Orange Background**: Repository is public
- **Repository Count**: Shows total, public, and private counts

### Security
- Tokens are stored in sessionStorage (cleared when browser closes)
- All communication uses HTTPS with GitHub's API
- No tokens are sent to third-party services

### Rate Limiting
- The system includes automatic delays between bulk operations
- This prevents hitting GitHub's API rate limits
- Default delay: 500ms between requests

## Troubleshooting

### "Authentication failed" Error
- Check that your token is valid and not expired
- Ensure the token has the `repo` scope enabled
- Try generating a new token

### "Failed to update repository" Error
- Verify you have admin access to the repository
- Check that the repository exists and you own it
- Ensure your token hasn't been revoked

### Repositories Not Loading
- Check your internet connection
- Verify your GitHub token is correct
- Look at the browser console for detailed error messages

## Important Notes

1. **Token Security**: Never share your GitHub Personal Access Token
2. **Permissions**: You can only make private repositories that you own
3. **Organization Repos**: This tool only manages your personal repositories
4. **Reversibility**: You can make repositories public again through GitHub's web interface
5. **Rate Limits**: GitHub has API rate limits; bulk operations include delays to prevent hitting these limits

## Need Help?

If you encounter issues:
1. Check the browser console (F12) for detailed error messages
2. Verify your token permissions on GitHub
3. Ensure you're using a modern browser (Chrome, Firefox, Safari, Edge)

---

**Note**: This feature interacts with GitHub's API but does not store your token permanently. For maximum security, tokens are cleared when you close your browser.
