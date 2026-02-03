# SkillWisp

为 Claude Code、Cursor、Gemini 等 AI 编程助手安装 Skills 的命令行工具。

这里是 SkillWisp 的资源仓库，收录了 [Anthropic](https://github.com/anthropics/skills)、[Vercel](https://github.com/vercel-labs/agent-skills)、[OpenAI](https://github.com/openai/skills)、[Obsidian](https://github.com/kepano/obsidian-skills) 等官方及社区的 74 个 Skills。你也可以直接从下方索引手动下载。

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

### Anthropic

| Skill | 描述 | 安装 |
|-------|------|------|
| [@anthropic/pdf](skills/@anthropic/pdf) | PDF 处理 | `skillwisp install pdf` |
| [@anthropic/docx](skills/@anthropic/docx) | Word 文档 | `skillwisp install docx` |
| [@anthropic/xlsx](skills/@anthropic/xlsx) | Excel | `skillwisp install xlsx` |
| [@anthropic/mcp-builder](skills/@anthropic/mcp-builder) | MCP 服务器生成 | `skillwisp install mcp-builder` |
| [@anthropic/frontend-design](skills/@anthropic/frontend-design) | 前端设计 | `skillwisp install frontend-design` |

### Vercel

| Skill | 描述 | 安装 |
|-------|------|------|
| [@vercel/react-best-practices](skills/@vercel/react-best-practices) | React 最佳实践 | `skillwisp install react-best-practices` |
| [@vercel/web-design-guidelines](skills/@vercel/web-design-guidelines) | Web 界面规范 | `skillwisp install web-design-guidelines` |
| [@vercel/vercel-deploy](skills/@vercel/vercel-deploy) | Vercel 部署 | `skillwisp install vercel-deploy` |

### OpenAI

| Skill | 描述 | 安装 |
|-------|------|------|
| [@openai/playwright](skills/@openai/playwright) | 浏览器自动化 | `skillwisp install @openai/playwright` |
| [@openai/figma](skills/@openai/figma) | Figma 设计 | `skillwisp install @openai/figma` |
| [@openai/sora](skills/@openai/sora) | AI 视频生成 | `skillwisp install @openai/sora` |
| [@openai/speech](skills/@openai/speech) | 文本转语音 | `skillwisp install @openai/speech` |
| [@openai/transcribe](skills/@openai/transcribe) | 音频转写 | `skillwisp install @openai/transcribe` |

### AWS (itsmostafa)

| Skill | 描述 | 安装 |
|-------|------|------|
| [@itsmostafa/lambda](skills/@itsmostafa/lambda) | AWS Lambda | `skillwisp install lambda` |
| [@itsmostafa/s3](skills/@itsmostafa/s3) | AWS S3 | `skillwisp install s3` |
| [@itsmostafa/dynamodb](skills/@itsmostafa/dynamodb) | AWS DynamoDB | `skillwisp install dynamodb` |

### 其他

| Skill | 描述 | 安装 |
|-------|------|------|
| [@obsidian/obsidian-markdown](skills/@obsidian/obsidian-markdown) | Obsidian Markdown | `skillwisp install obsidian-markdown` |
| [@lackeyjb/playwright-skill](skills/@lackeyjb/playwright-skill) | Playwright 自动化 | `skillwisp install playwright-skill` |


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

- 选择 `.agent` (主源) 时，资源存储在 `.agent` 目录，其他 App 通过符号链接指向主源
- 不选择 `.agent` 时，资源直接复制到每个选中的 App 目录
- Windows 或 `--no-symlink` 时始终复制文件

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
│   ├── @anthropic/   # Anthropic Skills
│   ├── @vercel/      # Vercel Skills
│   ├── @openai/      # OpenAI Skills
│   ├── @obsidian/    # Obsidian Skills
│   ├── @itsmostafa/  # AWS Skills
│   └── @lackeyjb/    # Playwright Skill
├── docs/
│   └── skills.md     # Skills 索引
└── README.md
```

## 贡献

欢迎贡献 Skills！请查看 [贡献指南](CONTRIBUTING.md)。

## CLI 源码

CLI 工具源码：[skillwisp-cli](https://github.com/northseadl/skillwisp-cli)

## 镜像

- **GitHub**: [northseadl/skillwisp](https://github.com/northseadl/skillwisp)
- **GitCode**: [norix77/skillwisp](https://gitcode.com/norix77/skillwisp)

## License

MIT
