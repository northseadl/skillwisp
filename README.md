# SkillWisp

为 Claude Code、Cursor、Gemini 等 AI 编程助手安装 Skills 的命令行工具。

这里是 SkillWisp 的资源仓库，收录了 [Anthropic](https://github.com/anthropics/skills)、[Vercel](https://github.com/vercel-labs/agent-skills)、[OpenAI](https://github.com/openai/skills) 官方及社区的 74 个 Skills。你也可以直接从下方索引手动下载。

[![npm version](https://img.shields.io/npm/v/skillwisp.svg)](https://www.npmjs.com/package/skillwisp)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## 什么是 Skill？

Skill 是 AI 编程助手的扩展能力包。安装后，AI 助手可以读取 Skill 中的指令和知识，从而具备新的能力。例如安装 `@anthropic/pdf` 后，Claude Code 就能处理 PDF 文档。

## 安装

```bash
npm install -g skillwisp
```

## 使用

### 交互模式

```bash
skillwisp
```

无参数启动进入交互界面：Browse → Select → Install。

### 命令行模式

```bash
skillwisp search pdf             # 搜索
skillwisp install @anthropic/pdf # 安装
skillwisp list                   # 查看已安装
skillwisp info @anthropic/pdf    # 查看详情
```

## Skills 索引

**[查看全部 74 个 Skills →](docs/skills.md)**

### Anthropic Official

| Skill | 描述 | 安装 |
|-------|------|------|
| [@anthropic/pdf](https://github.com/anthropics/skills/tree/main/skills/@anthropic/pdf) | PDF 处理 | `skillwisp install @anthropic/pdf` |
| [@anthropic/docx](https://github.com/anthropics/skills/tree/main/skills/@anthropic/docx) | Word 文档 | `skillwisp install @anthropic/docx` |
| [@anthropic/xlsx](https://github.com/anthropics/skills/tree/main/skills/@anthropic/xlsx) | Excel | `skillwisp install @anthropic/xlsx` |
| [@anthropic/mcp-builder](https://github.com/anthropics/skills/tree/main/skills/@anthropic/mcp-builder) | MCP 服务器生成 | `skillwisp install @anthropic/mcp-builder` |

### Vercel Labs

| Skill | 描述 | 安装 |
|-------|------|------|
| [@vercel/react-best-practices](https://github.com/vercel-labs/agent-skills/tree/main/skills/@vercel/react-best-practices) | React 最佳实践 | `skillwisp install @vercel/react-best-practices` |
| [@vercel/web-design-guidelines](https://github.com/vercel-labs/agent-skills/tree/main/skills/@vercel/web-design-guidelines) | Web 界面最佳实践 | `skillwisp install @vercel/web-design-guidelines` |

### OpenAI

| Skill | 描述 | 安装 |
|-------|------|------|
| [@openai/figma](https://github.com/openai/skills/tree/main/skills/.curated/@openai/figma) | Figma 设计 | `skillwisp install @openai/figma` |
| [@openai/playwright](https://github.com/openai/skills/tree/main/skills/.curated/@openai/playwright) | 浏览器自动化 | `skillwisp install @openai/playwright` |

## 支持的工具

| 工具 | 目录 |
|------|------|
| Claude Code | `.claude` |
| Cursor | `.cursor` |
| Gemini | `.gemini` |
| Codex | `.codex` |
| GitHub Copilot | `.github` |
| Windsurf | `.windsurf` |
| Trae | `.trae` |
| Kiro | `.kiro` |
| Augment | `.augment` |

## 安装策略

- 主源 `.agent` 存储实际文件
- 其他 App 通过符号链接指向主源
- Windows 或 `--no-symlink` 时复制文件

## 退出码

| 码 | 含义 |
|----|------|
| 0 | 成功 |
| 2 | 参数错误 |
| 3 | 资源未找到 |
| 4 | 网络错误 |
| 5 | 文件系统错误 |

## 项目结构

```
skillwisp/
├── skills/           # Skills 资源
│   └── @anthropic/   # Anthropic 官方 Skills
├── docs/
│   └── skills.md     # Skills 索引
└── README.md
```

## 贡献

欢迎贡献 Skills！请查看 [贡献指南](CONTRIBUTING.md)。

## CLI 源码

CLI 工具源码：[skillwisp-cli](https://gitcode.com/norix77/skillwisp-cli)

## License

MIT
