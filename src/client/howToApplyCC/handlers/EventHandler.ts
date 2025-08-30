import { BaseArticleEventHandler, IArticleRenderer, IContentService } from '../../shared/handlers/BaseArticleEventHandler';

export class HowToApplyCCEventHandler extends BaseArticleEventHandler {
  constructor(
    containerId: string,
    contentService: IContentService,
    articleRenderer: IArticleRenderer
  ) {
    super(
      containerId,
      contentService,
      articleRenderer,
      () => (window as any).initializeHowToApplyCC()
    );
  }
}