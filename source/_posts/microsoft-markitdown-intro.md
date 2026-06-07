---
title: GitHub 本周热门：microsoft/markitdown — 微软开源的通用文件转 Markdown 工具
date: 2026-06-07
updated: 2026-06-07
categories:
  - github热门
tags:
  - 开源
  - AI
  - Markdown
  - 文档转换
cover: https://opengraph.githubassets.com/1/microsoft/markitdown
description: microsoft/markitdown 本周以 15,000+ stars 登顶 GitHub 热门榜首，这是一个强大的 Python 工具，可将 PDF、Office 文档、图片、音视频等多种格式一键转换为 Markdown，专为 LLM 数据处理和文本分析管线设计。
---

## 引言

本周 GitHub Trending 排行榜上，**microsoft/markitdown** 以 **15,015 stars** 的增量登顶周榜第一，目前总 Star 数已突破 **147,000**，Fork 超过 **10,000**。作为一个由微软开源并维护的 Python 工具，它正在迅速成为 AI 开发者进行文档预处理的首选方案。

项目地址：[https://github.com/microsoft/markitdown](https://github.com/microsoft/markitdown)  
最新版本：**v0.1.6**（2026 年 5 月 26 日发布）  
许可证：MIT

---

## 什么是 MarkItDown？

MarkItDown 是一个轻量级的 Python 实用工具，专门用于将各种格式的文件转换为 Markdown，以服务于 **LLM（大语言模型）数据处理** 和 **文本分析管线**。它的设计理念非常明确：Markdown 是最接近纯文本的标记语言，Token 占用少，而主流 LLM（如 GPT-4o 等）本身就在海量 Markdown 文本上训练过，天然"理解"Markdown 的结构化语义。

> 🔑 **一句话概括**：将任何文档转换为 LLM 最能理解的格式——Markdown。

---

## 支持的文件格式

MarkItDown 目前支持极为广泛的文件格式：

| 类别 | 格式 |
|------|------|
| 📄 文档 | PDF、Word（.docx）、PowerPoint（.pptx）、Excel（.xlsx/.xls） |
| 🖼️ 图片 | 支持 EXIF 元数据提取和 OCR 文字识别 |
| 🎵 音频 | 支持 EXIF 元数据和语音转文字 |
| 🌐 网页 | HTML |
| 📝 纯文本 | CSV、JSON、XML |
| 📚 电子书 | EPUB |
| 📦 压缩包 | ZIP（自动迭代遍历内容） |
| ▶️ 视频 | YouTube 链接（获取字幕内容） |
| 📧 邮件 | Outlook 邮件（.msg） |

---

## 快速上手

### 安装

```bash
pip install 'markitdown[all]'
```

也可以按需安装特定格式支持：

```bash
pip install 'markitdown[pdf, docx, pptx]'
```

### 命令行使用

最简单的用法：

```bash
# 将 PDF 转换为 Markdown
markitdown document.pdf > output.md

# 指定输出文件
markitdown document.pdf -o output.md

# 管道输入
cat document.pdf | markitdown
```

### Python API 使用

```python
from markitdown import MarkItDown

md = MarkItDown()
result = md.convert("report.xlsx")
print(result.text_content)
```

### 使用 LLM 进行图片描述

```python
from markitdown import MarkItDown
from openai import OpenAI

client = OpenAI()
md = MarkItDown(llm_client=client, llm_model="gpt-4o")
result = md.convert("example.jpg")
print(result.text_content)
```

---

## v0.1.6 版本新特性

最新版本于 2026 年 5 月 26 日发布，主要更新包括：

- **🆕 OCR 插件支持** — 为 PDF、DOCX、PPTX、XLSX 中的嵌入图片和扫描件提供 OCR 文字提取（使用 LLM Vision 技术）
- **🆕 Azure Content Understanding 集成** — 支持文档、图片、音频、视频的多模态转换，可自定义分析器提取结构化字段
- **🐛 修复 PDF 转换内存泄漏** — 修复了 PDF 转换过程中的 O(n) 内存增长问题
- **🔧 修复深层嵌套 HTML 递归错误** — 提高复杂 HTML 文件的兼容性
- **🔒 安全策略完善** — 完善了安全方面的 README 说明

---

## 插件系统

MarkItDown 支持第三方插件生态。查找可用插件可以搜索 GitHub 标签 `#markitdown-plugin`。启用插件：

```bash
markitdown --use-plugins document.pdf
```

官方提供的 `markitdown-ocr` 插件利用 LLM Vision 对文档中的图片进行 OCR 文字提取，无需额外的机器学习库依赖。

---

## Azure 集成

MarkItDown 提供两种微软云集成方案：

1. **Azure Document Intelligence** — 云端文档布局提取，适合高精度 OCR 需求
2. **Azure Content Understanding** — 高级多模态转换，支持结构化字段提取（如发票金额、合同条款），并以 YAML front matter 形式输出

对于需要处理音视频文件或需要结构化字段提取的场景，Azure Content Understanding 是最佳选择。

---

## 为什么选择 MarkItDown？

1. **LLM 原生兼容** — Markdown 是 Token 效率最高的文档格式之一，LLM 天然理解
2. **格式覆盖面广** — 几乎涵盖了日常开发中遇到的所有文档格式
3. **微软官方维护** — 背靠微软，持续更新，社区活跃（147k+ Stars，10k+ Forks）
4. **插件可扩展** — 支持第三方插件，生态持续壮大
5. **多云集成** — 可与 Azure 云服务无缝对接，满足企业级需求

---

## 总结

在 AI 时代，文档预处理是数据管线的关键一环。microsoft/markitdown 凭借其丰富的格式支持、简洁的 API 设计和活跃的社区生态，迅速成为开发者的首选工具。无论你是需要为 RAG 系统处理文档、为 LLM 准备训练数据，还是只是想在各种格式之间灵活转换，MarkItDown 都值得加入你的工具箱。

本周 15,000+ stars 的强势表现，也印证了社区对这一方向的高度认可。

---

*本文基于 [microsoft/markitdown](https://github.com/microsoft/markitdown) 仓库 README 及 PyPI 信息编写，数据截至 2026 年 6 月 7 日。*
