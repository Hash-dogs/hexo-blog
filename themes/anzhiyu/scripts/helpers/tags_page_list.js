hexo.extend.helper.register('tags_page_list', function (type) {
  const tags = hexo.locals.get(type);

  // Manually sort tags based on the length of tag names
  const sortedTags = tags.reduce((acc, tag) => {
    const index = acc.findIndex((t) => t.length < tag.length);
    if (index === -1) {
      acc.push(tag);
    } else {
      acc.splice(index, 0, tag);
    }
    return acc;
  }, []);

  let html = ``;
  sortedTags.forEach((item) => {
    // 本站部署在 /hexo-blog/ 子路径下，href 必须带根路径，否则分类/标签链接会 404。
    // id 供 utils.js 与 decodeURIComponent(location.pathname) 比对，须保持未编码，
    // 因此用 config.root 直接拼接，不能走 url_for（它会把中文编码成 %XX）。
    const id = this.config.root + item.path;
    html += `
      <a href="${this.url_for(item.path)}" id="${id}">
        <span class="tags-punctuation">#</span>${item.name}
        <span class="tagsPageCount">${item.length}</span>
      </a>
    `;
  });

  return html;
});