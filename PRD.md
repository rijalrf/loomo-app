# Product Requirements Document (PRD): Loomo

**Tagline:** Show, don't just tell.
**Version:** 3.0
**Last Updated:** 2026-06-16
**Status:** Draft
**Owner:** Rijal

---

## 1. Overview

### 1.1 Product Summary

Loomo is a platform consisting of a **Google Chrome Extension** and a **Next.js Web Application** designed to simplify how users capture, annotate, and share visual representations of their work. Users can take area screenshots with annotations and record their active browser tab. All captures are **asynchronously uploaded to the user's own Google Drive** and managed through a centralized web dashboard.

### 1.2 Problem Statement

Teams and individuals struggle to communicate visual feedback efficiently. Taking screenshots, annotating them, uploading to a shared location, and managing access is a fragmented workflow involving multiple disconnected tools.

### 1.3 Target Users

| Persona                    | Description                                                                              |
| -------------------------- | ---------------------------------------------------------------------------------------- |
| **Individual Contributor** | Developers, designers, QA testers who need to capture and share visual feedback quickly. |
| **Team Lead / PM**         | Managers who need to review visual reports from team members in a centralized dashboard. |
| **Remote Collaborator**    | Distributed team members who rely on async visual communication.                         |

### 1.4 Success Metrics

| Metric ID | Metric                                    | Target       |
| --------- | ----------------------------------------- | ------------ |
| `KPI-001` | Time from capture to shareable link       | < 10 seconds |
| `KPI-002` | Average upload success rate               | > 99%        |
| `KPI-003` | User retention (7-day)                    | > 40%        |
| `KPI-004` | Average captures per active user per week | > 5          |

---

## 2. Scope

### 2.1 In Scope

- Chrome Extension for area capture and tab recording.
- Web application for media management, annotation editing, and team collaboration.
- User authentication via **Google OAuth 2.0** (Google Account sign-in).
- Media upload to **user's own Google Drive** (async, background process).
- Media sharing with privacy controls and shareable links.

### 2.2 Out of Scope

- Mobile application (iOS/Android).
- Extensions for browsers other than Chrome (Firefox, Safari, Edge).
- Real-time collaborative editing (simultaneous multi-user annotation).
- Offline mode / local-only storage.
- Third-party integrations (Slack, Jira, Notion, etc.) — deferred to v2.

---

## 3. System Architecture

### 3.1 High-Level Components

```text
┌─────────────────────┐       ┌──────────────────────────────────┐
│  Chrome Extension    │──────▶│  Next.js App (App Router)        │
│  (Capture Client)    │       │  ┌────────────────────────────┐  │
│                      │       │  │ Frontend (React/SSR)       │  │
│  - Area Capture      │       │  │ - Landing Page             │  │
│  - Tab Recording     │       │  │ - Google OAuth Login       │  │
│  - Google OAuth Sync │       │  │ - Workplace Dashboard      │  │
└─────────────────────┘       │  │ - Preview Editor           │  │
                               │  └────────────────────────────┘  │
                               │  ┌────────────────────────────┐  │
                               │  │ Backend (Route Handlers)   │  │
                               │  │ - REST API                 │  │
                               │  │ - Google OAuth Handler     │  │
                               │  │ - Async Upload Queue       │  │
                               │  └────────────────────────────┘  │
                               └──────────┬──────────┬────────────┘
                                          │          │
                          ┌───────────────┘          └──────────────┐
                          ▼                                         ▼
                   ┌─────────────┐                      ┌───────────────────┐
                   │ PostgreSQL  │                      │ Google Drive API  │
                   │ (External)  │                      │ (per-user Drive)  │
                   │ - Users     │                      │                   │
                   │ - Metadata  │                      │ Files uploaded to │
                   │ - Tokens    │                      │ each user's own   │
                   │ - Jobs      │                      │ Google Drive      │
                   └─────────────┘                      └───────────────────┘
```

### 3.2 Async Upload Architecture

Media upload to Google Drive is **fully automatic**. Files are temporarily stored on the Loomo server, then a **Job Scheduler** picks them up and uploads to the user's Google Drive in the background. Media is **only viewable after it has been successfully uploaded to Google Drive**. Temp files on the server are **deleted only after confirmed successful upload**.

**Loomo = Wrapper/Viewer.** Loomo does not permanently store any media files. All media is served from Google Drive. Loomo acts as a branded viewer layer on top of Google Drive.

```text
User saves media (Editor / Recording Stop)
        │
        ▼
┌─────────────────────────────────────────┐
│  POST /api/media/upload                 │
│  - Receives file as multipart/blob      │
│  - Saves file to server temp storage    │
│  - Creates Media record in DB           │
│    (upload_status: "processing")        │
│  - Returns immediately with { mediaId } │
│  - User is redirected to dashboard      │
└─────────────────────────────────────────┘
        │
        │  Media card appears on dashboard
        │  with "Processing..." state
        │  (thumbnail placeholder, not yet
        │   viewable/playable/shareable)
        │
        ▼  (Job Scheduler runs in background...)
┌─────────────────────────────────────────┐
│  Job Scheduler (runs periodically)      │
│  - Polls DB for media with              │
│    upload_status = "processing" or      │
│    "failed" (with retries remaining)    │
│  - For each pending media:              │
│    1. Set upload_status → "uploading"   │
│    2. Read file from server temp        │
│    3. Upload to user's Google Drive     │
│       via Drive API v3                  │
│    4. Store drive_file_id,              │
│       drive_view_url in DB              │
│    5. Set upload_status → "ready"       │
│    6. DELETE temp file from server      │
│  - On failure:                          │
│    - Increment retry count              │
│    - Set upload_status → "failed"       │
│    - Will be retried on next scheduler  │
│      run (max 5 retries with backoff)   │
│    - Temp file is KEPT until success    │
│  - All retries are automatic and silent │
└─────────────────────────────────────────┘
        │
        │  Once upload_status = "ready":
        │  ✓ Media card shows thumbnail
        │  ✓ User can view/play via Loomo viewer
        │  ✓ User can share via Loomo link
        │  ✓ Temp file is deleted from server
        ▼
┌─────────────────────────────────────────┐
│  Media Serving (Loomo = Wrapper)        │
│  - All media is served FROM Google      │
│    Drive, proxied through Loomo server  │
│  - Loomo fetches via Drive API using    │
│    user's stored access_token           │
│  - Client always sees Loomo URLs        │
│  - Google Drive URLs are never exposed  │
└─────────────────────────────────────────┘
```

**Key Design Principles:**

1. **Loomo = wrapper only.** No permanent file storage on the Loomo server.
2. **Temp files kept until Drive success.** Server temp is the safety net; only deleted after confirmed upload.
3. **Media not viewable during processing.** Dashboard shows "Processing..." placeholder until Drive upload completes.
4. **All media served from Google Drive** via Loomo proxy (branded URLs).

### 3.3 Tech Stack

| Layer           | Technology                             | Notes                                                               |
| --------------- | -------------------------------------- | ------------------------------------------------------------------- |
| Capture Client  | Chrome Extension (Manifest V3)         | `chrome.tabCapture`, `chrome.desktopCapture` APIs                   |
| Frontend        | Next.js (App Router), React            | SSR + CSR hybrid                                                    |
| Backend API     | Next.js Route Handlers                 | REST endpoints                                                      |
| Database        | PostgreSQL (external, outside Docker)  | User data, media metadata, OAuth tokens, upload job queue           |
| File Storage    | **Google Drive** (per-user)            | Permanent storage. Loomo server only holds temp files during upload |
| Deployment      | Docker containers                      | Next.js app containerized                                           |
| Authentication  | **Google OAuth 2.0**                   | Via `client_secret_devnote.json`, NextAuth.js or custom handler     |
| Background Jobs | Server-side queue (in-process or Bull) | Async upload workers, retry logic                                   |

### 3.4 Google Drive Integration Details

| Config              | Value                                                                      |
| ------------------- | -------------------------------------------------------------------------- |
| OAuth Client Config | `client_secret_devnote.json`                                               |
| Project ID          | `jam-report`                                                               |
| OAuth Scopes        | `openid`, `email`, `profile`, `https://www.googleapis.com/auth/drive.file` |
| Drive API Version   | v3                                                                         |
| Loomo Folder Name   | `Loomo` (auto-created in user's Drive root)                                |
| Subfolder Structure | `Loomo/Screenshots/`, `Loomo/Recordings/`                                  |
| Token Storage       | `access_token` + `refresh_token` encrypted in PostgreSQL                   |
| Token Refresh       | Automatic via `refresh_token` when `access_token` expires                  |

> **Note:** The scope `drive.file` only grants access to files created by Loomo, NOT the user's entire Drive. This is the least-privilege approach.

### 3.5 Data Model

```plan
┌────────────────────┐     ┌──────────────┐     ┌──────────────────────┐
│       User          │     │  Workspace   │     │       Media          │
├────────────────────┤     ├──────────────┤     ├──────────────────────┤
│ id (PK)            │◄───┐│ id (PK)      │◄───┐│ id (PK)              │
│ google_id (unique) │    ││ name         │    ││ workspace_id (FK)    │
│ email              │    ││ created_by   │────┘│ uploaded_by (FK)     │
│ display_name       │    ││ created_at   │     │ title                │
│ avatar_url         │    │└──────────────┘     │ type (enum)          │
│ access_token (enc) │    │                     │   screenshot         │
│ refresh_token (enc)│    │                     │   recording          │
│ token_expires_at   │    │                     │ drive_file_id        │
│ created_at         │    │                     │ drive_thumbnail_url  │
│ updated_at         │    │                     │ file_size_bytes      │
└────────────────────┘    │                     │ mime_type            │
                          │                     │ share_token          │
┌──────────────────┐      │                     │ visibility (enum)    │
│ WorkspaceMember  │      │                     │   private            │
├──────────────────┤      │                     │   unlisted           │
│ id (PK)         │      │                     │   workspace_only     │
│ workspace_id(FK)│──────┘                     │ upload_status (enum) │
│ user_id (FK)   │                             │   processing         │
│ role (enum)     │                             │   uploading          │
│   owner         │                             │   ready              │
│   member        │                             │   failed             │
│ invited_at      │                             │   deleting           │
│ accepted_at     │                             │ upload_retries       │
└──────────────────┘                            │ duration_seconds     │
                                                │ width                │
                                                │ height               │
┌──────────────────┐                            │ created_at           │
│  BackgroundJob   │                            │ deleted_at           │
├──────────────────┤                            └──────────────────────┘
│ id (PK)          │
│ media_id (FK)    │
│ user_id (FK)     │
│ job_type (enum)  │
│   upload         │
│   delete         │
│ status (enum)    │
│   queued         │
│   running        │
│   completed      │
│   failed         │
│ temp_file_path   │  (for upload jobs)
│ error_message    │
│ attempts         │
│ max_attempts (5) │
│ created_at       │
│ started_at       │
│ completed_at     │
└──────────────────┘
```

> **Key changes:**
>
> - `title` field added (user-editable media name).
> - `drive_thumbnail_url` replaces `drive_view_url` / `drive_download_url` (thumbnail fetched from Drive API).
> - `upload_status` now includes `"deleting"` state for async Drive deletion.
> - `UploadJob` renamed to `BackgroundJob` with `job_type` enum (`upload` | `delete`) to handle both async upload and async delete via the same job scheduler.

---

## 4. Functional Requirements

### 4.1 Chrome Extension

#### `FR-EXT-001` Integrated Authentication (Google OAuth)

**Priority:** Must Have
**User Story:** As a user, I want to sign in with my Google account from the Chrome Extension so that my captures are linked to my account and can be uploaded to my Google Drive.

**Description:**
The extension syncs with the Next.js web application session. If no active session is detected, it initiates Google OAuth sign-in flow. The OAuth flow requests `drive.file` scope so Loomo can upload captures to the user's Google Drive.

**Acceptance Criteria:**

- [ ] Extension detects active web app session via shared cookie/token.
- [ ] If no session exists, extension shows "Sign in with Google" button.
- [ ] Clicking the button initiates Google OAuth 2.0 flow (using `chrome.identity` API or redirect to web app OAuth).
- [ ] OAuth requests scopes: `openid`, `email`, `profile`, `drive.file`.
- [ ] On first login, user sees Google consent screen explaining Drive access.
- [ ] After successful login, extension UI shows user's Google avatar + name.
- [ ] Login errors display clear error messages (cancelled, network error, scope denied).
- [ ] If user denies `drive.file` scope: login succeeds but upload is disabled, with a banner prompting to grant permission.
- [ ] Logout from extension clears session on both extension and web app.

---

#### `FR-EXT-002` Area Capture

**Priority:** Must Have
**User Story:** As a user, I want to select and capture a specific area of a web page so that I only share the relevant portion.

**Description:**
A crosshair overlay tool allows the user to click-and-drag to select a rectangular region on the current web page. The selected area is captured as an image.

**Acceptance Criteria:**

- [ ] Clicking "Capture" activates a full-page crosshair overlay.
- [ ] User can click-and-drag to define a rectangular selection.
- [ ] Selection can be cancelled with `Escape` key.
- [ ] Captured image includes only the selected region at screen resolution.
- [ ] Captured image is stored temporarily in memory (NOT uploaded yet).
- [ ] After capture, system opens Preview Editor in a new tab (see `FR-EXT-005`).

**Constraints:**

- Maximum capture resolution: viewport DPI × selected area pixels.
- Must handle pages with scrollable content within the visible viewport.

---

#### `FR-EXT-003` Active Tab Recording (Screen Recording)

**Priority:** Must Have
**User Story:** As a user, I want to record my active browser tab with audio so that I can create walkthroughs and demos.

**Description:**
Records the active browser tab along with optional audio input (microphone and/or system audio). Output is saved in a web-standard video format.

**Acceptance Criteria:**

- [ ] User can select audio source: microphone, system audio, both, or none.
- [ ] Recording captures the active tab's visual content.
- [ ] Output format is WebM (VP8/VP9 + Opus) or MP4.
- [ ] Recording automatically stops if the tab is closed.
- [ ] Recording file is automatically saved to the server after stop (upload to Drive happens invisibly in background).

**Constraints:**

- Maximum recording duration: **30 minutes** (configurable).
- Maximum file size: **500 MB**.
- Target memory usage during recording: < **200 MB** additional RAM.

---

#### `FR-EXT-004` Recording Controls

**Priority:** Must Have
**User Story:** As a user, I want to pause, resume, and stop my recording so that I have control over the output.

**Description:**
A floating control bar appears during recording with action buttons.

**Acceptance Criteria:**

- [ ] Control bar displays: Start, Pause, Resume, Stop buttons.
- [ ] Pause freezes the recording; Resume continues from the pause point.
- [ ] Stop finalizes the recording and saves to server (Drive sync happens automatically in background).
- [ ] Recording timer is visible showing elapsed time.
- [ ] Control bar does NOT appear in the recorded output.

---

#### `FR-EXT-005` Transition to Preview Editor

**Priority:** Must Have
**User Story:** As a user, I want to annotate my screenshot before uploading so that I can add context.

**Description:**
After an area capture is completed, the raw image is NOT uploaded immediately. Instead, the extension opens a new browser tab navigating to the Preview Editor page in the web application, passing the image data for annotation.

**Acceptance Criteria:**

- [ ] New tab opens with URL: `{WEB_APP_URL}/editor?source=extension`.
- [ ] Image data is passed to the editor (via `chrome.storage.local` or base64 URL parameter).
- [ ] Editor loads and displays the captured image within 2 seconds.
- [ ] If the editor tab is closed without saving, the capture is discarded (no orphan data).

---

### 4.2 Preview Editor (Image Annotation Tool)

#### `FR-EDIT-001` Shape Annotations

**Priority:** Must Have

**Description:**
Users can insert geometric shapes to annotate specific areas of the image.

**Supported Shapes:**

| Shape            | Behavior                                                |
| ---------------- | ------------------------------------------------------- |
| Rectangle        | Click-and-drag to draw. Resizable via corner handles.   |
| Circle / Ellipse | Click-and-drag to draw. Resizable.                      |
| Arrow            | Click start point, drag to end point. Directional head. |

**Acceptance Criteria:**

- [ ] Each shape type can be selected from a toolbar.
- [ ] Shapes are rendered as vector overlays on the canvas.
- [ ] Shapes can be moved, resized, and deleted after placement.
- [ ] Multiple shapes can coexist on the same canvas.

---

#### `FR-EDIT-002` Color Customization

**Priority:** Must Have

**Description:**
Users can select stroke and fill colors for annotation shapes.

**Acceptance Criteria:**

- [ ] Color picker supports: stroke color and fill color independently.
- [ ] Minimum palette: 8 preset colors + custom hex input.
- [ ] Color selection applies to the currently selected or next-drawn shape.
- [ ] Default stroke color: red (`#FF0000`). Default fill: transparent.

---

#### `FR-EDIT-003` Text & Highlight Tools

**Priority:** Must Have

**Description:**
Users can add text labels and semi-transparent highlight strokes.

**Acceptance Criteria:**

- [ ] Text tool: click to place, type to input. Font size adjustable (12–48px).
- [ ] Highlight tool: semi-transparent brush (opacity ~40%) for marking text.
- [ ] Highlight brush size adjustable (small, medium, large).
- [ ] Text and highlights behave as independent layers (movable, deletable).

---

#### `FR-EDIT-004` Re-crop

**Priority:** Should Have

**Description:**
After initial capture, users can re-adjust the crop boundaries.

**Acceptance Criteria:**

- [ ] Crop handles appear on image edges.
- [ ] User can drag handles to adjust the crop region.
- [ ] Cropping removes pixels outside the region (destructive to the base image layer).
- [ ] Annotations outside the new crop region are clipped or removed.

---

#### `FR-EDIT-005` History (Undo/Redo)

**Priority:** Must Have

**Description:**
Full undo/redo support for all editing actions.

**Acceptance Criteria:**

- [ ] `Ctrl+Z` triggers undo. `Ctrl+Shift+Z` or `Ctrl+Y` triggers redo.
- [ ] Undo/redo buttons also available in toolbar.
- [ ] History stack supports minimum 50 actions.
- [ ] Undo reverses the last action in exact order.

---

#### `FR-EDIT-006` Flatten & Save

**Priority:** Must Have
**User Story:** As a user, I want to finalize my annotated screenshot and have it automatically saved to my Google Drive.

**Description:**
Merges all annotation layers into a single flat image and sends it to the Loomo server. The file is temporarily stored on the server, then automatically uploaded to the user's Google Drive by the job scheduler. The media becomes viewable once the Drive upload completes.

**Acceptance Criteria:**

- [ ] "Save" button merges all layers into a single rasterized image.
- [ ] Output format: PNG (default) or JPEG (user-selectable).
- [ ] JPEG quality: 85% (configurable).
- [ ] Save is performed via API call to `POST /api/media/upload`.
- [ ] API saves file to server temp storage and returns immediately with `{ mediaId }`.
- [ ] User is redirected to the Workplace dashboard immediately after save.
- [ ] Media card appears on dashboard in "Processing..." state (not yet viewable).
- [ ] Once job scheduler completes Drive upload, media becomes fully viewable and shareable.
- [ ] User does not need to take any action — the transition from "Processing" to "Ready" is automatic.

---

### 4.3 Web Application (Next.js)

#### `FR-WEB-001` Landing Page

**Priority:** Must Have

**Description:**
Public-facing page introducing Loomo.

**Content Requirements:**

- Main tagline: "Show, don't just tell."
- Feature explanation sections (capture, annotate, share).
- Call-to-action: link to Chrome Web Store to download extension.
- Call-to-action: sign-up button.

**Acceptance Criteria:**

- [ ] Page is accessible without authentication.
- [ ] Page is responsive (mobile, tablet, desktop).
- [ ] Page load time < 3 seconds on 3G connection.

---

#### `FR-WEB-002` Authentication Module (Google OAuth 2.0)

**Priority:** Must Have
**User Story:** As a user, I want to sign in with my Google account so that I don't need to create a separate Loomo account and my Drive is automatically connected.

**Description:**
Authentication is exclusively via Google OAuth 2.0. No email/password registration. The OAuth flow uses credentials from `client_secret_devnote.json`.

**OAuth Flow:**

```text
User clicks "Sign in with Google"
        │
        ▼
Redirect to Google OAuth consent screen
  - Scopes: openid, email, profile, drive.file
        │
        ▼
User grants consent → Google redirects back with auth code
        │
        ▼
Server exchanges auth code for:
  - access_token (short-lived, ~1 hour)
  - refresh_token (long-lived, stored encrypted in DB)
  - id_token (user profile info)
        │
        ▼
Server creates/updates User record in PostgreSQL
  - google_id, email, display_name, avatar_url
  - Encrypted access_token + refresh_token
        │
        ▼
Server sets session cookie → user is logged in
```

**Features:**

| Feature        | Route                   | Method                                 |
| -------------- | ----------------------- | -------------------------------------- |
| Login          | `/auth/google`          | Redirect to Google OAuth               |
| OAuth Callback | `/auth/google/callback` | Handle auth code, create session       |
| Logout         | `/auth/logout`          | Clear session, optionally revoke token |

**Acceptance Criteria:**

- [ ] "Sign in with Google" button on login page and landing page.
- [ ] First-time login auto-creates user record (no separate registration step).
- [ ] OAuth uses `client_secret_devnote.json` credentials (project: `jam-report`).
- [ ] `refresh_token` is stored encrypted (AES-256) in PostgreSQL.
- [ ] `access_token` is refreshed automatically when expired using `refresh_token`.
- [ ] Session cookie valid for 7 days, httpOnly, secure, sameSite=lax.
- [ ] If Google token is revoked externally, user is prompted to re-authenticate.
- [ ] Rate limiting: max 10 OAuth attempts per 15 minutes per IP.

---

#### `FR-WEB-003` Workplace — Media Dashboard & Management

**Priority:** Must Have
**User Story:** As a user, I want to see all my captures in one place, preview thumbnails, rename, and delete media easily.

**Description:**
Centralized backoffice view for managing all screenshots and recordings. Users can preview thumbnails, view full media, rename, change visibility, share, and delete. Thumbnails are fetched from Google Drive API (`thumbnailLink` field).

**Media Card States:**

| `upload_status` | Card Appearance                                      | Interactions Available                               |
| --------------- | ---------------------------------------------------- | ---------------------------------------------------- |
| `processing`    | Placeholder icon + "Processing..." label             | Delete only                                          |
| `uploading`     | Placeholder icon + "Uploading..." label              | Delete only                                          |
| `ready`         | **Thumbnail preview** from Drive + title, date, size | View, Play, Share, Rename, Delete, Change Visibility |
| `failed`        | Error icon + "Upload failed" label                   | Delete only (auto-retry still running)               |
| `deleting`      | Faded card + "Deleting..." label                     | None (non-interactive)                               |

**Acceptance Criteria:**

##### Display

- [ ] Media displayed in grid view (default) or list view (toggle).
- [ ] Each ready media card shows: **thumbnail preview**, title, type icon (image/video), date, file size.
- [ ] Thumbnails are fetched from Google Drive API (`thumbnailLink`) and cached/proxied via Loomo server.
- [ ] Video thumbnails show a play icon overlay.
- [ ] Media in `processing`/`uploading`/`failed` states show appropriate placeholder with status label.
- [ ] Media in `deleting` state shows faded card with "Deleting..." label, non-interactive.
- [ ] Transition between states happens automatically (via polling or SSE) without page refresh.

##### Management Actions

- [ ] **View/Play**: Click on ready media card opens the Built-in Media Viewer (`FR-WEB-004`).
- [ ] **Rename**: Inline edit or modal to change media title. Updates DB only (not the Drive filename).
- [ ] **Change Visibility**: Dropdown to switch between `private`, `unlisted`, `workspace_only`.
- [ ] **Share**: Opens share dialog with copy-link button (only for `ready` media).
- [ ] **Delete**: Confirmation dialog → marks media as `deleting` → card shows "Deleting..." → job scheduler deletes from Drive → removes DB record → card disappears.

##### Sorting & Filtering

- [ ] Sort options: date created (default), file size, name.
- [ ] Search/filter by: media type (screenshot/recording), date range, upload status.
- [ ] Pagination or infinite scroll (max 20 items per page).

##### Async Delete Flow

```text
User clicks "Delete" → Confirmation dialog
        │
        ▼
API: DELETE /api/media/:id
  - Sets upload_status → "deleting"
  - Creates BackgroundJob (job_type: "delete")
  - Returns immediately
  - Card shows "Deleting..." (faded, non-interactive)
        │
        ▼  (Job Scheduler picks up...)
BackgroundJob:
  1. Delete file from Google Drive (files.delete)
  2. Delete temp file if still exists on server
  3. Delete media record from PostgreSQL
  4. Delete job record
  - On failure: retry (max 5 attempts)
  - On permanent failure: mark for admin review
        │
        ▼
Card disappears from dashboard automatically
```

---

#### `FR-WEB-004` Built-in Media Viewer

**Priority:** Must Have

**Description:**
View captured media at full resolution directly in the browser. **Loomo acts as a wrapper/viewer** — all media is fetched from Google Drive and displayed within the Loomo UI. Users never see Google Drive URLs.

**Acceptance Criteria:**

- [ ] Media viewer is only available for media with `upload_status = "ready"` (already on Google Drive).
- [ ] Media with `upload_status = "processing"` shows a placeholder with "Processing, please wait..." message.
- [ ] Images: displayed at full resolution with zoom (scroll-wheel) and pan.
- [ ] Videos: HTML5 video player with play/pause, seek, volume, fullscreen.
- [ ] Video player supports WebM and MP4 formats.
- [ ] Media is fetched from Google Drive via Loomo server proxy (using stored `drive_file_id` + user's `access_token`).
- [ ] Client always sees Loomo URLs — Google Drive URLs are never exposed to the frontend.
- [ ] Share button generates a Loomo-branded shareable link.

---

#### `FR-WEB-005` Team Collaboration (Workspace Members)

**Priority:** Should Have
**User Story:** As a team lead, I want to invite members to my workspace so that they can view and contribute captures.

**Description:**
Workspace owners can invite others by email.

**Acceptance Criteria:**

- [ ] Invite by email sends invitation link.
- [ ] Invited user must have a Loomo account (or create one upon accepting).
- [ ] Workspace members can view all media with `workspace_only` visibility.
- [ ] Workspace owner can remove members.
- [ ] Maximum members per workspace: **50** (v1 limit).

---

#### `FR-WEB-006` Privacy Controls

**Priority:** Must Have

**Description:**
Per-media access level management.

| Visibility       | Behavior                                                          |
| ---------------- | ----------------------------------------------------------------- |
| `private`        | Only the uploader can view.                                       |
| `unlisted`       | Anyone with the share link can view. Not indexed or discoverable. |
| `workspace_only` | All members of the workspace can view.                            |

**Acceptance Criteria:**

- [ ] Default visibility for new uploads: `private`.
- [ ] User can change visibility from the media detail page.
- [ ] Share links use a random token (min 32 characters, URL-safe).
- [ ] Accessing a private/workspace media without authorization returns `403`.

---

#### `FR-WEB-007` Share Media as Loomo Link

**Priority:** Must Have
**User Story:** As a user, I want to share my screenshot or recording as a simple Loomo link so that anyone can view it without needing to install anything or see my Google Drive.

**Description:**
Each media item can generate a **Loomo-branded shareable URL** (`loomo.app/s/xxx`). Recipients open the link in any browser and view the media on a custom Loomo share page. The file is fetched from Google Drive and served through the Loomo server. **The recipient never sees a Google Drive URL.** Share is only available for media with `upload_status = "ready"`.

**Share Flow:**

```text
User clicks "Share" on media (only available when status = "ready")
        │
        ▼
System generates Loomo-branded share URL
  e.g. https://loomo.app/s/aB3xK9mZ...
        │
        ▼
User copies link → sends via chat/email/docs
        │
        ▼
Recipient opens link in browser
        │
        ▼
Loomo server handles request:
  1. Looks up share_token in DB
  2. Checks visibility permissions
  3. Fetches file from Google Drive
     (using media owner's access_token)
  4. Renders custom Loomo share page
        │
        ▼
Public share page renders:
  - Full-resolution image (zoomable) OR video player
  - Media title / filename
  - "Captured with Loomo" branding + CTA
  - No Google Drive branding visible
  - No login required (if unlisted)
```

**Acceptance Criteria:**

- [ ] "Share" button only available for media with `upload_status = "ready"`.
- [ ] Clicking "Share" generates a unique **Loomo URL**: `{BASE_URL}/s/{share_token}`.
- [ ] Share token is cryptographically random, min 32 characters, URL-safe.
- [ ] **No Google Drive links are ever exposed** to the user or the recipient.
- [ ] "Copy Link" button copies the Loomo URL to clipboard with visual confirmation.
- [ ] Share page is a **public, SEO-friendly page** (server-rendered with Open Graph meta tags).
- [ ] Open Graph tags include: title, description, thumbnail image — so links preview nicely in Slack, Discord, WhatsApp, etc.
- [ ] Share page renders images at full resolution with zoom/pan support.
- [ ] Share page renders videos with HTML5 player (play, pause, seek, volume, fullscreen).
- [ ] Share page shows: media title, capture date, and "Captured with Loomo" branding.
- [ ] Media on share page is fetched from Google Drive via Loomo server proxy.
- [ ] If media visibility is `private`: share link returns `403` with "This content is private" message.
- [ ] If media visibility is `workspace_only`: share link requires authenticated workspace member, otherwise `403`.
- [ ] If media visibility is `unlisted`: share link is accessible by anyone without login.
- [ ] User can **revoke** a share link (regenerates token, old link stops working).
- [ ] User can toggle "Allow download" option on the share page (default: off).
- [ ] Share page loads within 3 seconds on a 3G connection.

---

## 5. API Endpoints (Route Handlers)

### 5.1 Authentication (Google OAuth)

| ID        | Method | Endpoint                    | Description                                 | Auth Required |
| --------- | ------ | --------------------------- | ------------------------------------------- | ------------- |
| `API-001` | `GET`  | `/api/auth/google`          | Redirect to Google OAuth consent screen     | No            |
| `API-002` | `GET`  | `/api/auth/google/callback` | Handle OAuth callback, create session       | No            |
| `API-003` | `POST` | `/api/auth/logout`          | Invalidate session, optionally revoke token | Yes           |
| `API-004` | `GET`  | `/api/auth/me`              | Get current authenticated user info         | Yes           |

### 5.2 Media

| ID        | Method   | Endpoint                   | Description                                                  | Auth Required |
| --------- | -------- | -------------------------- | ------------------------------------------------------------ | ------------- |
| `API-005` | `POST`   | `/api/media/upload`        | Save file to server temp, return mediaId (Drive sync auto)   | Yes           |
| `API-006` | `GET`    | `/api/media`               | List user's media with upload_status + thumbnail (paginated) | Yes           |
| `API-007` | `GET`    | `/api/media/:id`           | Get single media detail (includes upload_status, thumbnail)  | Yes           |
| `API-008` | `GET`    | `/api/media/:id/file`      | Proxy media file from Google Drive (only if status=ready)    | Yes           |
| `API-009` | `GET`    | `/api/media/:id/thumbnail` | Proxy thumbnail from Google Drive API                        | Yes           |
| `API-010` | `DELETE` | `/api/media/:id`           | Mark as deleting, queue async Drive delete via job scheduler | Yes           |
| `API-011` | `PATCH`  | `/api/media/:id`           | Update media title and/or visibility                         | Yes           |

### 5.3 Sharing

| ID        | Method   | Endpoint                 | Description                                            | Auth Required |
| --------- | -------- | ------------------------ | ------------------------------------------------------ | ------------- |
| `API-012` | `GET`    | `/api/share/:token`      | Render Loomo share page (public, only if status=ready) | No            |
| `API-013` | `GET`    | `/api/share/:token/file` | Proxy shared media file from Google Drive              | No            |
| `API-014` | `POST`   | `/api/media/:id/share`   | Generate Loomo share link (only if status=ready)       | Yes           |
| `API-015` | `DELETE` | `/api/media/:id/share`   | Revoke share link (regenerate token)                   | Yes           |

### 5.4 Workspace

| ID        | Method   | Endpoint                     | Description             | Auth Required |
| --------- | -------- | ---------------------------- | ----------------------- | ------------- |
| `API-016` | `POST`   | `/api/workspace/invite`      | Invite member by email  | Yes           |
| `API-017` | `GET`    | `/api/workspace/members`     | List workspace members  | Yes           |
| `API-018` | `DELETE` | `/api/workspace/members/:id` | Remove workspace member | Yes           |

### 5.5 Media Serving Logic (Loomo as Wrapper)

```text
GET /api/media/:id/file  OR  GET /api/share/:token/file
        │
        ▼
┌─────────────────────────────────────────┐
│  Is upload_status = "ready"?            │
│                                         │
│  NO  → Return 202 "Processing..."       │
│        (media not yet on Drive)         │
│                                         │
│  YES → Fetch file from Google Drive     │
│        using drive_file_id +            │
│        owner's access_token             │
│        ↓                                │
│        Proxy response to client         │
│        (Loomo URL, no Drive URL exposed)│
└─────────────────────────────────────────┘
```

> **Loomo never stores media permanently.** Server temp files exist only during the upload window. Once on Drive, all media is served by proxying from Google Drive through Loomo URLs.

---

## 6. Non-Functional Requirements

### `NFR-001` Extension Performance

**Priority:** Must Have

- Video recording must not cause > 200 MB additional RAM usage.
- Area capture overlay must render within 200ms of activation.
- Extension popup must load within 500ms.

### `NFR-002` Link Security

**Priority:** Must Have

- Share tokens must be cryptographically random (min 32 chars, URL-safe base64).
- Share tokens must not be sequential or guessable.
- Rate limit share link access: max 100 requests per minute per IP.

### `NFR-003` Data Integrity

**Priority:** Must Have

- When a user deletes media:
  - Media is marked as `upload_status = "deleting"` immediately.
  - A `BackgroundJob` (type: `delete`) is created.
  - Job scheduler deletes file from Google Drive via Drive API (`files.delete`).
  - Job scheduler deletes temp file from server (if still exists).
  - Job scheduler removes media record + job record from PostgreSQL.
  - Deletion is **permanent and irreversible** (no soft-delete in v1).
  - If Drive delete fails: job retries (max 5 attempts with backoff).
  - If all retries fail: media marked for admin review.
- All uploads must validate file type (whitelist: `image/png`, `image/jpeg`, `video/webm`, `video/mp4`).
- All uploads must validate file size against limits.

### `NFR-004` Security

**Priority:** Must Have

- All API endpoints (except public) require valid session/token.
- Google OAuth tokens (`access_token`, `refresh_token`) stored encrypted (AES-256) in PostgreSQL.
- No passwords stored (Google OAuth only).
- All traffic over HTTPS (TLS 1.2+).
- CORS configured to allow only the web app and extension origins.
- File uploads sanitized (no executable files).
- `client_secret_devnote.json` must NOT be committed to public repositories.
- OAuth `drive.file` scope ensures Loomo can only access files it created, not user's entire Drive.

### `NFR-005` Scalability

**Priority:** Should Have

- System should support up to **1,000 concurrent users** in v1.
- Upload queue should handle concurrent uploads without blocking the API.
- Temp file storage on server should be cleaned up within 1 hour of successful Drive upload.
- Database queries must be optimized with proper indexing.
- Google Drive API rate limits: 12,000 queries per minute per project (shared across all users).

### `NFR-006` Accessibility

**Priority:** Could Have

- Keyboard navigation support for the editor toolbar.
- Sufficient color contrast ratios (WCAG AA).
- Screen reader labels for all interactive elements.

### `NFR-007` Browser Compatibility

**Priority:** Must Have

- Chrome Extension: Chrome version ≥ 110 (Manifest V3 support).
- Web Application: Chrome, Firefox, Safari, Edge (latest 2 versions).

---

## 7. Constraints & Assumptions

### Constraints

| ID        | Constraint                                                            |
| --------- | --------------------------------------------------------------------- |
| `CON-001` | Extension is Chrome-only (Manifest V3).                               |
| `CON-002` | PostgreSQL database is hosted externally (outside Docker).            |
| `CON-003` | Max upload file size: 500 MB.                                         |
| `CON-004` | Max recording duration: 30 minutes.                                   |
| `CON-005` | Supported image formats: PNG, JPEG.                                   |
| `CON-006` | Supported video formats: WebM, MP4.                                   |
| `CON-007` | Authentication is Google OAuth only (no email/password).              |
| `CON-008` | File storage is user's Google Drive (requires `drive.file` scope).    |
| `CON-009` | Google Drive API rate limit: 12,000 queries/min per project.          |
| `CON-010` | Google Drive free tier: 15 GB per user (shared with Gmail, Photos).   |
| `CON-011` | Server needs temp disk storage for files awaiting async Drive upload. |
| `CON-012` | Media is not viewable/shareable until Drive upload completes.         |
| `CON-013` | Loomo server acts as wrapper only — no permanent file storage.        |

### Assumptions

| ID        | Assumption                                                                       |
| --------- | -------------------------------------------------------------------------------- |
| `ASM-001` | Users have a stable internet connection for upload/download.                     |
| `ASM-002` | Users grant necessary Chrome permissions (tab capture, microphone).              |
| `ASM-003` | The web app and extension share the same domain or a trusted CORS configuration. |
| `ASM-004` | Users have a Google account and are willing to sign in with it.                  |
| `ASM-005` | Users grant `drive.file` scope during OAuth consent.                             |
| `ASM-006` | Users have sufficient Google Drive storage for their captures.                   |

---

## 8. Glossary

| Term                      | Definition                                                                                                                                   |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **Area Capture**          | A screenshot taken by selecting a rectangular region on a web page using a crosshair tool.                                                   |
| **Workplace / Workspace** | A shared collection of media assets belonging to a team or individual. Members of a workspace can access shared media.                       |
| **Preview Editor**        | The in-browser annotation tool where users add shapes, text, and highlights to a captured screenshot before uploading.                       |
| **Flatten**               | The process of merging all annotation layers (shapes, text, highlights) into a single rasterized image file.                                 |
| **Share Token**           | A cryptographically random string used in a URL to grant access to a specific media item without authentication.                             |
| **Visibility**            | The access level of a media item: `private`, `unlisted`, or `workspace_only`.                                                                |
| **Route Handler**         | Next.js App Router's server-side API endpoint (replaces the old `pages/api` pattern).                                                        |
| **Google OAuth 2.0**      | Authentication protocol where users sign in via their Google account. Loomo uses this for login and Google Drive access.                     |
| **drive.file scope**      | Google OAuth scope that grants access only to files created by the requesting app (Loomo), not the user's entire Drive.                      |
| **Async Upload**          | Non-blocking upload pattern where the API returns immediately and a background worker handles the actual file transfer to Google Drive.      |
| **Upload Job**            | A queued task representing a pending file upload to Google Drive, with status tracking and retry logic.                                      |
| **Refresh Token**         | Long-lived Google OAuth token stored encrypted in DB, used to obtain new access tokens without re-prompting the user.                        |
| **Wrapper/Viewer**        | Loomo's role as a UI layer on top of Google Drive. Loomo does not permanently store files; it proxies media from Drive through branded URLs. |
| **Temp Storage**          | Temporary file storage on the Loomo server. Files are held here only until successfully uploaded to Google Drive, then deleted.              |

---

## 9. Open Questions

| ID       | Question                                                                        | Status      | Decision                                                 |
| -------- | ------------------------------------------------------------------------------- | ----------- | -------------------------------------------------------- |
| `OQ-001` | What file storage solution to use?                                              | ✅ Resolved | Google Drive (per-user, via `drive.file` scope)          |
| `OQ-002` | Which auth library? (NextAuth.js, custom handler?)                              | 🔴 Open     | —                                                        |
| `OQ-003` | Should we support Google/OAuth sign-in in v1?                                   | ✅ Resolved | Yes — Google OAuth is the only auth method               |
| `OQ-004` | Maximum number of workspaces per user?                                          | 🔴 Open     | —                                                        |
| `OQ-005` | Should recordings include webcam overlay option?                                | 🔴 Open     | —                                                        |
| `OQ-006` | Should we implement soft-delete with a retention period?                        | 🔴 Open     | —                                                        |
| `OQ-007` | What to do when user's Google Drive is full?                                    | 🔴 Open     | —                                                        |
| `OQ-008` | Should shared media be proxied through Loomo server or served via Drive direct? | ✅ Resolved | Always proxied via Loomo server (Loomo = wrapper)        |
| `OQ-009` | How to handle if user revokes Loomo's Google Drive access externally?           | 🔴 Open     | —                                                        |
| `OQ-010` | Queue implementation: in-process (BullMQ/Redis) or DB-based (pg-boss)?          | 🔴 Open     | —                                                        |
| `OQ-011` | Server temp cleanup policy?                                                     | ✅ Resolved | Delete temp ONLY after confirmed successful Drive upload |
| `OQ-012` | Should server temp use disk or binary blob in PostgreSQL?                       | 🔴 Open     | —                                                        |

---

## 10. Revision History

| Version | Date       | Author | Changes                                                                                                                                                                        |
| ------- | ---------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1.0     | —          | Rijal  | Initial PRD.                                                                                                                                                                   |
| 2.0     | 2026-06-16 | Rijal  | Restructured for AI readability. Added: requirement IDs, acceptance criteria, user stories, data model, API contracts, glossary, success metrics, constraints, open questions. |
| 3.0     | 2026-06-16 | Rijal  | Major architecture change: Google OAuth login, Google Drive storage (per-user), async upload with background job queue. Removed email/password auth. Added UploadJob entity.   |
| 3.1     | 2026-06-16 | Rijal  | Upload redesigned to be fully invisible (no user-facing status/retry). Share links always Loomo-branded URLs.                                                                  |
| 3.2     | 2026-06-16 | Rijal  | Loomo = wrapper/viewer only. Media only viewable after Drive upload. Temp deleted only after Drive success. All media served by proxying from Google Drive.                    |
| 3.3     | 2026-06-16 | Rijal  | Enhanced media management: thumbnails via Drive API, rename, async delete via job scheduler. BackgroundJob entity replaces UploadJob (handles both upload & delete).           |
