import { HowToApplyCCManager } from './core/HowToApplyCCManager';

let manager: HowToApplyCCManager;

export function initializeHowToApplyCC(): void {
  console.log('初始化 How to Apply CC 模块...');
  
  manager = new HowToApplyCCManager();
  manager.initialize();
  
  // 暴露到全局作用域以便页面调用
  (window as any).initializeHowToApplyCC = initializeHowToApplyCC;
  (window as any).showHowToApplyCCOverview = () => {
    if (manager) {
      manager.showOverview();
    }
  };
  
  console.log('How to Apply CC 模块初始化完成');
}

// 自动初始化（如果在浏览器环境中）
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeHowToApplyCC);
  } else {
    initializeHowToApplyCC();
  }
}