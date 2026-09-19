# Remix of Remix of Event Moments

Build a private, consent-based AI photo gallery web app for events (weddings, parties, conferences) where guests can see only the photos they appear in by uploading a selfie.

🎯 PRODUCT GOAL

Create a full-stack web application that:

Allows a photographer to upload an entire event photo album.

Uses AI facial recognition to detect and index faces in all photos.

Allows a guest to upload one selfie.

Matches the selfie face with faces in the album.

Shows the guest a curated gallery of only their photos.

Prioritizes privacy, consent, and data deletion.

This is not a public social app. It is a private event tool.

🧠 CORE FEATURES (MUST IMPLEMENT)
1️⃣ Photographer / Admin Upload

Secure admin login

Upload multiple photos at once

Store photos in cloud storage

Each photo gets a unique ID

Trigger face detection automatically after upload

2️⃣ AI Face Detection & Indexing

For every uploaded photo:

Detect all faces

Generate face embeddings (numerical vectors)

Associate each face embedding with the photo ID

One photo may contain multiple faces

Do NOT store names or identities

Do NOT store cropped face images unless required temporarily

3️⃣ Guest Access Flow

Guest accesses app via:

QR code

Private event link

Show consent screen:

Explain face matching

Explain data usage

Require explicit consent checkbox

4️⃣ Selfie Upload & Matching

Guest uploads ONE selfie

Extract face embedding from selfie

Compare selfie embedding with stored album embeddings

Use similarity threshold (configurable)

Find all photos where the face matches

5️⃣ Personalized Gallery Output

Display a clean photo gallery

Show ONLY matched photos

Support:

Grid view

Fullscreen preview

Optional:

Download button

Share button (disabled by default)

6️⃣ Privacy & Safety (CRITICAL)

Delete selfie after matching (immediately or within minutes)

Do not expose other guests’ photos

No face search without consent

Provide “Delete my data” option

Album must be private (no indexing by search engines)

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://imagecon1.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/9110f942-b2a7-4261-b605-7e4a29db2cb0).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
