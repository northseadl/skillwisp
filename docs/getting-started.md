# 快速开始

本指南帮助你在 5 分钟内开始使用 SkillWisp。

## 安装 CLI

### 方式一：使用 npx（推荐）

无需安装，直接运行：

```bash
npx skillwisp add <skill-name>
```

### 方式二：全局安装

```bash
pnpm add -g @skillwisp/cli
```

## 安装你的第一个技能

```bash
# 安装 git-commit 技能
skillwisp add git-commit

# 或使用 npx
npx skillwisp add git-commit
```

安装完成后，你的 AI Agent（如 Claude）就会获得 Git 提交规范的专业能力！

## 查看已安装技能

```bash
skillwisp list
```

输出示例：

```
📦 已安装的技能:

  [claude]
    • git-commit
      Git 提交规范技能

  [gemini]
    • hello-world
      示例技能
```

## 创建自己的技能

```bash
skillwisp create my-skill
cd skill-my-skill
```

这会生成以下结构：

```
skill-my-skill/
├── SKILL.md    # 技能定义文件
└── README.md   # 说明文档
```

编辑 `SKILL.md`，然后推送到你的 Git 仓库即可分享！

## 从自定义仓库安装

```bash
# 从 cnb.cool
skillwisp add https://cnb.cool/username/skill-name

# 从 Gitee
skillwisp add https://gitee.com/username/skill-name

# 从 GitHub
skillwisp add https://github.com/username/skill-name
```

## 下一步

- [SKILL.md 格式规范](./skill-format.md)
- [技能目录](https://skillwisp.dev/explore)
- [API 参考](./api-reference.md)
