import type { BaseContentCard, ContentSection, ContentTip } from '../types/ContentCard';
import { defaultDifficultyConfig, type DifficultyConfig } from '../config/cardConfig';

// 通用卡片渲染器 - 符合 SOLID 原则的单一职责
export class BaseCardRenderer<T extends BaseContentCard> {
  protected categoryIcons: Record<string, string> = {};
  protected difficultyConfig: DifficultyConfig;

  constructor(
    categoryIcons: Record<string, string> = {},
    difficultyConfig: DifficultyConfig = defaultDifficultyConfig
  ) {
    this.categoryIcons = categoryIcons;
    this.difficultyConfig = difficultyConfig;
  }

  public renderCards(cards: T[]): string {
    return cards.map((card, index) => this.renderCard(card, index)).join('');
  }

  public renderCard(card: T, index?: number): string {
    const icon = this.categoryIcons[card.category] || '📋';
    const difficultyColor = card.difficulty
      ? this.difficultyConfig.colors[card.difficulty]
      : undefined;
    const difficultyLabel = card.difficulty
      ? this.difficultyConfig.labels[card.difficulty]
      : undefined;

    const sectionsHtml = this.renderSections(card.sections);

    const difficultyHtml = difficultyLabel
      ? `<span class="overview-card__difficulty"${difficultyColor ? ` style="--difficulty-color: ${difficultyColor}"` : ''}>
              ${difficultyLabel}
            </span>`
      : '';

    const readTimeHtml = card.readTime
      ? `<span class="overview-card__read-time">📖 ${card.readTime}</span>`
      : '';

    const overviewHtml = card.overview
      ? `<div class="overview-card__overview">${card.overview}</div>`
      : '';

    const sectionsBlockHtml = sectionsHtml
      ? `<div class="overview-card__sections">
            <h4 class="overview-card__sections-title">主要内容：</h4>
            <ul class="overview-card__sections-list">
              ${sectionsHtml}
            </ul>
          </div>`
      : '';

    const descriptionHtml = card.description
      ? `<p class="overview-card__description">${card.description}</p>`
      : '';

    const versionHtml = card.version
      ? `<span class="overview-card__version">v${card.version}</span>`
      : '';
    const updatedHtml = card.lastUpdated
      ? `<span class="overview-card__updated">更新于 ${card.lastUpdated}</span>`
      : '';
    const metaInfoHtml = versionHtml || updatedHtml
      ? `<div class="overview-card__meta-info">${versionHtml}${updatedHtml}</div>`
      : '';

    const coverHtml = card.imageUrl
      ? `<div class="overview-card__cover"><img src="${card.imageUrl}" alt="${card.title}" loading="lazy" decoding="async" fetchpriority="low" /></div>`
      : '';

    // 动态设置动画延迟
    const animationDelay = typeof index === 'number' ? index * 0.02 : 0;
    const styleAttr = `style="--card-index: ${animationDelay}s"`;

    return `
      <div class="content-card overview-card" data-card-id="${card.id}" ${styleAttr}>
        <div class="overview-card__header">
          <div class="overview-card__title-section">
            <div class="overview-card__icon">${icon}</div>
            <h3 class="overview-card__title">${card.title}</h3>
          </div>
          <div class="overview-card__meta">
            ${difficultyHtml}
            ${readTimeHtml}
          </div>
        </div>
        <button class="overview-card__share-btn" data-card-id="${card.id}" aria-label="分享此卡片" title="分享">
          <svg class="icon icon-share" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
            <path d="M7 12l10-6M7 12l10 6M7 12v8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <rect x="3" y="4" width="4" height="4" rx="1.5" stroke="currentColor" stroke-width="2"/>
            <rect x="17" y="10" width="4" height="4" rx="1.5" stroke="currentColor" stroke-width="2"/>
            <rect x="3" y="16" width="4" height="4" rx="1.5" stroke="currentColor" stroke-width="2"/>
          </svg>
        </button>
                ${coverHtml}

        <div class="overview-card__content">
          ${descriptionHtml}
          ${overviewHtml}
          ${sectionsBlockHtml}

          ${this.renderTipsBlock(card.tips)}
          
          ${this.renderTagsBlock(card.tags)}
        </div>
        
        ${metaInfoHtml ? `<div class="overview-card__footer">${metaInfoHtml}</div>` : ''}
        
      </div>
    `;
  }

  protected renderSections(sections?: ContentSection[]): string {
    if (!sections || sections.length === 0) return '';
    return sections.map(section => `
      <li class="overview-card__section-item">
        <span class="overview-card__section-title">${section.title}</span>
        <span class="overview-card__section-content">${section.content}</span>
      </li>
    `).join('');
  }

  protected renderTips(tips?: ContentTip[]): string {
    if (!tips || tips.length === 0) return '';
    
    return tips.map(tip => `
      <div class="overview-card__tip overview-card__tip--${tip.type}">
        <strong class="overview-card__tip-title">${tip.title}:</strong>
        <span class="overview-card__tip-content">${tip.content}</span>
      </div>
    `).join('');
  }

  protected renderTipsBlock(tips?: ContentTip[]): string {
    const tipsHtml = this.renderTips(tips);
    return tipsHtml ? `<div class="overview-card__tips">${tipsHtml}</div>` : '';
  }

  protected renderTags(tags?: string[]): string {
    if (!tags || tags.length === 0) return '';
    return tags.map(tag => `
      <span class="overview-card__tag">${tag}</span>
    `).join('');
  }

  protected renderTagsBlock(tags?: string[]): string {
    const tagsHtml = this.renderTags(tags);
    return tagsHtml ? `<div class="overview-card__tags">${tagsHtml}</div>` : '';
  }
}