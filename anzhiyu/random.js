var posts=["2026/06/06/headroom-context-compression-intro/","2026/06/12/hello-world/","2026/06/11/hermes-agent-feishu-life-empowerment/","2026/06/06/microsoft-markitdown-intro/"];function toRandomPost(){
    pjax.loadUrl('/'+posts[Math.floor(Math.random() * posts.length)]);
  };