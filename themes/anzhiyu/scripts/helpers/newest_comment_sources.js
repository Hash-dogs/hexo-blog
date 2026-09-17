/**
 * AnZhiYu
 * for console newest comments
 * 生成「评论页 URL -> 可读来源标题」映射，供中控台最新评论卡片标注来源。
 * Twikoo 的 GET_RECENT_COMMENTS 只返回 id/url/nick/avatar/comment/created，
 * 不带页面标题，所以标题只能在这里构建期算好。
 */

"use strict";

hexo.extend.helper.register("newest_comment_sources", function () {
  const { config } = this;
  const sources = {};

  const add = (path, title) => {
    if (!path || !title) return;
    sources[this.url_for(path)] = title;
  };

  this.site.posts.forEach(post => add(post.path, post.title));
  this.site.pages.forEach(page => add(page.path, page.title));

  // 留言板由 hexo-butterfly-envelope 生成，不落在 site.pages 里，需从站点配置补
  const envelope = config.envelope_comment;
  if (envelope && envelope.enable && envelope.path) {
    const frontMatter = envelope.front_matter || {};
    add(`${envelope.path}/`, frontMatter.title || "留言板");
  }

  return JSON.stringify(sources);
});
