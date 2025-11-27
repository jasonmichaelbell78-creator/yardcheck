# SendGrid Setup Guide for YardCheck Email Notifications

This guide explains how to set up SendGrid for the email notification feature in YardCheck.

## Prerequisites

1. A SendGrid account (free tier available at https://sendgrid.com)
2. Firebase CLI installed and configured
3. Your Firebase project set up

## Step 1: Create a SendGrid Account

1. Go to https://sendgrid.com and sign up for an account
2. Complete the email verification process
3. Complete the sender identity verification (required for sending emails)

## Step 2: Create an API Key

1. Log in to your SendGrid dashboard
2. Navigate to **Settings** → **API Keys**
3. Click **Create API Key**
4. Give it a name like "YardCheck Email"
5. Select **Restricted Access** and enable:
   - **Mail Send** → Full Access
6. Click **Create & View**
7. **Important**: Copy the API key immediately - you won't be able to see it again!

## Step 3: Verify a Sender Identity

SendGrid requires you to verify the sender identity before sending emails.

### Option A: Single Sender Verification (Easier for development)
1. Go to **Settings** → **Sender Authentication**
2. Click **Verify a Single Sender**
3. Fill in the sender details (use an email you have access to)
4. Click the verification link in the email you receive

### Option B: Domain Authentication (Recommended for production)
1. Go to **Settings** → **Sender Authentication**
2. Click **Authenticate Your Domain**
3. Follow the DNS setup instructions for your domain
4. This allows you to send from any email address on your domain

## Step 4: Configure Firebase Secret

Store the SendGrid API key as a Firebase secret:

```bash
# Navigate to the functions directory
cd functions

# Set the secret (you'll be prompted to enter the API key)
firebase functions:secrets:set SENDGRID_API_KEY

# When prompted, paste your SendGrid API key
```

The secret will be securely stored and made available to your Cloud Functions.

## Step 5: Update the From Email Address

In `functions/src/index.ts`, update the `fromEmail` variable to use your verified sender email:

```typescript
let fromEmail = 'your-verified-email@yourdomain.com';
```

## Step 6: Deploy the Functions

```bash
# From the functions directory
npm install
npm run build
firebase deploy --only functions
```

## Troubleshooting

### "Sender identity not verified"
- Make sure you've completed the sender verification in SendGrid
- The `fromEmail` address must match your verified sender

### "API key not found"
- Ensure you've set the secret correctly: `firebase functions:secrets:set SENDGRID_API_KEY`
- Verify the secret is listed: `firebase functions:secrets:access SENDGRID_API_KEY`

### "Permission denied"
- Check that your API key has "Mail Send" permissions enabled

### Emails not being received
1. Check the SendGrid **Activity** dashboard for delivery status
2. Check spam/junk folders
3. Verify recipient email addresses are correct
4. Check Firebase Functions logs: `firebase functions:log`

## GitHub Actions Deployment

If you're using GitHub Actions for CI/CD, you'll need to add the SendGrid API key as a GitHub secret:

1. Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Name: `SENDGRID_API_KEY`
4. Value: Your SendGrid API key
5. Click **Add secret**

Then update your GitHub Actions workflow to set the Firebase secret during deployment:

```yaml
- name: Deploy Cloud Functions
  run: |
    cd functions
    npm install
    npm run build
    firebase deploy --only functions
  env:
    FIREBASE_TOKEN: ${{ secrets.FIREBASE_TOKEN }}
    SENDGRID_API_KEY: ${{ secrets.SENDGRID_API_KEY }}
```

## Cost Considerations

- SendGrid Free Tier: 100 emails/day forever
- For higher volumes, consider upgrading to a paid plan

## Security Best Practices

1. **Never commit API keys** to source control
2. Use **Firebase secrets** for storing sensitive keys
3. Set appropriate **rate limits** on your Cloud Functions
4. Monitor SendGrid **Activity** for suspicious usage
5. Rotate API keys periodically

## Support

For SendGrid-specific issues, refer to:
- SendGrid Documentation: https://docs.sendgrid.com
- SendGrid Support: https://support.sendgrid.com

For Firebase-specific issues:
- Firebase Documentation: https://firebase.google.com/docs
- Firebase Support: https://firebase.google.com/support
