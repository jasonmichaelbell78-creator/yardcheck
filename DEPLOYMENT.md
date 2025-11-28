# Email Function Deployment Guide

This guide will help you deploy the email feature for YardCheck inspection reports. Follow each step carefully.

## Step 1: Create a SendGrid Account

1. Go to [https://sendgrid.com/](https://sendgrid.com/)
2. Click **Start for Free**
3. Fill in your email, password, and other details
4. Verify your email address (check your inbox for a verification email)

## Step 2: Get Your SendGrid API Key

1. After logging in, click **Settings** in the left menu
2. Click **API Keys**
3. Click **Create API Key**
4. Give it a name like `YardCheck`
5. Select **Restricted Access**
6. Scroll down and find **Mail Send** - click it and select **Full Access**
7. Click **Create & View**
8. **IMPORTANT:** Copy the API key now and save it somewhere safe - you won't be able to see it again!

## Step 3: Verify a Sender Email

Before SendGrid will send emails, you need to verify who the emails come from:

1. In SendGrid, click **Settings** in the left menu
2. Click **Sender Authentication**
3. Click **Verify a Single Sender**
4. Fill in:
   - **From Name:** YardCheck (or your company name)
   - **From Email:** Your email address (this will be the "from" address on emails)
   - Fill in the other required fields
5. Click **Create**
6. Check your email and click the verification link

## Step 4: Install Firebase CLI

If you already have Firebase CLI installed, skip to Step 5.

### On Windows:
1. Open Command Prompt
2. Run: `npm install -g firebase-tools`

### On Mac:
1. Open Terminal
2. Run: `npm install -g firebase-tools`

## Step 5: Log in to Firebase

1. Open Terminal (Mac) or Command Prompt (Windows)
2. Run: `firebase login`
3. A browser window will open - log in with your Google account that has access to the Firebase project

## Step 6: Navigate to Your Project

1. Open Terminal (Mac) or Command Prompt (Windows)
2. Navigate to your YardCheck project folder:
   ```
   cd path/to/yardcheck
   ```
   (Replace `path/to/yardcheck` with the actual path to your project)

## Step 7: Set the SendGrid API Key Secret

Run this command, replacing `YOUR_API_KEY` with the API key you saved in Step 2:

```
firebase functions:secrets:set SENDGRID_API_KEY
```

When prompted, paste your SendGrid API key and press Enter.

## Step 8: Deploy the Functions

Run this command:

```
firebase deploy --only functions
```

Wait for the deployment to complete. You should see a message like:
```
✔ Deploy complete!
```

## Step 9: Verify the Deployment

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your YardCheck project
3. Click **Functions** in the left menu
4. You should see `sendInspectionEmail` in the list

## Troubleshooting

### "Permission denied" error
- Make sure you're logged in with the correct Google account
- Run `firebase login` again

### "Project not found" error
- Run `firebase use --add` and select your project

### Emails not sending
- Check that your SendGrid sender email is verified
- Make sure the API key has Mail Send access
- Check the Firebase Functions logs for error messages:
  1. Go to Firebase Console > Functions
  2. Click on `sendInspectionEmail`
  3. Click **Logs** tab

### "Function deployment failed" error
- Make sure you're in the project root folder (where `firebase.json` is located)
- Try running `npm install` in the `functions` folder first:
  ```
  cd functions
  npm install
  cd ..
  firebase deploy --only functions
  ```

## Optional: Change the "From" Email Address

By default, emails are sent from `noreply@yardcheck.app`. To use a different email address:

```
firebase functions:config:set from_email="your-email@example.com"
```

Then redeploy:
```
firebase deploy --only functions
```

**Note:** The email address must be verified in SendGrid (Step 3).
