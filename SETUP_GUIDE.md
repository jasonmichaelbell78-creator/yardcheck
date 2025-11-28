# YardCheck Email Setup Guide

This guide explains how to set up the email feature for YardCheck. Follow these steps in order to enable sending inspection reports via email.

---

## Part A: Get Your Firebase Service Account Key

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your YardCheck project
3. Click the **gear icon** (⚙️) next to "Project Overview" and select **Project Settings**
4. Click on the **Service Accounts** tab
5. Click the **"Generate new private key"** button
6. Click **"Generate key"** in the confirmation popup
7. A JSON file will download to your computer - **save this file, you'll need its contents in Part D**

---

## Part B: Get Your SendGrid API Key

1. Go to [https://signup.sendgrid.com/](https://signup.sendgrid.com/) and create a free account (or log in if you already have one)
2. Verify your email address when prompted
3. Once logged in, click **Settings** in the left sidebar
4. Click **API Keys**
5. Click the **"Create API Key"** button
6. Name your key **"YardCheck"**
7. Select **"Full Access"** for permissions
8. Click **"Create & View"**
9. **IMPORTANT:** Copy the API key immediately and save it somewhere safe - **it will only be shown once!**

---

## Part C: Verify a Sender Email in SendGrid

SendGrid requires you to verify the email address that will appear as the "From" address on your emails.

1. In SendGrid, click **Settings** in the left sidebar
2. Click **Sender Authentication**
3. Choose one of these options:

   **Option 1: Single Sender Verification (Easiest)**
   - Click **"Verify a Single Sender"**
   - Fill in your name and the email address you want to send from
   - Click **"Create"**
   - Check your email inbox and click the verification link

   **Option 2: Domain Authentication (For businesses)**
   - Click **"Authenticate Your Domain"**
   - Follow the steps to add DNS records to your domain

4. **Remember the email address you verified** - you'll need it in Part D

---

## Part D: Add Secrets to Your GitHub Repository

Now you need to add these credentials as secrets in your GitHub repository.

1. Go to your YardCheck repository on GitHub
2. Click the **Settings** tab (at the top of the repository)
3. In the left sidebar, click **Secrets and variables**
4. Click **Actions**
5. Click the **"New repository secret"** button

Add these three secrets one at a time:

### Secret 1: FIREBASE_SERVICE_ACCOUNT
- **Name:** `FIREBASE_SERVICE_ACCOUNT`
- **Value:** Open the JSON file you downloaded in Part A with a text editor, copy the **entire contents**, and paste it here

### Secret 2: SENDGRID_API_KEY
- **Name:** `SENDGRID_API_KEY`
- **Value:** Paste the API key you copied in Part B

### Secret 3: FROM_EMAIL
- **Name:** `FROM_EMAIL`
- **Value:** Enter the verified sender email address from Part C

---

## Part E: Trigger the Deployment

The email feature will be activated when the deployment workflow runs.

1. **Option A: Make a small change**
   - Edit any file in your repository (even just adding a space to README.md)
   - Commit the change to the `main` branch
   - The deployment will start automatically

2. **Option B: Manually run the workflow**
   - Go to the **Actions** tab in your GitHub repository
   - Click on **"Deploy to Firebase"** in the left sidebar
   - Click the **"Run workflow"** button on the right
   - Select the `main` branch and click **"Run workflow"**

3. **Check the progress**
   - Click on the running workflow to see its progress
   - Wait for all steps to complete (usually takes 2-3 minutes)
   - If everything is green ✅, the email feature is now active!

---

## Troubleshooting

### "SendGrid API key not configured" error
- Make sure you added the `SENDGRID_API_KEY` secret correctly in Part D
- Try re-running the deployment workflow

### "The sender email address is not verified" error
- Make sure you completed Part C to verify your sender email
- Make sure the `FROM_EMAIL` secret matches exactly the email you verified
- Check your email inbox for the verification email from SendGrid

### "SendGrid API key is invalid" error
- The API key might have been copied incorrectly
- Try creating a new API key in SendGrid and updating the `SENDGRID_API_KEY` secret

### Deployment failed
- Check that the `FIREBASE_SERVICE_ACCOUNT` secret contains the full JSON file contents
- Make sure there are no extra spaces or line breaks at the beginning or end

---

## Need Help?

If you're still having issues, please:
1. Check the Actions tab for specific error messages
2. Create an issue in the GitHub repository with the error details
