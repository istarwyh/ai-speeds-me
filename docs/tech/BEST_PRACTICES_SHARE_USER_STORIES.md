# Best Practices Share Feature — User Stories

## Context

- The feature adds a Xiaohongshu-style share button on each card in `如何用好 CC` (Best Practices).
- Clicking the button generates a poster-like image users can copy or download, branded with "aispeeds.me".
- QR code support will be added later; V1 reserves space.

## Actors

- Visitor (anonymous user)
- Mobile user (sharing to social platforms)
- Content author (adds/maintains cards)
- Developer (maintenance and QA)

## Assumptions

- Cards are rendered in `#best-practices-overview-cards` via `BestPracticesManager`.
- Each card has a stable `id`, `title`, `category`, optional `tags`/`tips`.
- We will not render external images into the poster in V1 to avoid CORS canvas tainting.
- Use client-side Canvas to generate PNG; Clipboard API may be unavailable in some browsers (fallback to download).

## User Stories

- As a visitor, I can click a small glass-style share button on a card to generate a share image so that I can quickly share the card to friends/platforms.
  - Acceptance
    - A share button is visible on each card without obstructing content.
    - Clicking share does not open the article (no navigation conflict).
    - A poster is generated within 500ms–1500ms on typical devices.
    - Poster includes: title, category icon, up to 2 tips or overview bullets, up to 3 tags, watermark "aispeeds.me", reserved QR area, optional deep-link text.

- As a visitor, when my browser supports image clipboard, the image is copied to clipboard; otherwise a file download starts.
  - Acceptance
    - `navigator.clipboard.write` success path shows a short toast (e.g., "已复制") and reverts.
    - On failure or unsupported, an automatic download of `best-practice-<id>.png` occurs.

- As a mobile user, I can save the generated image and share it to Xiaohongshu/WeChat Moments.
  - Acceptance
    - Default size: 1080×1440 (portrait). PNG size typically < 1MB.
    - Text remains readable on high-DPI screens; key content is within safe margins.

- As a content author, the share image reflects the current card metadata.
  - Acceptance
    - Title, category icon, tags, and tips come from `cardsData.ts` for the corresponding `id`.
    - If tips/tags are missing, layout degrades gracefully.

- As a developer, adding the share button does not interfere with current card click-to-article behavior.
  - Acceptance
    - Share button uses event delegation with `stopPropagation()`.
    - Existing `BaseArticleEventHandler` flow remains unchanged for non-share clicks.

- As a screen-reader user, the share button is accessible.
  - Acceptance
    - `aria-label` describes the action (e.g., "分享此卡片").
    - Focus ring visible; keyboard activation supported.

## Out of Scope (V1)

- Server-side OG image generation and shareable URLs.
- Rendering external images into the poster (e.g., `imageUrl`).
- Actual QR code generation (only placeholder area in V1).

## Success Metrics

- Functional: ≥ 99% success rate for copy or download across modern browsers.
- Performance: Poster generated in ≤ 1.5s on mid-tier devices.
- UX: ≤ 1% reported navigation conflicts; no visual regressions to cards.

## Manual Acceptance Checklist

- Share button appears on all cards in `best-practices` section.
- Clicking share on a card with tips/tags produces an image with those fields.
- Clicking share on a card without tips/tags still renders a balanced layout.
- Clipboard copy works on Chrome/Edge; Safari falls back to download.
- Button is keyboard-accessible and has `aria-label`.
- No console errors; no style regressions on mobile/desktop.
