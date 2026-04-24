# Smart Airport Management - Deployment Guide

This guide covers everything you need to deploy the Smart Airport Management platform.

## 1. Backend Deployment (FastAPI)

For production, we recommend deploying the FastAPI backend on **Render**, **Railway**, or **Heroku**.

1. **Environment Variables Required**:
   When setting up your host, make sure to add the exact variables from your `.env` file:
   - `SERVICENOW_INSTANCE` (e.g. `https://dev12345.service-now.com`)
   - `SERVICENOW_USERNAME`
   - `SERVICENOW_PASSWORD`
   - `GROQ_API_KEY` (Using the active `llama-3.1` model)
   - `EMAIL_SENDER` / `EMAIL_PASSWORD`

2. **Run Command**:
   Your hosting provider should run the following unified startup command:
   ```bash
   uvicorn main:app --host 0.0.0.0 --port $PORT
   ```

*Note: The backend now has a built-in **DB Fallback mechanism**. If your ServiceNow instance is missing the custom tables for "Assets" or "Preventive Schedules", the backend will gracefully supply in-memory data so your app never crashes in production.*

## 2. Mobile App Deployment (React Native / Expo)

Since the app is built with Expo, you can compile it into a standalone APK for Android, or an IPA for iOS using **Expo Application Services (EAS)**.

1. **Update your API Base URL**:
   Before you build the app, go to `mobile/src/services/api.ts` and change `BASE_URL` to your live hosted backend URL!
   ```javascript
   const BASE_URL = "https://your-live-backend.onrender.com/api";
   ```

2. **Build an Android APK**:
   ```bash
   cd mobile
   npm install -g eas-cli
   eas login
   eas build -p android --profile preview
   ```
   *This command will build your app and give you a direct download link for the `.apk` file which you can install on any Android phone.*

3. **Required App Permissions**:
   The QR Scanner will automatically request `Camera` permissions upon clicking "Open Camera". No extra config required.

## 3. WhatsApp Integration Notes

If you want the WhatsApp notifications to run in production, you'll need to deploy **WAHA (WhatsApp HTTP API)** using Docker.
```bash
docker run -p 3000:3000 maxmtzx/waha
```
Then, update your backend's `.env` variable `WAHA_URL` to point to the server where the WAHA docker container is running. If not connected, the app simply ignores the notification send rather than crashing!
