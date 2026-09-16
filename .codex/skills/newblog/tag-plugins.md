# 安知鱼标签插件速查（本仓库实测版）

写博文时用这些标签替代纯 Markdown，让排版更清晰。本文件是 `themes/anzhiyu/scripts/tag/*.js` 的**实测整理**，不是官方文档的抄录。

> ⚠️ **为什么以源码为准**：官方文档 <https://hexo.anheyu.com/posts/d50a.html> 描述的是上游 npm 包 `hexo-butterfly-tag-plugins-plus`，而**本仓库没有安装这个包**（`package.json` 里没有，`node_modules` 里也不存在）。真正生效的是主题里 vendored 的 24 个脚本，共注册 **42 个标签**。照抄官方文档会写出「用了却没效果」的标签。

---

## 一、三种分隔符体系（写错分隔符是第一大翻车原因）

| 分隔符 | 适用标签 | 说明 |
|---|---|---|
| **逗号 + 空格**<br>`url, key=值` | `image`、`inlineimage`、`site` | 源码是 `split(', ')`，**逗号后必须有空格**，只写逗号会被当成一整块 |
| **逗号**<br>`样式, 内容` | `p`、`span`、`btn`、`cell`、`checkbox`、`radio`、`folding`、`timeline`、`tabs`、`hideInline`、`hideBlock`、`hideToggle`、`link`、`gallery`、`videos`、`icon` | 裸逗号即可，两侧空格会被 `trim()` 容忍 |
| **纯空格**<br>`参数 参数` | `note`、`label`、`tip`、`btns`、`u`/`emp`/`wavy`/`del`/`kbd`/`psw`、`galleryGroup`、`inlineImg`、`audio`、`video`、`dogeplayer`、`intCard`、`bilibili` | 完全不要写逗号 |

「逗号」组里，逗号**前面**那个字段内部又是空格分隔的 —— 这就是官方文档 `样式参数(参数以空格划分), 文本内容` 的含义。

---

## 二、必读陷阱

| 陷阱 | 后果 / 正确写法 |
|---|---|
| `p` / `span` 单参数 | `{% p 文本 %}` 会在 `span.js` 里对 `undefined` 调 `.trim()`，抛 `TypeError` **中断构建**。必须写 `{% p 样式, 文本 %}`，样式可留空：`{% p , 文本 %}` |
| `p` / `span` 正文含逗号 | 源码只取 `args[0]`、`args[1]`，正文里的逗号会把内容**截断** |
| `tabs` / `timeline` 正文换行 | 内部正则要求 `-->\n`。`<!-- tab A -->正文` 写在同一行，**正文会被静默丢弃** |
| `folding` 的颜色是裸属性 | 输出 `<details class="folding-tag" blue>`，CSS 靠 `[blue]` 属性选择器命中 |
| `note` 样式无需手写 | `_config.anzhiyu.yml` 里 `note.style: flat` 会自动补上 |
| 未知标签会让构建失败 | Hexo 7.3 走 Nunjucks，`{% bogustag x %}` 抛 `unknown block tag`。**好处是 `npm run build` 是可靠兜底**，拼错不会静默漏过。代码块内的 `{% %}` 会被转义，可安全用于示例 |
| 官方文档 ≠ 本仓库（已实测） | `logo`/`code`（p/span 字号）、`gray`（checkbox）在本主题**不存在**；`video` 文档说支持对齐与列数，源码 `media.js` 只读 `args[0]`，**选项未实现** |

---

## 三、文本行内

### p / span

```
{% p 样式参数(空格划分), 文本内容 %}
{% span 样式参数(空格划分), 文本内容 %}
```

样式 token 可任意组合（**已对源码 CSS 核实**）：

| 维度 | 取值 |
|---|---|
| 对齐 | `left`、`center`、`right` |
| 字号 | `small`、`large`、`huge`、`ultra`、`h1`、`h2`、`h3`、`h4`、`h5` |
| 字重 | `bold` |
| 颜色 | `red`、`yellow`、`green`、`cyan`、`blue`、`purple`、`gray` |
| 其他 | `subtitle` |

```
{% p red, 红色文字 %}
{% p center large, 居中大字 %}
{% span blue, 蓝色行内 %}
```

### 行内标记（纯空格，无参数）

| 标签 | 效果 | 示例 |
|---|---|---|
| `u` | 下划线 | `{% u 下划线 %}` |
| `emp` | 着重号 | `{% emp 着重号 %}` |
| `wavy` | 波浪线 | `{% wavy 波浪线 %}` |
| `del` | 删除线 | `{% del 删除线 %}` |
| `kbd` | 键盘样式 | `{% kbd Ctrl %}` |
| `psw` | 密码点 | `{% psw 这里没有验证码 %}` |

### label（纯空格）

```
{% label 文本 颜色 %}
```

颜色可省略（默认 `default`）：`default`、`blue`、`pink`、`red`、`purple`、`orange`、`green`

```
{% label 推荐 blue %}
```

### icon

```
{% icon 图标id, 尺寸em %}
```

尺寸默认 `1`。图标 id 来自主题 iconfont，如 `{% icon anzhiyu-icon-rocket, 1.5 %}`。

---

## 四、提示与折叠

### note（纯空格）—— 最常用

```
{% note 类型 %}
内容，支持 Markdown
{% endnote %}
```

**类型（两种写法都支持）：**

- 语义类：`default`、`primary`、`info`、`success`、`warning`、`danger`，可加 `no-icon`
- 颜色类：`default`、`blue`、`pink`、`red`、`purple`、`orange`、`green`，可加自定义图标

样式 `simple`/`modern`/`flat`/`disabled` 可覆盖主题配置，但**本站默认 `flat`，一般不用写**。

```
{% note info %}
AI 的能力无上限，但承诺一旦兑现不了，信任就有了尽头。
{% endnote %}

{% note warning %}
这条会被渲染成扁平警告块。
{% endnote %}
```

另有行为一致的 `subnote` 标签。

### tip（纯空格）

```
{% tip 类名 %}
内容
{% endtip %}
```

类名：`info`、`success`、`warning`、`error`、`bolt`、`ban`、`home`、`sync`、`cogs`、`key`、`bell`

### folding（逗号）

```
{% folding 颜色/状态, 标题 %}
内容，支持 Markdown
{% endfolding %}
```

- 颜色：`purple`、`blue`、`cyan`、`green`、`yellow`、`orange`、`red`
- 默认展开：在第一个字段加 `open`，可与颜色并用

```
{% folding blue, 点击查看详情 %}
这里是折叠内容。
{% endfolding %}

{% folding cyan open, 默认展开 %}
已展开的内容。
{% endfolding %}
```

### hideInline / hideBlock / hideToggle（逗号）

```
{% hideInline 内容, 按钮文字, 背景色, 文字色 %}
{% hideBlock 按钮文字, 背景色, 文字色 %}内容{% endhideBlock %}
{% hideToggle 按钮文字, 背景色, 文字色 %}内容{% endhideToggle %}
```

- `hideInline` 是行内隐藏，内容**不能含英文逗号**（用 `&sbquo;` 代替）和直引号（用 `&apos;`）
- `hideToggle` 会用背景色画 1px 边框
- 隐藏内容里**不要放 `h1`–`h6`**，否则目录仍会收录这些标题

---

## 五、选项卡与时间线

### tabs（逗号）

```
{% tabs 唯一名称, 默认选中第几个 %}
<!-- tab 标签标题 @图标 -->
内容，支持 Markdown
<!-- endtab -->
{% endtabs %}
```

- **名称必填且每篇内唯一**，会转成 DOM id
- 第二个参数省略时默认选中第 1 个；`-1` 表示全部不选中
- `<!-- tab -->` 的**正文必须换行**，同一行会被吞掉
- 标题可省略只留图标：`<!-- tab @anzhiyufont anzhiyu-icon-rocket -->`

```
{% tabs 计费口径 %}
<!-- tab 官方宣传 -->
100 美元每月的 Max 5x = Pro 的 5 倍额度
<!-- endtab -->
<!-- tab 诉状实测 -->
Max 5x 实测约为 Pro 的 3.5 倍
<!-- endtab -->
{% endtabs %}
```

另有行为一致的 `subtabs`、`subsubtabs`。

### timeline（逗号）

```
{% timeline 总标题, 颜色 %}
<!-- timeline 子标题 -->
子内容
<!-- endtimeline -->
{% endtimeline %}
```

颜色：`blue`、`pink`、`red`、`purple`、`orange`、`green`（可省略）。同样**正文必须换行**。

```
{% timeline 事件回顾, blue %}
<!-- timeline 8月31日 -->
ChatGPT Work 整体中断约 3 小时。
<!-- endtimeline -->
{% endtimeline %}
```

---

## 六、按钮与卡片

### btn（逗号）

```
{% btn url,文字,图标,颜色 样式 布局 位置 尺寸 %}
```

第 4 个字段内部**空格分隔**：

| 维度 | 取值 |
|---|---|
| 颜色 | `default`、`blue`、`pink`、`red`、`purple`、`orange`、`green` |
| 样式 | `outline`（描边），默认实心 |
| 布局 | `block`（独占一行），默认行内 |
| 位置 | `center`、`right`（**仅在 `block` 下有意义**） |
| 尺寸 | `larger` |

```
{% btn https://hexo.io,官网,anzhiyufont anzhiyu-icon-link,blue outline %}
{% btn https://hexo.io,查看文档,,block center larger %}
```

### btns + cell（外层纯空格，cell 用逗号）

```
{% btns 布局参数 %}
{% cell 标题, 链接, 图片或图标 %}
{% endbtns %}
```

- 布局：`wide`、`fill`、`center`、`around`、`grid2`–`grid5`；圆角：`rounded`、`circle`
- `cell` 第 3 项只有含 `" anzhiyufont"` 时才当图标，否则当图片 URL
- 单元格内可用 `<b>标题</b>` 和 `<p>描述</p>`

```
{% btns grid2 rounded %}
{% cell Hexo, https://hexo.io, https://hexo.io/icon/favicon-32x32.png %}
{% cell AnZhiYu, https://hexo.anheyu.com, anzhiyufont anzhiyu-icon-rocket %}
{% endbtns %}
```

### link（逗号）

```
{% link 标题, 站点描述, 链接, 图标链接(可选) %}
```

链接以 `/` 开头视为站内，用主题 favicon；站外自动取对方 `/favicon.ico`。

```
{% link Hexo, 快速、简洁且高效的博客框架, https://hexo.io %}
```

### site + sitegroup（逗号 + 空格）

```
{% sitegroup 分组标题(可选) %}
{% site 标题, url=链接, screenshot=截图, avatar=头像(可选), description=描述(可选) %}
{% endsitegroup %}
```

### flink（YAML 正文）

```
{% flink %}
- class_name: 友情链接
  class_desc: 那些人，那些事
  flink_style: anzhiyu
  link_list:
    - name: Hexo
      link: https://hexo.io
      avatar: https://hexo.io/icon/favicon-32x32.png
      descr: 快速、简洁且高效的博客框架
{% endflink %}
```

`flink_style` 取 `anzhiyu` 或 `flexcard`（默认）。YAML 缩进敏感，**必须用 `- ` 列表形式**。`flexcard` 额外支持 `siteshot`。

---

## 七、媒体

| 标签 | 分隔符 | 语法 |
|---|---|---|
| `image` | 逗号+空格 | `{% image 链接, alt=描述, width=宽度, height=高度, bg=占位色 %}` |
| `inlineimage` | 逗号+空格 | `{% inlineimage 链接, height=22px %}`（默认 `1.5em`） |
| `inlineImg` | 纯空格 | `{% inlineImg 链接 150px %}`（**驼峰大小写必须一致**） |
| `audio` | 纯空格 | `{% audio 音频链接 %}` |
| `video` | 纯空格 | `{% video 视频链接 %}`（**不支持对齐/列数选项**） |
| `videos` | 逗号 | `{% videos, 2 %}` … `{% endvideos %}`（1–4 列） |
| `bilibili` | 纯空格 | `{% bilibili BV1xx411c7mD 12:34 %}`（可传完整 URL；第 3 参数 `true` 隐藏简介） |
| `dogeplayer` | 纯空格 | `{% dogeplayer userId vcode %}` |

`image` 的 `alt` 会同时渲染成图注；`bg` 是加载占位色，如 `bg=#f2f2f2`。

### gallery（逗号）

```
{% gallery %}
![描述](图片链接)
![描述](图片链接)
{% endgallery %}

{% gallery 是否懒加载, 行高, 每页数量 %}
{% gallery url,远程JSON链接,是否懒加载,行高,每页数量 %}
```

默认：懒加载 `false`、行高 `220`、每页 `10`。想跳过某一项就留空，如 `{% gallery true,,10 %}`；末项可写 `true` 显示「加载更多」按钮。

### galleryGroup（纯空格）

```
<div class="gallery-group-main">
{% galleryGroup 分组名 描述 跳转链接 封面图 %}
</div>
```

**必须包在 `<div class="gallery-group-main">` 里**才会正确排版。

---

## 八、列表与图表

### checkbox / radio（逗号）

```
{% checkbox 样式, 文本 %}
{% radio 样式, 文本 %}
```

样式字段空格分隔：形状 `plus`、`minus`、`times`；颜色 `red`、`green`、`yellow`、`cyan`、`blue`；选中加 `checked`。文本支持简单 Markdown。

```
{% checkbox green checked, 已完成项 %}
{% radio blue, 单选项 %}
```

### mermaid（块级）

```
{% mermaid %}
graph TD
  A[开始] --> B[结束]
{% endmermaid %}
```

主题已启用（`mermaid.enable: true`）。

> ⚠️ **不要写 ` ```mermaid ` 围栏** —— `hexo-renderer-marked` 会把它当普通代码块渲染成源码，不会触发标签。只有合法 mermaid 语法才能用标签；纯 ASCII 流程图转标签后会渲染成空白。

---

## 九、构建期自检

`npm run build` 是可靠兜底：未注册的标签会抛 `unknown block tag` 直接构建失败。但**标签语法错误（如 `p` 少写逗号、`tabs` 正文没换行）可能不报错却渲染异常**，所以写完博文后除了看构建结果，还应确认关键块在页面上真的出现了。
