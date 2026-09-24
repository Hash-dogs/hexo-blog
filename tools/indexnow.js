#!/usr/bin/env node
/**
 * IndexNow 主动推送
 *
 * 把博文 URL 主动提交给 IndexNow，Bing / Yandex / Naver / Seznam / Yep 会据此来抓取。
 * Google 不支持该协议。
 *
 * 本站的坑：站点跑在 hash-dogs.github.io 的 /hexo-blog/ 子路径下，主机根目录不属于
 * 本站，因此密钥文件只能放在 /hexo-blog/ 下，并在每次请求里带 keyLocation 显式声明。
 * IndexNow 允许这么做，但附带一条作用域限制：放在子目录的密钥只对该目录及其子目录
 * 下的 URL 有效。本站所有 URL 都在 /hexo-blog/ 之下，条件满足。
 *
 * 前置条件：先跑过 npm run build。sitemap 与待校验的 public/ 密钥文件都来自 public/。
 *
 * 日常交给 CI 即可（push 到 main 会自动跑）。本地手动跑会在提交前额外校验每条 URL
 * 在线上确实存在，因为本机构建的永久链接日期可能与线上差一天（见 assertUrlsLive）。
 *
 * 用法：
 *   node tools/indexnow.js              # 只推送本次 git 变更的博文
 *   node tools/indexnow.js --all        # 忽略 git diff，推送 sitemap 里全部博文
 *   node tools/indexnow.js --dry-run    # 只打印将提交的 URL，不发任何请求
 *
 * CI 里由 .github/workflows/deploy.yml 在部署成功后调用，用 INDEXNOW_SINCE 注入
 * github.event.before 作为 git diff 的基线。基线不可用时：
 *   - push 事件：回落为全量推送（宁可多推，不能漏推）
 *   - 非 push 事件（workflow_dispatch）：默认不推送，需要全量请勾选 indexnow_all
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const SITE_BASE = 'https://hash-dogs.github.io/hexo-blog';
const HOST = 'hash-dogs.github.io';
const ENDPOINT = 'https://api.indexnow.org/indexnow';

// 密钥。必须与 source/<KEY>.txt 的文件名和内容三者完全一致，任何一处对不上都会
// 导致 IndexNow 返回 403。该文件是归属凭证，勿删、勿改名。
const KEY = 'd9d28193ba55be2a2293b0516158bef5';
const KEY_LOCATION = `${SITE_BASE}/${KEY}.txt`;

const ROOT = path.resolve(__dirname, '..');
const SITEMAP = path.join(ROOT, 'public', 'sitemap.xml');
const KEY_FILE = path.join(ROOT, 'source', `${KEY}.txt`);
const PUBLIC_KEY_FILE = path.join(ROOT, 'public', `${KEY}.txt`);
const POSTS_DIR = 'source/_posts';

// 博文永久链接形态 /:year/:month/:day/:slug/。用它把博文 URL 和 sitemap 里同样存在
// 的标签/分类页（如 /tags/开源/）区分开，避免 slug 撞名。
const POST_URL_RE = /\/\d{4}\/\d{2}\/\d{2}\/([^/]+)\/$/;

const CHUNK_SIZE = 1000; // IndexNow 单次上限 10000 条，留足余量
const REQUEST_TIMEOUT_MS = 15000;
const SUBMIT_TIMEOUT_MS = 60000;
const SUBMIT_RETRIES = 3;
// 这些是临时性错误，先退避重试；其余状态码是确定性问题，立刻失败。
const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);
const FATAL_HINT = '400 格式错误 / 403 密钥问题 / 422 URL 不属于该 host / 429 请求过多';

// 密钥上线校验。GitHub Pages 在 gh-pages 分支推上去之后还要构建才对外可见，
// 通常 30~120s，所以预算给得比「感觉够用」宽松一些。
const KEY_CHECK_TRIES = 20;
const KEY_CHECK_INTERVAL_MS = 15000;

function die(message) {
  console.error(`\n✖ ${message}\n`);
  process.exit(1);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function git(args, options = {}) {
  return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', ...options });
}

function isCommit(rev) {
  try {
    git(['cat-file', '-e', `${rev}^{commit}`], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * 判断 rev 是否为 head 的祖先。
 * 光用 cat-file -e 只能证明对象在本地存在：history rewrite 之后，旧提交可能仍被
 * 别的分支或标签引用着，于是 diff 出来的是「分叉点之后的所有提交」——看着合理，
 * 其实完全不对。exit 1 表示不是祖先，128 表示对象不存在，两个方向都算不可用。
 */
function isAncestor(rev, head) {
  try {
    git(['merge-base', '--is-ancestor', rev, head], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function assertSiteConfig() {
  if (new URL(SITE_BASE).host !== HOST) {
    die(
      `SITE_BASE 与 HOST 不一致：\n` +
        `  SITE_BASE = ${SITE_BASE}\n` +
        `  HOST      = ${HOST}\n` +
        `  HOST 必须是纯主机名，不能带协议或路径，否则 IndexNow 会返回 400。`
    );
  }
}

/** 密钥文件自检：确定性配置错误，越早暴露越好。source/ 与 public/ 都要查。 */
function assertKeyFile() {
  const targets = [
    ['source', KEY_FILE, ''],
    ['public', PUBLIC_KEY_FILE, '（请先执行 npm run build）']
  ];

  for (const [label, file, hint] of targets) {
    if (!fs.existsSync(file)) {
      die(
        `${label}/ 下找不到密钥文件 ${path.basename(file)}。${hint}\n` +
          `  该文件是 IndexNow 的归属凭证，删除或改名会导致推送全部被拒（403）。`
      );
    }

    const buf = fs.readFileSync(file);

    // 必须按字节查 BOM。String.trim() 会把 U+FEFF 当空白吃掉（它属于 ECMAScript 的
    // WhiteSpace），只用 trim() 判断的话带 BOM 的文件会「通过自检」，但线上那份会被
    // IndexNow 判为格式非法。Windows 上尤其容易踩到：PowerShell 的
    // Set-Content / Out-File -Encoding utf8 默认写入 BOM。
    if (buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) {
      die(
        `${label}/${path.basename(file)} 带 UTF-8 BOM，IndexNow 要求无 BOM 的纯文本。\n` +
          `  用不带 BOM 的方式重写该文件（不要用 PowerShell 的 Set-Content / Out-File -Encoding utf8）。`
      );
    }

    const text = buf.toString('utf8');
    if (text !== KEY && text !== `${KEY}\n` && text !== `${KEY}\r\n`) {
      // 只截前 120 字符：文件若被外部工具（DLP / 杀软）换成了二进制，全量打印
      // 会把几 KB 乱码灌进 CI 日志。JSON.stringify 是为了让不可见字符显形。
      const shown = text.length > 120 ? `${text.slice(0, 120)}…（共 ${text.length} 字符）` : text;
      die(
        `${label}/${path.basename(file)} 内容不是密钥本体。\n` +
          `  期望：${JSON.stringify(KEY)}（允许末尾恰好一个换行）\n` +
          `  实际：${JSON.stringify(shown)}\n` +
          `  若实际内容是一堆乱码，多半是企业 DLP 或杀软把该文件加密/隔离了。`
      );
    }
  }
}

/** 解析 public/sitemap.xml，返回 slug -> 博文 URL 的映射。 */
function readSitemapSlugs() {
  if (!fs.existsSync(SITEMAP)) {
    die(`找不到 public/sitemap.xml，请先执行 npm run build。`);
  }

  const xml = fs.readFileSync(SITEMAP, 'utf8');
  const map = new Map();

  for (const match of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    const url = match[1].trim();

    // 守住站点前缀。_config.yml 里的 url / root 一改，这里就会解析出别的站点的
    // URL，提交上去只会换回一个语焉不详的 422。
    // 首页那条 <loc> 是站点根，没有尾斜杠（https://host/hexo-blog），所以要一并放行。
    if (url !== SITE_BASE && !url.startsWith(`${SITE_BASE}/`)) {
      die(
        `sitemap 里的 URL 不属于本站：\n  ${url}\n` +
          `  期望前缀 ${SITE_BASE}/\n` +
          `  多半是 _config.yml 的 url / root 改了，而本脚本顶部的 SITE_BASE 没跟着改。`
      );
    }

    const hit = url.match(POST_URL_RE);
    if (!hit) continue;
    try {
      map.set(decodeURIComponent(hit[1]), url);
    } catch {
      console.log(`  ! 跳过无法解码的 URL：${url}`);
    }
  }
  return map;
}

/**
 * 确定 git diff 的对比范围，返回 { base, head, reason }。
 * base 为 null 表示「算不出增量」，由调用方决定是回落全量还是安静结束。
 */
function resolveRange() {
  const head = (process.env.GITHUB_SHA || 'HEAD').trim();
  const since = (process.env.INDEXNOW_SINCE || '').trim();
  const eventName = process.env.GITHUB_EVENT_NAME || '本地运行';

  if (!since) {
    // 本地运行时退一步对比 HEAD~1，图个方便；CI 里的非 push 事件不猜。
    if (!process.env.CI && isCommit('HEAD~1')) return { base: 'HEAD~1', head, reason: '' };
    return { base: null, head, reason: `${eventName} 事件不携带 before 基线` };
  }
  if (/^0+$/.test(since)) {
    return { base: null, head, reason: '基线为全零 SHA（分支首次推送）' };
  }
  if (!isCommit(since)) {
    return { base: null, head, reason: `基线 ${since.slice(0, 7)} 在本地不存在（force push 后已游离）` };
  }
  if (!isAncestor(since, head)) {
    return {
      base: null,
      head,
      reason: `基线 ${since.slice(0, 7)} 不是 ${head.slice(0, 7)} 的祖先（history rewrite）`
    };
  }
  return { base: since, head, reason: '' };
}

/** 返回 { added: [{file, slug}], removed: [{file, slug}] }。 */
function diffPosts(base, head) {
  let output;
  try {
    // --no-renames 把重命名拆成 D + A 两行，于是每条记录恰好带一个路径 —— 下面
    // i += 2 的步长依赖这一点，别去掉这个参数。
    // -z 改用 NUL 分隔，避免 core.quotePath 把非 ASCII 路径转义成 "\344\270\255"
    // 那种形式。本仓库是中文博客，将来出现中文文件名就会踩到。
    output = git([
      '-c',
      'core.quotePath=false',
      'diff',
      '--name-status',
      '--no-renames',
      '-z',
      base,
      head,
      '--',
      POSTS_DIR
    ]);
  } catch (err) {
    die(`git diff ${base}..${head} 执行失败：\n${err.stderr || err.message}`);
  }

  const tokens = output.split('\0');
  const added = [];
  const removed = [];

  for (let i = 0; i + 1 < tokens.length; i += 2) {
    const status = tokens[i];
    const file = tokens[i + 1];
    if (!status || !file) continue;

    const slug = path.basename(file).replace(/\.md$/, '');
    if (status[0] === 'D') removed.push({ file, slug });
    else if ('AMT'.includes(status[0])) added.push({ file, slug });
    else console.log(`  ! 忽略未知状态 ${status}：${file}`);
  }

  return { added, removed };
}

/**
 * 预检密钥文件是否已上线。这一步把「密钥还没生效」和「提交被拒」区分开，
 * 避免第一次跑出一个看不懂的 403。
 */
async function checkKeyLocation() {
  console.log(`  校验密钥文件是否已上线（最多等 ${(KEY_CHECK_TRIES * KEY_CHECK_INTERVAL_MS) / 1000}s）…`);

  let lastStatus = '(未发出请求)';
  let lastBody = '';

  for (let attempt = 1; attempt <= KEY_CHECK_TRIES; attempt++) {
    try {
      // 带 ?cb= 绕开 GitHub Pages 的 CDN 缓存。注意这个 query 只用于校验，
      // 提交时 body 里的 keyLocation 必须是干净的 URL。
      const res = await fetch(`${KEY_LOCATION}?cb=${Date.now()}`, {
        cache: 'no-store',
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
      });
      lastBody = '';

      if (res.ok) {
        lastBody = (await res.text()).trim();
        if (lastBody === KEY) return true;
        // 内容不符也继续重试：CDN 有可能把缓存的 404 页面以 200 吐出来。
        lastStatus = `HTTP ${res.status}（内容不符）`;
      } else {
        lastStatus = `HTTP ${res.status}`;
      }
    } catch (err) {
      lastStatus = err.name === 'TimeoutError' ? '请求超时' : err.message;
    }

    console.log(`  第 ${attempt}/${KEY_CHECK_TRIES} 次：${lastStatus}`);
    if (attempt < KEY_CHECK_TRIES) await sleep(KEY_CHECK_INTERVAL_MS);
  }

  console.error(
    `  最后一次响应：${lastStatus}${lastBody ? `，内容 ${JSON.stringify(lastBody.slice(0, 120))}` : ''}`
  );
  return false;
}

/**
 * 本地运行专用：逐个确认目标 URL 在线上确实存在。
 *
 * 本机构建的 public/sitemap.xml 与线上未必一致 —— 永久链接的日期跟随构建机时区
 * （CI 是 UTC，本机是 Asia/Shanghai），front-matter 时间在 08:00 之前的博文两边会
 * 差一天。实测有 4 篇如此，本机那套日期在线上是 404。把 404 的 URL 推给搜索引擎
 * 纯粹是噪音，所以本地跑之前先拦住。
 *
 * CI 里不做这个校验：那时新博文刚推到 gh-pages，Pages 还没构建完，页面本来就还没
 * 上线，校验只会每次都误报。
 */
async function assertUrlsLive(urls) {
  console.log(`  本地运行，先确认这 ${urls.length} 条在线上存在…`);
  const failures = [];

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        method: 'HEAD',
        redirect: 'follow',
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
      });
      if (!res.ok) failures.push(`${url}  →  HTTP ${res.status}`);
    } catch (err) {
      failures.push(`${url}  →  ${err.message}`);
    }
  }

  if (failures.length === 0) {
    console.log('  ✓ 全部存在');
    return;
  }

  die(
    `以下 ${failures.length} 条 URL 在线上取不到：\n` +
      failures.map(f => `  ${f}`).join('\n') +
      `\n\n  最常见的原因是本机构建与线上构建的时区不同：Hexo 永久链接的日期跟随\n` +
      `  构建机时区，CI 跑在 UTC、本机在 Asia/Shanghai，front-matter 时间早于\n` +
      `  08:00 的博文两边会差一天。要拿与线上一致的 URL，请让 CI 去推送\n` +
      `  （push 到 main 即可），或先在 CI 上确认线上日期后再手工核对。`
  );
}

async function submit(urls) {
  let submitted = 0;

  for (let i = 0; i < urls.length; i += CHUNK_SIZE) {
    const chunk = urls.slice(i, i + CHUNK_SIZE);
    const payload = JSON.stringify({
      host: HOST,
      key: KEY,
      keyLocation: KEY_LOCATION,
      urlList: chunk
    });

    let accepted = false;

    for (let attempt = 1; attempt <= SUBMIT_RETRIES && !accepted; attempt++) {
      let res;
      let body;

      try {
        res = await fetch(ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
          body: payload,
          signal: AbortSignal.timeout(SUBMIT_TIMEOUT_MS)
        });
        body = (await res.text()).trim();
      } catch (err) {
        if (attempt < SUBMIT_RETRIES) {
          const wait = 2000 * attempt;
          console.log(`  ! 请求失败（${err.message}），${wait / 1000}s 后重试`);
          await sleep(wait);
          continue;
        }
        die(
          `IndexNow 请求失败：${err.message}\n` +
            `  已成功 ${submitted} 条，失败 ${chunk.length} 条（首个：${chunk[0]}）`
        );
      }

      // 200 = 已接收；202 = 已接收，密钥校验排队中。
      if (res.status === 200 || res.status === 202) {
        console.log(`  HTTP ${res.status}，本批 ${chunk.length} 条已接收`);
        accepted = true;
        break;
      }

      // 确定性错误，重试没有意义。
      if (!RETRYABLE_STATUS.has(res.status)) {
        die(
          `IndexNow 拒绝了本次提交：HTTP ${res.status}\n` +
            `  响应：${body || '(空)'}\n` +
            `  对照：${FATAL_HINT}\n` +
            `  已成功 ${submitted} 条，失败 ${chunk.length} 条（首个：${chunk[0]}）`
        );
      }

      if (attempt === SUBMIT_RETRIES) {
        die(
          `IndexNow 连续 ${SUBMIT_RETRIES} 次拒绝提交：HTTP ${res.status}\n` +
            `  响应：${body || '(空)'}\n` +
            `  对照：${FATAL_HINT}\n` +
            `  已成功 ${submitted} 条，失败 ${chunk.length} 条（首个：${chunk[0]}）`
        );
      }

      const retryAfter = Number(res.headers.get('retry-after'));
      const wait =
        Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 2000 * 2 ** (attempt - 1);
      console.log(
        `  ! HTTP ${res.status}，${Math.round(wait / 1000)}s 后重试（第 ${attempt}/${SUBMIT_RETRIES} 次）`
      );
      await sleep(wait);
    }

    submitted += chunk.length;
  }

  return submitted;
}

async function main() {
  const flags = new Set(process.argv.slice(2));
  const dryRun = flags.has('--dry-run');
  const forceAll = flags.has('--all');

  console.log('IndexNow 推送');

  assertSiteConfig();
  const slugToUrl = readSitemapSlugs();
  console.log(`  sitemap 解析出 ${slugToUrl.size} 条博文 URL`);

  assertKeyFile();
  console.log(`  ✓ 密钥文件自检通过（source/ 与 public/ 各一份）`);

  let urls = [];

  if (forceAll) {
    urls = [...slugToUrl.values()];
    console.log('  --all：提交 sitemap 里全部博文');
  } else {
    const { base, head, reason } = resolveRange();

    if (base) {
      const { added, removed } = diffPosts(base, head);
      console.log(
        `  变更范围 ${base.slice(0, 7)}..${head.slice(0, 7)}：` +
          `新增/修改 ${added.length} 篇，删除 ${removed.length} 篇`
      );

      const seen = new Set();
      for (const { slug } of added) {
        const url = slugToUrl.get(slug);
        if (!url) {
          console.log(`  ! ${slug} 不在 sitemap 里（草稿？未生成？），跳过`);
          continue;
        }
        if (!seen.has(url)) {
          seen.add(url);
          urls.push(url);
        }
      }
      // 已删除的博文不再提交。IndexNow 没有删除语义（引擎自己爬到 404 就会除名），
      // 而反推旧 URL 并不可靠：Hexo 的永久链接日期跟随构建机时区，CI 跑在 UTC、
      // 本机在 Asia/Shanghai，front-matter 里字面写的日期未必等于线上那一串
      // （实测有 4 篇已发布博文两地相差一天）。宁可跳过也不推一个不存在的 URL。
      for (const { slug } of removed) {
        console.log(`  - 已删除的 ${slug}：不提交（引擎会自行爬到 404 并除名）`);
      }
    } else if (process.env.GITHUB_EVENT_NAME === 'push' || !process.env.CI) {
      // push 事件下基线坏掉 = 这次推送的变更范围算不出来，宁可全量也不能漏推。
      urls = [...slugToUrl.values()];
      console.log(`  ! ${reason}：无法确定增量范围，回落为全量提交（${urls.length} 条）`);
    } else {
      // 非 push 事件（workflow_dispatch）默认不猜，安静结束。
      console.log(`  ! ${reason}：非 push 事件默认不推送，结束。`);
      console.log('    需要全量推送：workflow_dispatch 勾选 indexnow_all，或本地 npm run indexnow:all。');
      return;
    }
  }

  if (urls.length === 0) {
    console.log('本次没有需要推送的博文，结束。');
    return;
  }

  console.log(`  待推送 ${urls.length} 条：`);
  for (const url of urls) console.log(`    ${url}`);

  if (dryRun) {
    console.log('\n--dry-run：未发送任何请求。');
    return;
  }

  if (!(await checkKeyLocation())) {
    die(
      `密钥文件在线上取不到：${KEY_LOCATION}\n` +
        `  确认它已随部署发布到 GitHub Pages。若刚部署完，可能是 Pages 还没构建完，稍后重跑即可。`
    );
  }
  console.log('  ✓ 密钥文件已上线');

  // 仅在本地运行时做线上校验，CI 里跳过（理由见 assertUrlsLive 注释）。
  if (!process.env.CI) await assertUrlsLive(urls);

  const count = await submit(urls);
  console.log(`\n完成，共提交 ${count} 条。`);
}

main().catch(err => die(err.stack || String(err)));
