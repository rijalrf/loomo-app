# Loomo

Loomo is a privacy-first visual feedback and collaboration platform. It allows users to capture screenshots, record browser tabs with audio, annotate images, and share them instantly. Unlike other services, Loomo respects your privacy and storage limits by storing all captured media directly in your own personal Google Drive.

---

## Key Features

- **Precision Screen Capture**: Capture specific page areas or elements with a pixel-perfect selector.
- **Interactive Annotation Editor**: Highlight issues and illustrate flows directly on captured screenshots using arrows, circles, boxes, highlighters, and text.
- **Tab Video Recording**: Record tab activity in real-time, complete with microphone audio.
- **Automatic Google Drive Sync**: Save screenshots and recordings directly to a secure folder in your personal Google Drive account.
- **Secure Share Links**: Share short links (`loomo.app/s/token`) with your team or clients. Loomo serves the media securely without exposing your raw Google Drive file URLs.
- **Workspace Collaboration**: Organize files into shared workspaces and manage file visibilities (Private, Restricted, or Public).

---

## Project Structure

The codebase is split into two primary workspaces:
- `/web`: The Next.js web application which handles authentication, database persistence, shared media viewer pages, workspaces, and the canvas-based annotation editor.
- `/extension`: The browser extension responsible for recording audio/video, injecting capture frames, and communicating with the web dashboard.

---

## Prerequisites

Before running Loomo, ensure you have:
- **Node.js** (v18 or higher recommended)
- **PostgreSQL** database (configured via Prisma connection string)
- **Google OAuth Credentials**: Credentials set up on Google Cloud Console with the `drive.file`, `email`, and `profile` OAuth scopes.

---

## Getting Started

### 1. Web Application Setup

1. Navigate to the `web` folder:
   ```bash
   cd web
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy and fill the `.env` environment variables:
   ```bash
   cp .env.example .env
   # Make sure to configure:
   # DATABASE_URL, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, NEXTAUTH_SECRET, etc.
   ```
4. Push the database schema:
   ```bash
   npx prisma db push
   ```
5. Run the development server:
   ```bash
   npm run dev
   ```

The web dashboard will be available at `http://localhost:3000`.

### 2. Browser Extension Installation

To install and run the extension locally in your web browser:
1. Open your browser and navigate to the Extensions management page (e.g., `chrome://extensions`).
2. Turn on the **Developer Mode** switch at the top right.
3. Click the **Load Unpacked** button at the top left.
4. Select the `extension` directory inside the project root folder.
5. The Loomo Extension icon should now appear in your browser's extension bar. You can pin it for easier access.

---

## Privacy Policy & Data Access

Loomo utilizes Google OAuth API to save files to your Google Drive. 
- Loomo strictly uses the **limited Drive access (`drive.file`)** scope.
- It can **only** read, write, and modify files that were created specifically by the Loomo app.
- Loomo **cannot** read, access, or delete any other files or folders in your Google Drive storage.
