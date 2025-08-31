// 通用内容卡片的类型定义 - 遵循 DRY 原则
export interface BaseContentCard {
  id: string;
  title: string;
  imageUrl?: string;
  description?: string;
  category: string;
  tags?: string[];
  tips?: ContentTip[];
  difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  readTime?: string;
  overview?: string;
  sections?: ContentSection[];
  lastUpdated?: string;
  version?: string;
}

export interface ContentSection {
  title: string;
  content: string;
  type: 'text' | 'code' | 'list' | 'mermaid';
}

export interface ContentTip {
  type: 'info' | 'success' | 'warning' | 'tip' | 'expert';
  title: string;
  content: string;
}

export interface CategoryConfig {
  [key: string]: string;
}

export interface DifficultyConfig {
  [key: string]: string;
}

// 扩展 Best Practices 的特定类型
export interface PracticeCard extends BaseContentCard {
  category: 'workflow' | 'configuration' | 'mcp-commands' | 'context' | 'automation' | 'concurrency' | 'tools';
}

// How to Implement 的特定类型
export interface ImplementCard extends BaseContentCard {
  category: 'conversation' | 'system-prompt' | 'integration' | 'configuration' | 'implementation' | 'examples';
}

// How to Apply CC SDK 的特定类型
export interface SDKCard extends BaseContentCard {
  category: 'quick-start' | 'core-usage' | 'advanced' | 'examples' | 'best-practices' | 'integration';
}