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

## Metadata Storage

市場建立時會將 `question/description/category/endDate/image` 封裝成 JSON：
1. 若設定 `VITE_PINATA_JWT`，會上傳至 Pinata 並回傳 `ipfs://` URI。
2. 若無金鑰，則退回 `data:application/json;base64,...` 的本地 URI。
3. 最後會把 `<metadata:URI>` 附加在問題字串結尾，並由前端在讀取市場時解析。

## Refresh 行為
- Header 右上角提供 `Refresh` 按鈕，可強制重新抓取鏈上/快取資料。
- 系統亦會在 `MarketCreated` 事件、或每 45 秒背景自動刷新一次。
- 若 RPC 延遲超過 8 秒，會自動 fallback 至 mock 市場，避免 UI 卡住。
