document.addEventListener('DOMContentLoaded', function () {
  const navItems = document.querySelectorAll('.nav-item');
  const frame = document.getElementById('page-frame');

  // 切换页面
  function switchPage(page) {
    // 更新导航高亮
    navItems.forEach(function (item) {
      item.classList.toggle('active', item.dataset.page === page);
    });

    // 切换 iframe
    frame.src = 'pages/' + page + '.html';
  }

  // 点击导航
  navItems.forEach(function (item) {
    item.addEventListener('click', function (e) {
      e.preventDefault();
      switchPage(this.dataset.page);
    });
  });

  // 默认加载 Hermes
  switchPage('hermes');
});
