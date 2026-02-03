# SKILL.md 格式规范

SKILL.md 是技能的核心定义文件，由 YAML 元数据和 Markdown 内容两部分组成。

## 文件结构

```markdown
---
name: skill-name
description: 简短描述（用于 AI 决定何时激活）
author: author-name
version: 1.0.0
tags: [tag1, tag2]
---

# 技能标题

正文内容...
```

## YAML 元数据

### 必填字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `name` | string | 技能名称，小写，用连字符分隔 |
| `description` | string | 简短描述，AI 根据这个决定何时激活 |

### 可选字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `author` | string | 作者名称或 GitHub 用户名 |
| `version` | string | 语义化版本号 |
| `tags` | string[] | 标签，用于分类和搜索 |
| `agents` | string[] | 支持的 Agent 列表 |

## Markdown 正文

### 推荐结构

```markdown
# 技能名称

## 描述
详细说明这个技能的功能和用途。

## 使用场景
列出何时应该激活此技能的场景。

## 操作步骤
1. 步骤一
2. 步骤二
3. 步骤三

## 示例
提供具体的使用示例。

## 注意事项
列出使用时需要注意的问题。
```

### 写作原则

1. **描述要精确**：description 字段是 AI 判断激活时机的关键
2. **步骤要清晰**：使用有序列表，每步一行
3. **示例要具体**：提供可直接使用的代码或命令
4. **避免歧义**：措辞准确，减少 AI 误解的可能

## 示例

### 简单技能

```markdown
---
name: code-review
description: 代码审查技能 - 帮助 AI 进行专业的代码评审
author: skillwisp
version: 1.0.0
tags: [review, quality]
---

# Code Review Skill

## 描述
指导 AI 进行专业、系统的代码审查。

## 使用场景
- 用户说"帮我审查这段代码"
- 用户说"看看这个 PR"
- 代码修改后请求反馈

## 审查维度

1. **正确性**：逻辑是否正确
2. **可读性**：命名是否清晰
3. **性能**：是否有优化空间
4. **安全**：是否有安全隐患

## 输出格式

使用以下格式输出审查结果：

- ✅ 优点：...
- ⚠️ 建议：...
- ❌ 问题：...
```

### 带脚本的技能

如果技能需要辅助脚本，可以在同目录下创建 `scripts/` 文件夹：

```
skill-deploy/
├── SKILL.md
└── scripts/
    └── deploy.sh
```

在 SKILL.md 中引用：

```markdown
## 操作步骤

1. 运行部署脚本：
   ```bash
   bash scripts/deploy.sh
   ```
```
