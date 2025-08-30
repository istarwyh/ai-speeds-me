import { injectMarkdownStyles } from '../../bestPractices/styles/markdownStyles';
import { SafeMarkdownRenderer } from '../../../../shared/utils/markdownRenderer';
import type { BaseContentCard } from '../types/ContentCard';
import { ShareService as GenericShareService } from '../services/ShareService';

// Animation duration constant
const EXIT_ANIMATION_DURATION = 230; // 匹配 CSS 中的动画时长

// Minimal service and renderer contracts used by the handlers
export interface IContentService {
  getArticle(id: string): Promise<{
    title: string;
    content: string;
    rawMarkdown: string;
  }>;
}

export interface IArticleRenderer {
  renderArticle(title: string, content: string): string;
  renderLoadingState(): string;
  renderErrorState(error: string): string;
}

/**
 * BaseArticleEventHandler centralizes the common flow for card click ->
 * article view rendering, Markdown/hljs processing, and UX enhancements.
 *
 * Subclasses customize:
 * - how to extract cardId from click target (extractCardId)
 * - optional pre-enter animation (beforeEnterArticle)
 * - how back navigation is registered (configureBackNavigation)
 * - optional debug listeners (addDebugListeners)
 */
export abstract class BaseArticleEventHandler {
  protected containerId: string;
  protected boundClickHandler: (e: Event) => void;
  protected contentService: IContentService;
  protected articleRenderer: IArticleRenderer;
  protected onBackToOverview?: () => void;
  private _shareService?: GenericShareService<BaseContentCard>;
  private _suppressHistory = false;

  constructor(
    containerId: string,
    contentService: IContentService,
    articleRenderer: IArticleRenderer,
    onBackToOverview?: () => void
  ) {
    this.containerId = containerId;
    this.boundClickHandler = this.handleCardClick.bind(this);
    this.contentService = contentService;
    this.articleRenderer = articleRenderer;
    this.onBackToOverview = onBackToOverview;
  }

  // Subclasses must provide a single source of truth for card lookup and icon mapping
  protected abstract resolveCardById(id: string): BaseContentCard | null;
  protected abstract getIcon(category: string): string;
  // 用于深链接的模块标识（避免缩写，保持可解释性）
  protected abstract getModuleName(): string;

  public bindEventListeners(): void {
    const container = document.getElementById(this.containerId);
    if (!container) {
      console.error(`未找到容器元素: ${this.containerId}`);
      return;
    }

    this.removeExistingListeners(container);
    this.addEventListeners(container);
  }

  protected removeExistingListeners(container: HTMLElement): void {
    container.removeEventListener('click', this.boundClickHandler);
  }

  protected addEventListeners(container: HTMLElement): void {
    container.addEventListener('click', this.boundClickHandler);
    this.addDebugListeners(container);
  }

  // Hook: subclasses may add extra debug listeners; default no-op
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected addDebugListeners(container: HTMLElement): void {}

  protected handleCardClick(e: Event): void {
    const event = e as MouseEvent;
    const target = event.target as HTMLElement;

    // Avoid interactions when this container is already in article view
    const containerEl = event.currentTarget as HTMLElement | null;
    const isInArticleView = containerEl?.querySelector('.practice-article');
    if (isInArticleView) {
      return;
    }

    // Intercept share button clicks (DRY across modules)
    const shareBtn = target.closest('.overview-card__share-btn') as HTMLElement | null;
    if (shareBtn) {
      event.stopPropagation();
      event.preventDefault();
      const cardId = shareBtn.getAttribute('data-card-id');
      if (!cardId) return;
      const card = this.resolveCardById(cardId);
      if (!card) return;
      // lazy init
      this._shareService =
        this._shareService ||
        new GenericShareService<BaseContentCard>(this.getIcon.bind(this), {
          moduleName: this.getModuleName(),
        });
      void this._shareService.openPreview(card);
      return;
    }

    const cardId = this.extractCardId(target);
    if (!cardId) return;

    this.showDetailedContent(cardId);
  }

  // 提供可公开调用的方法用于根据 cardId 打开文章（用于深链接入口）
  public openArticle(cardId: string): Promise<void> {
    return this.showDetailedContent(cardId);
  }

  // 从浏览器历史导航进入时打开文章，不再 pushState，避免破坏历史栈
  public async openArticleFromHistory(cardId: string): Promise<void> {
    this._suppressHistory = true;
    try {
      await this.showDetailedContent(cardId);
    } finally {
      this._suppressHistory = false;
    }
  }

  // Default: click on whole card, fallback to action button
  protected extractCardId(target: HTMLElement): string | null {
    const cardEl = target.closest('.overview-card') as HTMLElement | null;
    if (cardEl) {
      const cardId = cardEl.getAttribute('data-card-id');
      if (!cardId) {
        console.error('卡片缺少 data-card-id 属性');
        return null;
      }
      return cardId;
    }

    const button = target.closest(
      '.overview-card__action-btn'
    ) as HTMLElement | null;
    if (button) {
      const cardId = button.getAttribute('data-card-id');
      if (!cardId) {
        console.error('按钮缺少 data-card-id 属性');
        return null;
      }
      return cardId;
    }
    return null;
  }

  protected async showDetailedContent(cardId: string): Promise<void> {
    const container = document.getElementById(this.containerId);
    if (!container) {
      console.error(`未找到容器元素: ${this.containerId}`);
      return;
    }

    try {
      // Optional pre-enter animation
      await this.beforeEnterArticle(container);

      // Styles for Markdown/hljs
      injectMarkdownStyles();

      // Loading state
      container.innerHTML = this.articleRenderer.renderLoadingState();

      // Fetch content
      const article = await this.contentService.getArticle(cardId);

      // Static article shell
      const articleHtml = this.articleRenderer.renderArticle(
        article.title,
        article.content
      );
      container.innerHTML = articleHtml;

      // Render Markdown safely scoped to this container to avoid cross-module ID collisions
      const markdownContainer = container.querySelector(
        '#markdown-content-container'
      ) as HTMLElement | null;
      if (markdownContainer) {
        const renderer = new SafeMarkdownRenderer();
        const renderedHtml = renderer.render(article.rawMarkdown);
        markdownContainer.innerHTML = `<div class="markdown-content">${renderedHtml}</div>`;
        renderer.highlightCode(markdownContainer);

        // UX enhancements
        this.addEnhancedFeatures(markdownContainer);
      }

      // Back navigation wiring
      this.configureBackNavigation();

      // 深链接：打开文章后更新 URL 查询参数
      if (!this._suppressHistory) {
        this.updateHistoryForArticle(cardId);
      }
    } catch (error) {
      console.error('加载文章失败:', error);
      const message = error instanceof Error ? error.message : String(error);
      const errorHtml = this.articleRenderer.renderErrorState(message);
      container.innerHTML = errorHtml;
    }
  }

  // Hook: subclasses may animate/prepare before article view is entered
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected async beforeEnterArticle(_container: HTMLElement): Promise<void> {
    // default no-op
  }

  // Back navigation using direct DOM event listeners instead of global window functions
  protected configureBackNavigation(): void {
    const containerEl = document.getElementById(this.containerId);
    if (!containerEl || !this.onBackToOverview) return;

    const backButton = containerEl.querySelector(
      '[data-action="back-to-overview"]'
    ) as HTMLButtonElement | null;

    if (!backButton) return;

    // Remove any existing event listeners to avoid duplicates
    const existingHandler = (backButton as any)._backHandler;
    if (existingHandler) {
      backButton.removeEventListener('click', existingHandler);
    }

    // Remove any inline onclick to avoid invoking global handlers from other modules
    backButton.removeAttribute('onclick');

    // Create new handler and store reference for cleanup
    const backHandler = this.handleBackToOverview.bind(this);
    (backButton as any)._backHandler = backHandler;
    backButton.addEventListener('click', backHandler);
  }

  protected handleBackToOverview(): void {
    if (!this.onBackToOverview) return;
    
    const containerEl = document.getElementById(this.containerId);
    if (containerEl) {
      const articleEl = containerEl.querySelector('.practice-article') as HTMLElement | null;
      if (articleEl) {
        articleEl.classList.add('is-exiting');
        setTimeout(() => {
          this.onBackToOverview!();
          // 返回总览后更新 URL 查询参数
          this.updateHistoryForOverview();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, EXIT_ANIMATION_DURATION);
        return;
      }
    }
    this.onBackToOverview();
    this.updateHistoryForOverview();
  }

  // Shared enhancements below
  protected addEnhancedFeatures(container: HTMLElement): void {
    this.addCopyButtonsToCodeBlocks(container);
    this.addReadingProgress();
    this.addBackToTopButton();
  }

  protected addCopyButtonsToCodeBlocks(container: HTMLElement): void {
    const codeBlocks = container.querySelectorAll('pre');
    codeBlocks.forEach((block) => {
      if (!block.querySelector('.copy-button')) {
        const copyButton = document.createElement('button');
        copyButton.className = 'copy-button';
        copyButton.textContent = '复制';
        copyButton.onclick = () => this.copyCodeBlock(block as HTMLElement, copyButton);
        block.appendChild(copyButton);
      }
    });
  }

  protected copyCodeBlock(block: HTMLElement, button: HTMLElement): void {
    const code = block.querySelector('code');
    if (code) {
      navigator.clipboard
        .writeText(code.textContent || '')
        .then(() => {
          button.textContent = '已复制';
          button.classList.add('copied');
          setTimeout(() => {
            button.textContent = '复制';
            button.classList.remove('copied');
          }, 2000);
        })
        .catch(() => {
          button.textContent = '复制失败';
          setTimeout(() => {
            button.textContent = '复制';
          }, 2000);
        });
    }
  }

  protected addReadingProgress(): void {
    const existingProgress = document.querySelector('.reading-progress');
    if (existingProgress) existingProgress.remove();

    const progressBar = document.createElement('div');
    progressBar.className = 'reading-progress';
    document.body.appendChild(progressBar);

    const updateProgress = () => {
      const scrollTop = window.pageYOffset;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const progress = (scrollTop / docHeight) * 100;
      progressBar.style.width = `${Math.min(progress, 100)}%`;
    };

    window.addEventListener('scroll', updateProgress);
    updateProgress();
  }

  protected addBackToTopButton(): void {
    const existingButton = document.querySelector('.back-to-top');
    if (existingButton) existingButton.remove();

    const backToTopButton = document.createElement('button');
    backToTopButton.className = 'back-to-top';
    backToTopButton.innerHTML = '↑';
    backToTopButton.onclick = () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    document.body.appendChild(backToTopButton);

    const toggleBackToTop = () => {
      if (window.pageYOffset > 300) {
        backToTopButton.classList.add('visible');
      } else {
        backToTopButton.classList.remove('visible');
      }
    };

    window.addEventListener('scroll', toggleBackToTop);
    toggleBackToTop();
  }

  // —— URL 深链接辅助方法 ——
  private updateHistoryForArticle(cardId: string): void {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('module', this.getModuleName());
      url.searchParams.set('view', 'article');
      url.searchParams.set('cardId', cardId);
      window.history.pushState(
        { module: this.getModuleName(), view: 'article', cardId },
        '',
        url.toString()
      );
    } catch {}
  }

  private updateHistoryForOverview(): void {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('module', this.getModuleName());
      url.searchParams.set('view', 'overview');
      url.searchParams.delete('cardId');
      window.history.pushState(
        { module: this.getModuleName(), view: 'overview' },
        '',
        url.toString()
      );
    } catch {}
  }
}
