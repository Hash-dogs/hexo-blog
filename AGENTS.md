# AGENTS.md

This file provides guidance to Qoder (lingma.aliyun.com) when working with code in this repository.

## Project Overview

This is a **Hexo static blog** project. Hexo is a fast, simple, and powerful blog framework built on Node.js. It converts Markdown files into static HTML pages that can be deployed to GitHub Pages, Vercel, Netlify, or any static hosting service.

## Common Commands

### Development
```bash
# Start local development server (default: http://localhost:4000)
hexo server
# or shorthand
hexo s

# Generate static files
hexo generate
# or shorthand
hexo g

# Clean generated files and cache
hexo clean
```

### Content Creation
```bash
# Create a new post
hexo new "Post Title"
# Creates: source/_posts/Post-Title.md

# Create a new page
hexo new page "About"
# Creates: source/about/index.md

# Create a draft post
hexo new draft "Draft Title"
# Creates: source/_drafts/Draft-Title.md
```

### Deployment
```bash
# Deploy to configured remote (GitHub Pages, etc.)
hexo deploy
# or shorthand
hexo d

# Generate and deploy in one command
hexo g && hexo d
```

### NPM Scripts (package.json)
```bash
npm run build    # Generate static files
npm run clean    # Clean generated files
npm run deploy   # Deploy to remote
npm run server   # Start development server
```

## Project Structure

```
Blog-qcode/
├── _config.yml          # Site configuration (title, theme, deployment, etc.)
├── _config.landscape.yml # Theme-specific configuration
├── package.json         # Dependencies and scripts
├── scaffolds/           # Templates for new posts/pages/drafts
│   ├── post.md         # Post template (with front-matter)
│   ├── page.md         # Page template
│   └── draft.md        # Draft template
├── source/             # Source content directory
│   ├── _posts/         # Blog posts (Markdown files)
│   ├── _drafts/        # Draft posts (not published by default)
│   ├── about/          # Static pages
│   ├── categories/     # Category pages
│   └── tags/           # Tag pages
├── themes/             # Theme files
│   └── landscape/      # Default theme (installed via npm)
├── public/             # Generated static files (gitignored)
└── node_modules/       # Dependencies (gitignored)
```

## Key Configuration Files

### `_config.yml` - Main Configuration
- **Site metadata**: title, subtitle, description, author, language
- **URL settings**: `url` and `permalink` structure
- **Directory settings**: source_dir, public_dir, tag_dir, etc.
- **Writing settings**: new_post_name, default_layout, syntax_highlighter
- **Theme**: currently set to `landscape`
- **Deployment**: configure git-based deployment here

### `_config.landscape.yml` - Theme Configuration
- Theme-specific settings for the Landscape theme
- Customize colors, navigation, sidebar, etc.

## Front-Matter Format

All posts use YAML front-matter at the top of Markdown files:

```yaml
---
title: Post Title
date: 2026-06-06 12:00:00
tags: [tag1, tag2]
categories: [Category]
description: Brief description for SEO
---
```

## Architecture Notes

- **Static Site Generation**: Hexo generates all pages at build time, not runtime
- **Template Engine**: Uses Nunjucks (EJS also supported) for templates
- **CSS Preprocessor**: Stylus is included by default
- **Markdown Renderer**: Marked.js for Markdown parsing
- **Asset Pipeline**: Supports Less/Sass, Babel, PostCSS via plugins

## Theme Management

Current theme: **landscape** (default, installed as `hexo-theme-landscape`)

To install a new theme:
```bash
npm install hexo-theme-next --save
# Then update _config.yml: theme: next
```

Popular Chinese-friendly themes:
- hexo-theme-next
- hexo-theme-butterfly
- hexo-theme-fluid
- hexo-theme-yun

## Plugin System

Plugins are installed via npm and configured in `_config.yml`:

```bash
npm install hexo-generator-feed --save  # RSS feed
npm install hexo-generator-sitemap --save  # Sitemap for SEO
npm install hexo-related-popular-posts --save  # Related posts
```

## Deployment Options

### GitHub Pages (Recommended for beginners)
1. Configure `_config.yml`:
```yaml
deploy:
  type: git
  repo: https://github.com/username/username.github.io.git
  branch: main
```
2. Install deployer: `npm install hexo-deployer-git --save`
3. Run: `hexo deploy`

### Other platforms
- **Vercel**: Connect GitHub repo, build command `hexo generate`, output `public`
- **Netlify**: Build command `hexo generate`, publish directory `public`
- **Cloudflare Pages**: Same as above

## Development Workflow

1. **Create content**: `hexo new "My New Post"`
2. **Edit**: Write Markdown in `source/_posts/`
3. **Preview**: `hexo server` (live reload enabled)
4. **Generate**: `hexo generate` (or auto-generated on deploy)
5. **Deploy**: `hexo deploy`

## Important Notes

- The `public/` directory contains generated files and should NOT be committed to version control
- Always run `hexo clean` if you encounter unexpected behavior after config changes
- Posts with future dates won't be generated unless `future: true` is set in `_config.yml`
- Use `hexo new draft` for work-in-progress posts, publish with `hexo publish <draft-name>`
