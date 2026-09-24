# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Hexo 7.3.0** static blog (Chinese-language tech blog), deployed on **GitHub Pages** (via `gh-pages` branch).

## Common Commands

```bash
# Development server (http://localhost:4000)
npm run server          # hexo server

# Build static site to public/
npm run build           # hexo generate

# Clean cache + public/
npm run clean           # hexo clean

# Create new post (creates source/_posts/<title>.md)
npx hexo new "Post Title"

# Create new page
npx hexo new page "About"

# Create draft
npx hexo new draft "Draft Title"

# Publish draft
npx hexo publish <draft-name>

# 手动推送博文到 IndexNow（Bing / Yandex / Naver / Seznam / Yep）
npm run indexnow        # 默认只推本次 git 变更的博文
npm run indexnow:all    # 推送 sitemap 里的全部博文
```

## Architecture

### Site Generation

**Hexo** generates a fully static site. Source files in `source/` (Markdown posts, pages, images) are rendered by the **anzhiyu** theme into `public/` using the **Pug** template engine + **Stylus** CSS preprocessor. No runtime backend.

### Key Files

| File | Purpose |
|---|---|
| `_config.yml` | Site-wide Hexo config (title, URL, theme, plugins, search) |
| `_config.anzhiyu.yml` | Theme configuration overrides (~1340 lines — menus, music, comments, CDN, etc.) |
| `.github/workflows/deploy.yml` | GitHub Actions: builds and deploys to `gh-pages` branch on push to `main` |
| `tools/indexnow.js` | 部署后把本次变更的博文推送给 IndexNow（零依赖，见下方 Important Notes） |

### Content Structure

```
source/
├── _posts/          # Blog posts (Markdown with YAML front-matter)
├── about/index.md   # About page
├── categories/index.md
├── tags/index.md
├── archives/index.md
├── link/index.md    # Friends/links page
└── images/          # Blog images
```

Front-matter for posts:

```yaml
---
title: Title
date: 2026-06-06 12:00:00
updated: 2026-06-06 12:00:00
categories: [Category]
tags: [tag1, tag2]
cover: /images/cover.jpg
description: SEO description
---
```

### Tags 标签规范

写博文选择 tags 时遵循以下优先级（详见 [memory/blog-tag-standards.md](memory/blog-tag-standards.md)）：

1. **优先使用已有标签** — 查阅下方标准化列表，不轻易创建新标签
2. **评估通用性** — 新标签应能用于未来多篇文章，而非仅限当前一篇
3. **遵循命名规范** — 中文优先，可数名词用复数，`AI Agent` 而非 `Agent`，`Skills` 而非 `Skill`

标准化标签速查：

| 分类 | 标签 |
|---|---|
| 领域 | `开源` `AI` `AI Agent` `LLM` `MCP` `Skills` `Claude Code` `技术分享` `观点分享` `安全` |
| 技术栈 | `Hermes Agent` `Rust` `Tauri` `Docker` `Markdown` |
| 场景 | `配置管理` `跨平台` `压缩` `Token优化` `飞书` `阿里云` `自动化` `研究工具` |

已废弃（不要在 tags 中使用）：`Agent` → `AI Agent`，`Skill` → `Skills`，`信息聚合` → `研究工具`，`文档转换` → `Markdown`

### Theme: AnZhiYu (`themes/anzhiyu/`)

A card-UI Hexo theme (v1.7.1, GPL-3.0, derived from Butterfly). Its structure:

- **`layout/`** — Pug templates: `index.pug`, `post.pug`, `page.pug`, plus extensive partials in `includes/` (head, header, sidebar, footer, widgets, third-party integrations for comments/search/chat/math)
- **`source/css/`** — Stylus stylesheets organized by layer (global, layout, page, highlight, search, tags)
- **`source/js/`** — Main JS bundles (main.js, utils.js, search, Chinese conversion)
- **`scripts/`** — Hexo extension scripts: events (merge_config, CDN, init), filters (lazyload, random_cover), helpers (aside archives, catalog, etc.), and 24 custom tag plugins (bilibili, gallery, tabs, note, mermaid, etc.)
- **`plugins.yml`** — CDN definitions for all external JS/CSS dependencies

Custom tag plugins are registered as Hexo tags — e.g., `{% bilibili BV1... %}`, `{% tabs ... %}` — and can be used directly in Markdown posts.

### Deployment

- **GitHub Pages**: GitHub Actions workflow (`.github/workflows/deploy.yml`) builds on push to `main` and deploys to `gh-pages` branch via `peaceiris/actions-gh-pages`.
- **Dependabot**: Daily npm dependency checks (up to 20 PRs at a time).

### Key Hexo Plugins

- **`hexo-generator-index`**, **`-archive`**, **`-category`**, **`-tag`** — standard paginated generators
- **`hexo-renderer-pug`** — Pug template rendering
- **`hexo-renderer-stylus`** — Stylus CSS preprocessing
- **`hexo-renderer-marked`** — Markdown rendering
- **`hexo-generator-feed`** — RSS/Atom feed
- **`hexo-generator-sitemap`** — sitemap.xml
- **`hexo-word-counter`** — word count for posts

## Important Notes

- **`AGENTS.md`** exists for Qoder (Alibaba's AI assistant) and is outdated — it references the default `landscape` theme. This project uses the **anzhiyu** theme.
- Always run `hexo clean` if you encounter unexpected behavior after config changes.
- The `public/` directory is gitignored (generated artifacts).
- Site URL is `https://hash-dogs.github.io/hexo-blog/` (GitHub Pages project site). The `root: /hexo-blog/` config must remain set.
- Language is `zh-CN`, timezone `Asia/Shanghai`.
- **`source/d9d28193ba55be2a2293b0516158bef5.txt` 勿删、勿改名。** 它是 IndexNow 的归属凭证，Hexo 会原样拷到 `public/` 供 `https://hash-dogs.github.io/hexo-blog/<key>.txt` 访问，`tools/indexnow.js` 每次请求都靠它证明站点归属。该文件一旦缺失或内容对不上，推送会全部返回 403。性质同 `googleee91582b4b178b35.html`。
  因为站点在 `/hexo-blog/` 子路径下、主机根目录不属于本站，密钥无法放到根目录，只能通过请求里的 `keyLocation` 声明——IndexNow 允许这样，但附带一条限制：子目录里的密钥只对该目录及其子目录下的 URL 有效。本站所有 URL 都在 `/hexo-blog/` 之下，条件满足。若将来迁到自有域名根目录，最省事的做法是把密钥文件挪到根目录并去掉 `keyLocation`。
