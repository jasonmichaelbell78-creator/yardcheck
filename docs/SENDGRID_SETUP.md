# SendGrid Setup Guide for YardCheck Email Notifications

This guide explains how to configure SendGrid for the email notification feature in YardCheck.

## Prerequisites

- A SendGrid account (free tier available at https://sendgrid.com/)
- Firebase CLI installed and configured
- Access to Firebase console for your project

## Step 1: Create a SendGrid Account

1. Go to https://sendgrid.com/
2. Sign up for a free account (free tier allows 100 emails/day)
3. Complete the account verification process

## Step 2: Create an API Key

1. Log in to your SendGrid dashboard
2. Navigate to **Settings** → **API Keys**
3. Click **Create API Key**
4. Give it a name like "YardCheck Email"
5. Select **Restricted Access**
6. Enable the following permissions:
   - **Mail Send** → Full Access
7. Click **Create & View**
8. Copy the API key (you won't be able to see it again!)

## Step 3: Verify a Sender

SendGrid requires you to verify the email address or domain you'll be sending from:

### Option A: Single Sender Verification (Quick start)
1. Go to **Settings** → **Sender Authentication**
2. Click **Verify a Single Sender**
3. Fill in the sender details
4. Check your email and click the verification link

### Option B: Domain Authentication (Recommended for production)
1. Go to **Settings** → **Sender Authentication**
2. Click **Authenticate Your Domain**
3. Follow the steps to add DNS records to your domain
4. Wait for DNS propagation (can take up to 48 hours)

## Step 4: Configure Firebase Secret

Store the SendGrid API key as a Firebase secret:

```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Set the SendGrid API key as a secret
firebase functions:secrets:set SENDGRID_API_KEY

# When prompted, paste your SendGrid API key
```

## Step 5: Deploy Cloud Functions

```bash
# Navigate to functions directory
cd functions

# Install dependencies
npm install

# Deploy functions
npm run deploy
```

## Step 6: Verify Setup

1. Open the YardCheck app
2. Go to Admin → Email Recipients
3. Add a test recipient
4. Complete an inspection with defects
5. Use the Email Report feature to send a test email

## Troubleshooting

### Email not sending
- Check Firebase Functions logs for errors
- Verify the SendGrid API key is correctly set
- Ensure the sender email is verified in SendGrid

### "Unauthorized" errors
- Regenerate the API key in SendGrid
- Update the Firebase secret with the new key

### Emails going to spam
- Complete domain authentication in SendGrid
- Ensure the from email matches a verified sender/domain

## Environment Variables

The Cloud Function uses the following secret:

| Secret Name | Description |
|-------------|-------------|
| `SENDGRID_API_KEY` | Your SendGrid API key with Mail Send permissions |

## Email Limits

| Plan | Daily Limit | Monthly Limit |
|------|-------------|---------------|
| Free | 100 emails/day | Forever free |
| Essentials | 50,000/month | Starts at $19.95/mo |
| Pro | 100,000+/month | Starts at $89.95/mo |

## Security Notes

- Never commit API keys to source code
- Use Firebase Secrets for sensitive configuration
- The API key should only have Mail Send permissions
- Regularly rotate API keys for security

## Support

For issues with:
- **SendGrid**: https://support.sendgrid.com/
- **Firebase Functions**: https://firebase.google.com/support
- **YardCheck**: Contact your administrator
