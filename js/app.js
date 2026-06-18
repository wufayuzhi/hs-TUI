document.addEventListener('DOMContentLoaded', function () {
  const sidebar = document.getElementById('sidebar');
  const toggleBtn = document.getElementById('toggle-btn');
  const menuBtn = document.getElementById('menu-btn');
  const overlay = document.getElementById('overlay');
  const navItems = document.querySelectorAll('.nav-item');
  const frame = document.getElementById('page-frame');
  const topbarTitle = document.getElementById('topbar-title');

  const pageNames = { hermes: 'Hermes', ccb: 'CCB', 'sql-http': 'SQL-HTTP', mem: 'MEM' };

  // ————— 页面切换 —————
  function switchPage(page) {
    navItems.forEach(function (item) {
      item.classList.toggle('active', item.dataset.page === page);
    });
    frame.src = 'pages/' + page + '.html';
    topbarTitle.textContent = pageNames[page] || page;

    // 手机端：切换后自动关闭侧边栏
    if (window.innerWidth <= 768) {
      sidebar.classList.remove('open');
      overlay.classList.remove('show');
    }
  }

  // ————— 桌面端：折叠/展开 —————
  toggleBtn.addEventListener('click', function () {
    sidebar.classList.toggle('collapsed');
  });

  // ————— 手机端：打开/关闭菜单 —————
  menuBtn.addEventListener('click', function () {
    sidebar.classList.toggle('open');
    overlay.classList.toggle('show');
  });
  overlay.addEventListener('click', function () {
    sidebar.classList.remove('open');
    overlay.classList.remove('show');
  });

  // ————— 导航点击 —————
  navItems.forEach(function (item) {
    item.addEventListener('click', function (e) {
      e.preventDefault();
      switchPage(this.dataset.page);
    });
  });

  // ————— 窗口尺寸变化 —————
  function handleResize() {
    if (window.innerWidth > 768) {
      sidebar.classList.remove('open');
      overlay.classList.remove('show');
    }
  }
  window.addEventListener('resize', handleResize);

  // ————— 记忆侧边栏状态 —————
  var savedCollapsed = localStorage.getItem('sidebarCollapsed');
  if (savedCollapsed === 'true' && window.innerWidth > 768) {
    sidebar.classList.add('collapsed');
  }
  var origToggle = toggleBtn.addEventListener;
  toggleBtn.addEventListener('click', function () {
    setTimeout(function () {
      localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
    }, 50);
  });

  // ————— 启动 ────
  switchPage('hermes');
  handleResize();
});
