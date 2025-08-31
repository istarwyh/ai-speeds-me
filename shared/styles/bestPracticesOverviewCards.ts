export const bestPracticesOverviewCardStyles = `
  /* 概览卡片网格布局 */
  .overview-cards-grid {
    column-count: 4;
    column-gap: 1rem;
    column-fill: balance;
    column-width: 360px; /* fluid columns; browser will pick optimal count */
    padding: 2rem 0;
  }

  /* 进入/退出动画 - 卡片 */
  @keyframes cardFadeInUp {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes cardFadeOutDown {
    to { opacity: 0; transform: translateY(8px); }
  }

  /* 基础卡片样式 */
  .overview-card {
    background: var(--bp-bg-primary);
    border: 1px solid var(--bp-border-color);
    border-radius: 16px;
    padding: 1rem 1rem 1.25rem 1rem;
    transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
    position: relative;
    overflow: hidden;
    cursor: pointer;
    /* Masonry item settings */
    display: inline-block;
    width: 100%;
    margin: 0 0 1rem 0; /* vertical spacing between items */
    break-inside: avoid;
    break-inside: avoid-column;
    -webkit-column-break-inside: avoid;
    -moz-column-break-inside: avoid;
    page-break-inside: avoid;
    content-visibility: auto;
    contain: layout paint;
    will-change: transform;
    /* 入场动画 - 使用动态延迟 */
    opacity: 0;
    animation: cardFadeInUp 0.35s ease forwards;
    animation-delay: var(--card-index, 0s);
  }

  /* 移除硬编码的 nth-child 延迟，现在使用 CSS 自定义属性 */

  /* 退出动画状态（切换到详情前） */
  .overview-cards-grid.is-exiting .overview-card {
    animation: cardFadeOutDown 0.22s ease forwards;
  }
  .overview-cards-grid.is-exiting { pointer-events: none; }

  .overview-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, var(--bp-accent), var(--bp-primary));
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  .overview-card:hover::before,
  .overview-card--hover::before {
    opacity: 1;
  }

  .overview-card:hover,
  .overview-card--hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
    border-color: var(--bp-border-hover);
    z-index: 2; /* ensure raised card overlays neighbors in columns */
  }

  /* 卡片头部 */
  .overview-card__header {
    margin-bottom: 1.5rem;
  }

  /* Share button - glass style */
  .overview-card__share-btn {
    position: absolute;
    top: 12px;
    right: 12px;
    width: 36px;
    height: 36px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    border: 1px solid var(--bp-border-color);
    background: var(--color-surface-glass-1);
    -webkit-backdrop-filter: blur(8px);
    backdrop-filter: blur(8px);
    color: var(--bp-text-primary);
    cursor: pointer;
    transition: background var(--transition-fast), transform var(--transition-fast), border-color var(--transition-fast);
    z-index: 3;
  }

  .overview-card__share-btn:hover {
    background: var(--color-surface-glass-2);
    transform: translateY(-1px);
    border-color: var(--bp-border-hover);
  }

  .overview-card__share-btn:focus-visible {
    outline: 2px solid var(--bp-primary);
    outline-offset: 2px;
  }

  .overview-card__title-section {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }

  /* 封面图 */
  .overview-card__cover {
    width: 100%;
    border-radius: 12px;
    overflow: hidden;
    margin-bottom: 0.75rem;
    background: var(--bp-bg-secondary);
  }

  .overview-card__cover img {
    width: 100%;
    height: auto;
    display: block;
  }

  .overview-card__icon {
    font-size: 2rem;
    line-height: 1;
  }

  .overview-card__title {
    font-size: 1rem;
    font-weight: 600;
    color: var(--bp-text-primary);
    margin: 0;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .overview-card__meta {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .overview-card__difficulty {
    display: inline-flex;
    align-items: center;
    padding: 0.25rem 0.75rem;
    background: var(--difficulty-color, var(--bp-accent));
    color: white;
    border-radius: 20px;
    font-size: 0.875rem;
    font-weight: 600;
    opacity: 0.9;
  }

  .overview-card__read-time {
    color: var(--bp-text-secondary);
    font-size: 0.875rem;
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  /* 卡片内容 */
  .overview-card__content {
    margin-bottom: 1.5rem;
  }

  .overview-card__description {
    font-size: 1.1rem;
    color: var(--bp-text-primary);
    margin: 0 0 1rem 0;
    font-weight: 500;
    line-height: 1.5;
  }

  .overview-card__overview {
    color: var(--bp-text-secondary);
    line-height: 1.6;
    margin-bottom: 1.5rem;
  }

  /* 章节列表 */
  .overview-card__sections {
    margin-bottom: 1.5rem;
  }

  .overview-card__sections-title {
    font-size: 1rem;
    font-weight: 600;
    color: var(--bp-text-primary);
    margin: 0 0 0.75rem 0;
  }

  .overview-card__sections-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .overview-card__section-item {
    padding: 0.5rem 0;
    border-bottom: 1px solid var(--bp-border-color);
  }

  .overview-card__section-item:last-child {
    border-bottom: none;
  }

  .overview-card__section-title {
    display: block;
    font-weight: 600;
    color: var(--bp-text-primary);
    margin-bottom: 0.25rem;
  }

  .overview-card__section-desc {
    display: block;
    color: var(--bp-text-secondary);
    font-size: 0.9rem;
    line-height: 1.4;
  }

  /* 提示信息 */
  .overview-card__tips {
    margin-bottom: 1.5rem;
  }

  .overview-card__tip {
    padding: 0.75rem 1rem;
    border-radius: 8px;
    margin-bottom: 0.5rem;
    font-size: 0.9rem;
    line-height: 1.4;
  }

  .overview-card__tip:last-child {
    margin-bottom: 0;
  }

  .overview-card__tip--success {
    background: rgba(16, 185, 129, 0.1);
    border-left: 4px solid #10b981;
    color: var(--bp-text-primary);
  }

  .overview-card__tip--info {
    background: rgba(59, 130, 246, 0.1);
    border-left: 4px solid #3b82f6;
    color: var(--bp-text-primary);
  }

  .overview-card__tip--warning {
    background: rgba(245, 158, 11, 0.1);
    border-left: 4px solid #f59e0b;
    color: var(--bp-text-primary);
  }

  .overview-card__tip--tip {
    background: rgba(6, 182, 212, 0.1); /* cyan-500 @ 10% */
    border-left: 4px solid #06b6d4; /* cyan-500 */
    color: var(--bp-text-primary);
  }

  .overview-card__tip--expert {
    background: rgba(168, 85, 247, 0.1); /* purple-500 @ 10% */
    border-left: 4px solid #a855f7; /* purple-500 */
    color: var(--bp-text-primary);
  }

  /* 标签 */
  .overview-card__tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
  }

  .overview-card__tag {
    padding: 0.25rem 0.75rem;
    background: var(--bp-bg-secondary);
    color: var(--bp-text-secondary);
    border-radius: 16px;
    font-size: 0.8rem;
    font-weight: 500;
    border: 1px solid var(--bp-border-color);
  }

  /* 卡片底部 */
  .overview-card__footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 1rem;
    border-top: 1px solid var(--bp-border-color);
  }

  .overview-card__action-btn {
    background: var(--bp-primary);
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 0.9rem;
  }

  .overview-card__action-btn:hover {
    background: var(--bp-primary-dark);
    transform: translateX(2px);
  }

  .overview-card__updated {
    color: var(--bp-text-secondary);
    font-size: 0.8rem;
  }

  /* Share Preview Modal */
  .share-preview-overlay {
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.5);
    -webkit-backdrop-filter: blur(6px);
    backdrop-filter: blur(6px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    z-index: 1000;
  }

  .share-preview-modal {
    width: min(92vw, 960px);
    max-height: 92vh;
    background: var(--bp-bg-primary);
    border: 1px solid var(--bp-border-color);
    border-radius: 16px;
    box-shadow: 0 20px 48px rgba(0, 0, 0, 0.25);
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .share-preview-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    border-bottom: 1px solid var(--bp-border-color);
    background: var(--color-surface-glass-1);
    -webkit-backdrop-filter: blur(8px);
    backdrop-filter: blur(8px);
  }

  .share-preview-title {
    font-weight: 600;
    font-size: 1rem;
    color: var(--bp-text-primary);
  }

  .share-preview-close {
    appearance: none;
    border: none;
    background: transparent;
    color: var(--bp-text-secondary);
    width: 32px;
    height: 32px;
    border-radius: 8px;
    cursor: pointer;
  }

  .share-preview-close:hover {
    background: var(--color-surface-glass-2);
    color: var(--bp-text-primary);
  }

  .share-preview-close:focus-visible {
    outline: 2px solid var(--bp-primary);
    outline-offset: 2px;
  }

  .share-preview-body {
    padding: 16px;
    overflow: auto;
    background: var(--bp-bg-primary);
  }

  .share-preview-canvas-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .share-preview-canvas-wrap canvas {
    width: min(720px, 100%);
    height: auto;
    max-height: 70vh;
    border-radius: 12px;
    border: 1px solid var(--bp-border-color);
    box-shadow: 0 10px 24px rgba(0,0,0,0.12);
    background: #fff;
  }

  .share-preview-actions {
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
    align-items: center;
    padding: 12px 16px;
    border-top: 1px solid var(--bp-border-color);
    background: var(--bp-bg-primary);
  }

  .share-action {
    appearance: none;
    border: 1px solid var(--bp-border-color);
    background: var(--bp-bg-primary);
    color: var(--bp-text-primary);
    padding: 0.5rem 1rem;
    border-radius: 10px;
    font-weight: 600;
    font-size: 0.9rem;
    cursor: pointer;
    transition: background var(--transition-fast), transform var(--transition-fast), border-color var(--transition-fast), color var(--transition-fast);
  }

  .share-action:hover {
    background: var(--color-surface-glass-2);
    border-color: var(--bp-border-hover);
    transform: translateY(-1px);
  }

  .share-action.primary {
    background: var(--bp-primary);
    color: #fff;
    border-color: transparent;
  }

  .share-action.primary:hover {
    background: var(--bp-primary-dark);
  }

  .share-action.subtle {
    background: transparent;
    color: var(--bp-text-secondary);
  }

  .share-action:focus-visible {
    outline: 2px solid var(--bp-primary);
    outline-offset: 2px;
  }

  /* 响应式设计 */
  @media (max-width: 768px) {
    .overview-cards-grid {
      column-count: 1;
      column-gap: 0.75rem;
      padding: 1rem 0;
    }

    .overview-card {
      padding: 1.5rem;
    }

    .overview-card__title {
      font-size: 1.3rem;
    }

    .overview-card__meta {
      gap: 0.75rem;
    }

    .overview-card__footer {
      flex-direction: column;
      gap: 1rem;
      align-items: stretch;
    }

    .overview-card__action-btn {
      width: 100%;
      text-align: center;
    }
  }

  @media (max-width: 1600px) {
    .overview-cards-grid {
      column-count: 3;
    }
  }

  @media (max-width: 1200px) {
    .overview-cards-grid {
      column-count: 2;
    }
  }
`;
