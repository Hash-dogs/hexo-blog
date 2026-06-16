---
name: newblog-skill-design
description: 通用型博文发布助手 /newblog Skill 设计文档
metadata:
  type: project
---

# /newblog Skill 设计文档

## 概述

为 Claude Code 创建一个自定义 Skill `/newblog`，用于在本 Hexo 博客项目中高效完成博文研究、撰写、构建和发布的全流程操作。

## 目录结构

```
.claude/skills/newblog/
├── SKILL.md              # 主文件：工作流编排 + 三个检查点 + 两种分支规则
└── templates/
    └── post-template.md  # 博文 YAML front-matter 模板
```

## 工作流

```
用户 /newblog <描述>
  │
  ├─ 阶段1: 需求理解 ──── Claude 智能判断分支
  │   │  github热门 分支 → 搜索 GitHub Trending
  │   │  通用 分支 → 按用户描述自由研究
  │
  ├─ 阶段2: 素材研究
  │   │  WebSearch + WebFetch 收集信息
  │   │  整理核心卖点/创新点/架构数据
  │   ├─ 🔴 Checkpoint 1: 选题审查
  │   │   列出同分类已有文章 → 用户确认不重复
  │
  ├─ 阶段3: 博文撰写
  │   │  读取分类对应风格参考 → 按模板 + 分类规则写作
  │   │  保存到 source/_posts/ → npm run build 验证
  │   ├─ 🔴 Checkpoint 2: 内容审查
  │   │   展示全文 → 用户确认内容与格式
  │
  ├─ 阶段4: 发布
  │   │  git add → git commit
  │   ├─ 🔴 Checkpoint 3: 提交确认
  │   │  显示 remote + git user + 变更 → 用户确认后 push
```

## 两个分支

### github热门 分支
- 选题：GitHub Trending 中 AI Agent / LLM / MCP / Skill 相关仓库
- 章节结构：引言 → 项目背景 → 核心创新 → 深度解析 → 快速上手 → 总结
- 封面图：`https://opengraph.githubassets.com/1/{owner}/{repo}`
- 风格参考：`headroom-context-compression-intro.md`
- 标签：`[开源, AI, ...]` 按项目追加

### 通用 分支
- 选题：用户任意指定
- 章节结构：自由组织
- 封面图：可选
- 风格参考：同分类最近一篇博文（若有）
- 标签：按需定义

## 三个检查点

1. **选题审查**：列出同分类已有文章标题，防撞题
2. **内容审查**：展示博文全文，确认格式和内容
3. **提交确认**：展示 remote、git user、变更文件，确认后 push

## 涉及工具

- `WebSearch` / `WebFetch` — 素材搜索
- `Read` / `Write` / `Edit` — 博文文件操作
- `Bash` — 构建 (`npm run build`) 和 Git 操作
- `AskUserQuestion` — 三个检查点的用户确认
