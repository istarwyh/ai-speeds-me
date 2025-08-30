# Best Practices Share Feature — Technical Design (V1)

## Scope

- Add a small glass-style share button on each Best Practices card in `#best-practices-overview-cards`.
- On click, generate a Xiaohongshu-like portrait poster (PNG 1080×1440) from card data and copy it to the clipboard, with download fallback.
- Always include watermark text "aispeeds.me"; reserve a QR placeholder area for V2.

## Non-Goals

- Server-side OG image generation (Cloudflare Workers/Satori) — V2.
- Rendering external `imageUrl` into the poster — V2 (requires CORS/proxy strategy).
- Actual QR generation — V2 (placeholder only in V1).

## Architecture Overview

- UI injection: `src/client/shared/renderers/BaseCardRenderer.ts`
  - Add a button element inside `.overview-card` header area:
    - Class: `.overview-card__share-btn`
    - Attributes: `data-action="share-card"`, `data-card-id="<id>"`, `aria-label="分享此卡片"`
  - Styling conforms to glassmorphism tokens.

- Event wiring: `src/client/bestPractices/handlers/EventHandler.ts`
  - Extend `bindEventListeners` to delegate clicks for `[data-action="share-card"]`.
  - On share click: `event.stopPropagation()` to avoid article navigation in `BaseArticleEventHandler`.
  - Lookup card data by `id` from `bestPracticesCards`.
  - Call `ShareService.generate(card)` → `ShareService.copyOrDownload(blob, filename)`.

- Share generation: `src/client/shared/services/ShareService.ts` (new)
  - Canvas-based composition (no DOM snapshot) to ensure consistent, CORS-safe output.
  - Layout zones: header (category icon + title), body (tips/overview bullets + tags), footer (watermark + deep-link text + QR placeholder).
  - Clipboard write if supported, otherwise auto-download.

## Key Modules and Contracts

- UI
  - `BaseCardRenderer.renderCard(card, index): string`
    - Inject share button markup at a consistent position (top-right of header).

- Events
  - `EventHandler.bindEventListeners()`
    - Add listener on container `#best-practices-overview-cards` for share action.
    - Pseudocode:
      ```ts
      container.addEventListener('click', (e) => {
        const btn = (e.target as HTMLElement).closest('[data-action="share-card"]');
        if (!btn) return;
        e.preventDefault();
        e.stopPropagation();
        const id = btn.getAttribute('data-card-id');
        const card = bestPracticesCards.find(c => c.id === id);
        if (card) share(card);
      }, true);
      ```

- Service
  - File: `src/client/shared/services/ShareService.ts` (new)
  - Types:
    ```ts
    export type ShareOptions = {
      width?: number;        // default 1080
      height?: number;       // default 1440
      padding?: number;      // default 64
      bgGradient?: [string, string]; // background gradient
      brandText?: string;    // default 'aispeeds.me'
      deeplink?: string;     // e.g., window.location.origin + '/home#best-practices'
      maxTags?: number;      // default 3
      maxTips?: number;      // default 2
    };

    export class ShareService {
      static async generate(card: PracticeCard, opts?: ShareOptions): Promise<Blob> { /* draw canvas */ }
      static async copyOrDownload(blob: Blob, filename: string): Promise<void> { /* clipboard or download */ }
    }
    ```

## Canvas Composition Details

- Dimensions: 1080×1440 px portrait.
- Safe padding: 64 px; rounded rect backdrop.
- Header:
  - Category icon (emoji or icon from `categoryIcons`) at 48–64 px.
  - Title in bold, auto-wrap, cap 3–4 lines.
- Body:
  - Tips: first 1–2 tips, prefix with emoji/badge per type; wrap lines.
  - Overview fallback: if no tips, use up to 3 bullets inferred from `sections` title/content.
  - Tags row: up to 3 tags as pills.
- Footer:
  - Left: `aispeeds.me` watermark in medium weight.
  - Right: QR placeholder square (e.g., 160×160) with light border and label "扫码了解更多" (not a real QR in V1).
  - Optional deeplink text truncated (e.g., `aispeeds.me/home#best-practices`).
- Fonts:
  - Use system fonts stack; wait for `document.fonts.ready` before measure/draw to avoid reflow mismatch.
- Rendering helpers:
  - Text wrap by measuring `ctx.measureText` and splitting by words; apply ellipsis when exceeding line cap.
  - Color tokens: use design tokens or hard-coded neutrals aligned with theme.

## Styling (Button)

- Class: `.overview-card__share-btn` inside `.overview-card__header .overview-card__meta` area.
- Visuals:
  - Glass hover/active using tokens from `shared/styles/designTokens.ts`:
    - `--color-surface-glass-1` (hover)
    - `--color-surface-glass-2` (active)
  - Size ~28–32px, circular, icon "分享" or glyph.
- Accessibility: `aria-label="分享此卡片"`, focus styles, keyboard activation.

## Accessibility

- Keyboard operable; focus visible.
- ARIA label for the share button.
- Toasts announce status where possible (polite region minimalism).

## Performance

- No external libraries for V1.
- No cross-origin images drawn to canvas.
- Use `requestIdleCallback`/`setTimeout(0)` for non-critical steps if needed.
- Consider `OffscreenCanvas` when available; fallback to standard canvas.

## Security & Privacy

- No network calls in V1.
- Clipboard usage is user-initiated via click.
- Graceful fallback to download on unsupported browsers.

## Edge Cases

- Very long titles → wrap/ellipsis after 3–4 lines.
- No tips/tags → center body copy using overview/sections fallback or skip block entirely.
- Clipboard failure → immediate download with safe filename `best-practice-<id>.png`.

## Testing Plan

- Desktop: Chrome/Edge (clipboard success), Safari (download fallback).
- Mobile: iOS Safari/WeChat browser save to album; Android Chrome share flow.
- Visual: Check text legibility, margins, and token adherence.
- Regression: Ensure card click-to-article still works.

## Rollout

- Ship behind a minimal toggle (env or runtime flag) if needed; default ON after QA.
- Add documentation in `docs/tech` and update ADD_BEST_PRACTICES_CARD.md with a short note.

## Risks and Mitigations

- Clipboard API variance → robust fallback to download.
- Font metrics → await `document.fonts.ready` and use system stack.
- Event conflicts → `stopPropagation()` on share button path; delegate capture phase if necessary.

## Future (V2+)

- Server OG image route on Workers (Satori/ResVG), shareable URLs, caching.
- Real QR generation (client: `qrcode` lib or server pre-render), deep-link to the card/article.
- Include `imageUrl` by proxying images with appropriate CORS headers.
- Theming support (light/dark poster variants).

## Implementation Checklist

- Add share button markup in `BaseCardRenderer.renderCard()`.
- Style the button (glass tokens) in the relevant stylesheet.
- Extend `EventHandler` to intercept `[data-action="share-card"]` and call service.
- Implement `ShareService` canvas generation and copy/download logic.
- Add minimal toast feedback.
- QA on major browsers and mobile.
