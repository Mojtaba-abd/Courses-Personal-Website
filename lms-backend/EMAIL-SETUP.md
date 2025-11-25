# Email Configuration Guide

This guide will help you set up Gmail to send emails from your application (contact form and course access requests).

## Step 1: Enable 2-Step Verification

1. Go to your [Google Account](https://myaccount.google.com/)
2. Click on **Security** in the left sidebar
3. Under "Signing in to Google", find **2-Step Verification**
4. Click **Get started** and follow the prompts to enable it

## Step 2: Generate App Password

1. After enabling 2-Step Verification, go to [App Passwords](https://myaccount.google.com/apppasswords)
   - Or navigate: Google Account → Security → 2-Step Verification → App passwords
2. Select **Mail** as the app
3. Select **Other (Custom name)** as the device
4. Enter a name like "LMS Backend" and click **Generate**
5. Google will show you a **16-character password** (looks like: `abcd efgh ijkl mnop`)
6. **Copy this password** - you won't be able to see it again!

## Step 3: Add to .env File

1. Open or create `.env` file in the `lms-backend` directory
2. Add these two lines:

```env
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=abcdefghijklmnop
```

**Important:**
- Use your **full Gmail address** (e.g., `john.doe@gmail.com`)
- Use the **16-character app password** (remove spaces if any)
- Do NOT use your regular Gmail password

## Step 4: Restart Backend Server

After adding the credentials, restart your backend server:

```bash
cd lms-backend
npm run dev
```

## Testing

1. **Contact Form**: Submit a message through the contact form
2. **Course Access Request**: Request access to a course
3. Check your Gmail inbox - you should receive the notification emails

## Troubleshooting

### Error: "Email service not configured"
- Make sure both `GMAIL_USER` and `GMAIL_APP_PASSWORD` are in your `.env` file
- Restart the backend server after adding credentials
- Check that there are no extra spaces or quotes in the `.env` file

### Error: "Invalid login credentials"
- Make sure you're using the **App Password**, not your regular Gmail password
- Verify the app password was generated correctly
- Try generating a new app password

### Error: "Less secure app access"
- You don't need to enable "Less secure app access" - App Passwords are the secure way
- Make sure 2-Step Verification is enabled

### No emails received
- Check your spam folder
- Verify the `GMAIL_USER` email address is correct
- Check backend console logs for any error messages

## Notes

- The emails will be sent **to yourself** (the GMAIL_USER address)
- The **reply-to** field is set to the user's email, so you can reply directly
- If email fails, the request is still saved to the database (for course access requests)
- Contact form requires email to be configured (will return error if not configured)

