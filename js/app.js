document.addEventListener('DOMContentLoaded', function () {
  const sidebar = document.getElementById('sidebar');
  const toggleBtn = document.getElementById('toggle-btn');
  const menuBtn = document.getElementById('menu-btn');
  const overlay = document.getElementById('overlay');
  const navItems = document.querySelectorAll('.nav-item');
  const frame = document.getElementById('page-frame');
  const topbarTitle = document.getElementById('topbar-title');

  const pageNames = { hermes: 'Hermes', ccb: 'CCB', 'sql-http': 'SQL-HTTP', mem: 'MEM' };

  // ————— 切换页面 —————
  function switchPage(page) {
    navItems.forEach(function (item) {
      item.classList.toggle('active', item.dataset.page === page);
    });
    frame.src = 'pages/' + page + '.html';
    topbarTitle.textContent = 'NTN 总控台 — ' + (pageNames[page] || page);

    // 手机端切换后自动关侧边栏
    if (window.innerWidth <= 768) {
      sidebar.classList.remove('open');
      overlay.classList.remove('show');
    }
  }

  // ————— 侧边栏折叠（桌面端） —————
  toggleBtn.addEventListener('click', function () {
    sidebar.classList.toggle('collapsed');
  });

  // ————— 侧边栏打开/关闭（手机端） —————
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
      // 桌面端：确保侧边栏可见，移除手机状态
      sidebar.classList.remove('open');
      overlay.classList.remove('show');
    } else {
      // 手机端：展开侧边栏（如果是折叠状态）
      sidebar.classList.remove('collapsed');
    }
  }
  window.addEventListener('resize', handleResize);

  // ————— 启动加载 —————
  switchPage('hermes');
  handleResize();
});
