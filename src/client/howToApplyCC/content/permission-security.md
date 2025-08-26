# 权限和安全控制

掌握Plan模式、权限管理、自定义权限提示工具等安全控制机制。

## 权限模式对比

### 四种权限模式

```typescript
const permissionModes = {
  default: {
    description: "标准权限模式",
    requiresApproval: true,
    suitableFor: "日常开发"
  },
  acceptEdits: {
    description: "自动接受编辑",
    requiresApproval: false,
    suitableFor: "低风险变更"
  },
  plan: {
    description: "计划模式",
    requiresApproval: true,
    suitableFor: "复杂变更审核"
  },
  bypassPermissions: {
    description: "绕过权限",
    requiresApproval: false,
    suitableFor: "紧急修复"
  }
};
```

### 配置权限模式

```typescript
const sdk = new ClaudeCodeSDK({
  apiKey: process.env.ANTHROPIC_API_KEY,
  permissionMode: 'plan', // 使用计划模式
  customPermissions: {
    allow: ['read_file', 'search', 'analyze'],
    deny: ['write_file', 'execute_command']
  }
});
```

## 计划模式应用

### 代码审查工作流

```typescript
async function reviewWithPlanMode() {
  const sdk = new ClaudeCodeSDK({
    permissionMode: 'plan'
  });

  const plan = await sdk.run(`
    请审查以下代码变更，并创建详细的实施计划：
    - 变更影响分析
    - 风险评估
    - 测试建议
    - 回滚方案
  `);

  // 显示计划供人工审核
  console.log('变更计划:', plan);
  
  // 人工确认后执行
  if (confirmApproval(plan)) {
    await sdk.executePlan(plan);
  }
}
```

安全控制是构建安全可控 AI Agent 的核心要素，需要根据具体业务场景进行精细配置。"}```</parameter></parameter>