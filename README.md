<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1JUHWzpFAe7nq0ys2u2X2TfTzb5cDfTVB

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Environment Variables

Create a `.env.local` file if you plan to push metadata to IPFS/Pinata. All keys are optional — without them metadata falls back to a local data URI.

```
VITE_PINATA_JWT=your_pinata_jwt_token
VITE_IPFS_GATEWAY=https://gateway.pinata.cloud/ipfs/
```

- `VITE_PINATA_JWT`: Optional Pinata JWT used when uploading metadata.
- `VITE_IPFS_GATEWAY`: Optional gateway for reading IPFS metadata.
