hexo.extend.helper.register("catalog_list", function (type) {
  let html = ``;
  hexo.locals.get(type).map((item) => {
    // 同 tags_page_list：href 必须带站点根路径；id 需未编码以匹配 utils.js 的比对。
    const id = this.config.root + item.path;
    html += `
    <div class="catalog-list-item" id="${id}">
      <a href="${this.url_for(item.path)}">
        ${item.name}
      </a>
    </div>
    `;
  });
  return html;
});
