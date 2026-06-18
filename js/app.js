document.addEventListener('DOMContentLoaded', function () {
  var sidebar = document.getElementById('sidebar');
  var toggleBtn = document.getElementById('toggle-btn');
  var menuBtn = document.getElementById('menu-btn');
  var overlay = document.getElementById('overlay');
  var navItems = document.querySelectorAll('.nav-item');
  var frame = document.getElementById('page-frame');
  var topbarTitle = document.getElementById('topbar-title');

  var pageTitles = { hermes: 'Hermes', ccb: 'CCB', 'sql-http': 'SQL-HTTP', mem: 'MEM' };

  var isMobile = function () { return window.innerWidth <= 768; };

  // 切换页面
  function switchPage(page) {
    navItems.forEach(function (item) {
      item.classList.toggle('active', item.dataset.page === page);
    });
    frame.src = 'pages/' + page + '.html';
    topbarTitle.textContent = pageTitles[page] || page;
    if (isMobile()) {
      sidebar.classList.remove('open');
      overlay.classList.remove('show');
    }
  }

  // 桌面端：折叠/展开
  toggleBtn.addEventListener('click', function () {
    sidebar.classList.toggle('collapsed');
    localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
  });

  // 手机端：打开/关闭
  menuBtn.addEventListener('click', function () {
    sidebar.classList.toggle('open');
    overlay.classList.toggle('show');
  });
  overlay.addEventListener('click', function () {
    sidebar.classList.remove('open');
    overlay.classList.remove('show');
  });

  // 导航点击
  navItems.forEach(function (item) {
    item.addEventListener('click', function (e) {
      e.preventDefault();
      switchPage(this.dataset.page);
    });
  });

  // 窗口变化
  window.addEventListener('resize', function () {
    if (!isMobile()) {
      sidebar.classList.remove('open');
      overlay.classList.remove('show');
    }
  });

  // 恢复记忆
  if (localStorage.getItem('sidebarCollapsed') === 'true' && !isMobile()) {
    sidebar.classList.add('collapsed');
  }

  // 启动
  switchPage('hermes');
});
