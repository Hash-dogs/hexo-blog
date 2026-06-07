var posts=["2026/06/06/hello-world/","2026/06/07/microsoft-markitdown-intro/"];function toRandomPost(){
    pjax.loadUrl('/'+posts[Math.floor(Math.random() * posts.length)]);
  };