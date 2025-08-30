import type { BaseContentCard } from '../types/ContentCard';

export type ShareResult = { method: 'clipboard' | 'download'; ok: boolean };

export type ShareServiceOptions<T extends BaseContentCard = BaseContentCard> = {
  // Optional module name for deep link building, e.g. 'best-practices'
  moduleName?: string;
  // Optional custom deep link builder. If provided, takes precedence.
  deepLinkBuilder?: (card: T) => string;
};

export class ShareService<T extends BaseContentCard = BaseContentCard> {
  private readonly width = 1080;
  private readonly height = 1440;
  private readonly padding = 72; // 72px ~ 1in logical at 96dpi
  private readonly getIcon: (category: string) => string;
  private readonly options: ShareServiceOptions<T>;

  constructor(getIcon: (category: string) => string, options: ShareServiceOptions<T> = {}) {
    this.getIcon = getIcon;
    this.options = options;
  }

  public async shareCard(card: T): Promise<ShareResult> {
    const canvas = await this.renderCanvas(card);
    const blob = await new Promise<Blob>((resolve) =>
      canvas.toBlob((b) => resolve(b as Blob), 'image/png', 0.95)
    );
    try {
      // ClipboardItem may not exist in Safari
      // @ts-ignore
      if (navigator.clipboard && window.ClipboardItem) {
        // @ts-ignore
        const item = new ClipboardItem({ 'image/png': blob });
        await navigator.clipboard.write([item]);
        this.toast('已复制到剪贴板');
        return { method: 'clipboard', ok: true };
      }
      throw new Error('Clipboard API not supported');
    } catch {
      // Fallback to download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safeTitle = (card.title || 'share').replace(/[\n\t\s]+/g, '_').slice(0, 60);
      a.download = `${safeTitle}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      this.toast('已下载图片（剪贴板不可用）');
      return { method: 'download', ok: true };
    }
  }

  // Open a preview modal to let users confirm and choose action
  public async openPreview(card: T): Promise<void> {
    const canvas = await this.renderCanvas(card);
    const blob = await new Promise<Blob>((resolve) =>
      canvas.toBlob((b) => resolve(b as Blob), 'image/png', 0.95)
    );

    const overlay = document.createElement('div');
    overlay.className = 'share-preview-overlay';
    overlay.tabIndex = -1;

    const modal = document.createElement('div');
    modal.className = 'share-preview-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', '分享预览');

    const header = document.createElement('div');
    header.className = 'share-preview-header';
    header.innerHTML = `
      <div class="share-preview-title">分享预览</div>
      <button class="share-preview-close" aria-label="关闭预览" title="关闭">×</button>
    `;

    const body = document.createElement('div');
    body.className = 'share-preview-body';
    // Use the canvas directly for crisp preview (1080x1440); scale via CSS
    const previewWrapper = document.createElement('div');
    previewWrapper.className = 'share-preview-canvas-wrap';
    previewWrapper.appendChild(canvas);
    body.appendChild(previewWrapper);

    const actions = document.createElement('div');
    actions.className = 'share-preview-actions';
    const copyBtn = document.createElement('button');
    copyBtn.className = 'share-action primary';
    copyBtn.textContent = '复制到剪贴板';
    const downloadBtn = document.createElement('button');
    downloadBtn.className = 'share-action';
    downloadBtn.textContent = '下载图片';
    const copyLinkBtn = document.createElement('button');
    copyLinkBtn.className = 'share-action';
    copyLinkBtn.textContent = '复制链接';
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'share-action subtle';
    cancelBtn.textContent = '取消';
    actions.append(copyBtn, downloadBtn, copyLinkBtn, cancelBtn);

    modal.append(header, body, actions);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    const cleanup = () => overlay.remove();

    // Close interactions
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) cleanup();
    });
    header.querySelector('.share-preview-close')?.addEventListener('click', cleanup);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        cleanup();
        document.removeEventListener('keydown', onKey);
      }
    };
    document.addEventListener('keydown', onKey);

    // Actions
    copyBtn.addEventListener('click', async () => {
      const ok = await this.tryClipboard(blob);
      if (ok) {
        this.toast('已复制到剪贴板');
        cleanup();
      } else {
        this.toast('剪贴板不可用，已自动下载');
        this.triggerDownload(blob, card.title);
        cleanup();
      }
    });
    downloadBtn.addEventListener('click', () => {
      this.triggerDownload(blob, card.title);
      this.toast('已开始下载');
      cleanup();
    });
    copyLinkBtn.addEventListener('click', async () => {
      try {
        const link = this.buildDeepLink(card);
        await navigator.clipboard.writeText(link);
        this.toast('链接已复制');
      } catch {
        this.toast('复制链接失败');
      }
    });
    cancelBtn.addEventListener('click', cleanup);

    // Focus for accessibility
    (header.querySelector('.share-preview-close') as HTMLButtonElement)?.focus();
  }

  private async tryClipboard(blob: Blob): Promise<boolean> {
    try {
      // @ts-ignore
      if (navigator.clipboard && window.ClipboardItem) {
        // @ts-ignore
        const item = new ClipboardItem({ 'image/png': blob });
        await navigator.clipboard.write([item]);
        return true;
      }
    } catch {
      // ignore
    }
    return false;
  }

  private triggerDownload(blob: Blob, title?: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeTitle = (title || 'share').replace(/[\n\t\s]+/g, '_').slice(0, 60);
    a.download = `${safeTitle}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  private async renderCanvas(card: T): Promise<HTMLCanvasElement> {
    const canvas = document.createElement('canvas');
    canvas.width = this.width;
    canvas.height = this.height;
    const ctx = canvas.getContext('2d')!;

    // Ensure fonts loaded for consistent rendering
    try { await (document as any).fonts?.ready; } catch {}

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, this.width, this.height);

    // Header bar subtle gradient
    const headerH = 160;
    const grad = ctx.createLinearGradient(0, 0, this.width, 0);
    grad.addColorStop(0, '#eff6ff');
    grad.addColorStop(1, '#f8fafc');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.width, headerH);

    let y = this.padding;

    // Category icon (emoji) circle
    const icon = this.getIcon(card.category) || '📋';
    const iconR = 44;
    const iconCx = this.padding + iconR;
    const iconCy = y + iconR;
    ctx.fillStyle = '#e5f2ff';
    this.roundRect(ctx, iconCx - iconR, iconCy - iconR, iconR * 2, iconR * 2, 24);
    ctx.fill();
    ctx.font = '48px system-ui, -apple-system, Segoe UI, Roboto';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#111827';
    ctx.fillText(icon, iconCx, iconCy + 2);

    // Title
    const titleX = iconCx + iconR + 24;
    const titleMaxWidth = this.width - titleX - this.padding;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 48px ui-sans-serif, -apple-system, system-ui, Segoe UI, Roboto';
    y += 8; // slight alignment tweak
    y = this.wrapText(ctx, card.title || '', titleX, y + 24, titleMaxWidth, 56, 2);

    // Meta: difficulty and read time
    ctx.font = '28px ui-sans-serif, -apple-system, system-ui';
    ctx.fillStyle = '#475569';
    const metaParts: string[] = [];
    if ((card as any).difficulty) metaParts.push(this.mapDifficulty((card as any).difficulty));
    if (card.readTime) metaParts.push(`📖 ${card.readTime}`);
    if (metaParts.length) {
      y += 8;
      ctx.fillText(metaParts.join('  ·  '), titleX, y + 24);
      y += 48;
    } else {
      y += 40;
    }

    // Overview/Description
    const bodyX = this.padding;
    const bodyMaxWidth = this.width - this.padding * 2;
    ctx.font = '32px ui-sans-serif, -apple-system, system-ui';
    ctx.fillStyle = '#111827';
    if ((card as any).description) {
      y = this.wrapText(ctx, (card as any).description, bodyX, y + 24, bodyMaxWidth, 44, 3);
    } else if ((card as any).overview) {
      y = this.wrapText(ctx, (card as any).overview, bodyX, y + 24, bodyMaxWidth, 44, 3);
    }

    // Tips (up to 2)
    const tips = (card.tips || []).slice(0, 2);
    if (tips.length) {
      y += 24;
      tips.forEach((tip) => {
        y = this.renderTip(ctx, tip.title + '：' + tip.content, bodyX, y, bodyMaxWidth);
        y += 16;
      });
    }

    // Tags (up to 3)
    const tags = (card.tags || []).slice(0, 3);
    if (tags.length) {
      y += 16;
      this.renderTags(ctx, tags, bodyX, y);
      y += 56;
    }

    // QR code area (render live QR if possible; fallback to placeholder)
    const qrSize = 220;
    const qrX = this.width - this.padding - qrSize;
    const qrY = this.height - this.padding - qrSize;
    await this.drawQrOrPlaceholder(ctx, card, qrX, qrY, qrSize);

    // Branding watermark
    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.font = 'bold 28px ui-sans-serif, -apple-system, system-ui';
    ctx.fillStyle = '#0f172a';
    ctx.fillText('aispeeds.me', this.padding, this.height - this.padding / 2);
    ctx.restore();

    return canvas;
  }

  private buildDeepLink(card: T): string {
    try {
      if (this.options.deepLinkBuilder) return this.options.deepLinkBuilder(card);
      const url = new URL(window.location.href);
      const moduleName = this.options.moduleName || 'best-practices';
      url.searchParams.set('module', moduleName);
      url.searchParams.set('view', 'article');
      url.searchParams.set('cardId', (card as any).id || '');
      return url.toString();
    } catch {
      return window.location.href;
    }
  }

  private async drawQrOrPlaceholder(
    ctx: CanvasRenderingContext2D,
    card: T,
    x: number,
    y: number,
    size: number
  ): Promise<void> {
    // Container border
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 3;
    this.roundRect(ctx, x, y, size, size, 16);
    ctx.stroke();

    const deepLink = this.buildDeepLink(card);
    const img = await this.loadQrImage(deepLink, size).catch(() => null);
    if (!img) {
      // Fallback placeholder
      ctx.font = '24px ui-sans-serif, -apple-system, system-ui';
      ctx.fillStyle = '#64748b';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('QR 预留', x + size / 2, y + size / 2);
      return;
    }

    // Draw a white bg then QR image with padding
    const pad = 10;
    ctx.fillStyle = '#ffffff';
    this.roundRect(ctx, x + 2, y + 2, size - 4, size - 4, 12);
    ctx.fill();
    ctx.drawImage(img, x + pad, y + pad, size - pad * 2, size - pad * 2);
  }

  private async loadQrImage(data: string, size: number): Promise<HTMLImageElement> {
    // Use a CORS-enabled QR API to avoid canvas tainting
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(
      data
    )}`;
    await new Promise<void>((resolve) => setTimeout(resolve, 0)); // yield
    return new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('QR load failed'));
      img.src = url;
    });
  }

  private renderTip(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number
  ): number {
    // background
    const lineH = 40;
    const padding = 16;
    const lines = this.splitLines(ctx, text, maxWidth - padding * 2);
    const boxH = lines.length * lineH + padding * 2;
    ctx.fillStyle = 'rgba(6, 182, 212, 0.08)';
    this.roundRect(ctx, x, y, maxWidth, boxH, 12);
    ctx.fill();

    // left bar
    ctx.fillStyle = '#06b6d4';
    ctx.fillRect(x, y, 6, boxH);

    // text
    ctx.fillStyle = '#0f172a';
    ctx.font = '28px ui-sans-serif, -apple-system, system-ui';
    let ty = y + padding + 28;
    lines.forEach((line) => {
      ctx.fillText(line, x + padding + 10, ty);
      ty += lineH;
    });
    return y + boxH;
  }

  private renderTags(
    ctx: CanvasRenderingContext2D,
    tags: string[],
    x: number,
    y: number
  ) {
    ctx.font = '26px ui-sans-serif, -apple-system, system-ui';
    let cx = x;
    const py = y;
    tags.forEach((tag) => {
      const paddingX = 18;
      const paddingY = 10;
      const w = ctx.measureText(tag).width + paddingX * 2;
      const h = 40;
      ctx.fillStyle = '#f1f5f9';
      this.roundRect(ctx, cx, py - h + paddingY, w, h, 20);
      ctx.fill();
      ctx.fillStyle = '#475569';
      ctx.fillText(tag, cx + paddingX, py - 12);
      cx += w + 12;
    });
  }

  private mapDifficulty(d: string): string {
    switch (d) {
      case 'beginner': return '入门';
      case 'intermediate': return '进阶';
      case 'expert': return '专家';
      default: return d;
    }
  }

  private wrapText(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number,
    maxLines: number
  ): number {
    const lines = this.splitLines(ctx, text, maxWidth, maxLines);
    lines.forEach((line, i) => {
      ctx.fillText(line, x, y + i * lineHeight);
    });
    return y + Math.min(lines.length, maxLines) * lineHeight;
  }

  private splitLines(
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number,
    maxLines?: number
  ): string[] {
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let current = '';

    for (let i = 0; i < words.length; i++) {
      const test = current ? `${current} ${words[i]}` : words[i];
      if (ctx.measureText(test).width <= maxWidth) {
        current = test;
      } else {
        if (current) lines.push(current);
        current = words[i];
        if (maxLines && lines.length >= maxLines - 1) {
          // truncate
          while (ctx.measureText(current + '…').width > maxWidth && current.length > 0) {
            current = current.slice(0, -1);
          }
          current = current + '…';
          break;
        }
      }
    }
    if (current) lines.push(current);
    return lines;
  }

  private roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }

  private toast(message: string) {
    const el = document.createElement('div');
    el.textContent = message;
    el.style.position = 'fixed';
    el.style.left = '50%';
    el.style.top = '16px';
    el.style.transform = 'translateX(-50%)';
    el.style.background = 'rgba(17, 24, 39, 0.9)';
    el.style.color = '#fff';
    el.style.padding = '8px 12px';
    el.style.borderRadius = '8px';
    el.style.fontSize = '14px';
    el.style.zIndex = '9999';
    el.style.pointerEvents = 'none';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1800);
  }
}
