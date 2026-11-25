export function mountNavigation({ onWorkspaceChange = () => {} } = {}) {
  const sidebar = document.querySelector('.sidebar');
  // Settings is in a separate nav group; listen on the sidebar, not only the first nav.
  sidebar.addEventListener('click', (event) => {
    const link = event.target.closest('.nav-link[data-workspace]');
    if (!link || !sidebar.contains(link)) return;
    event.preventDefault();
    sidebar.querySelectorAll('.nav-link[data-workspace]').forEach((item) => {
      item.classList.toggle('active', item === link);
      item.setAttribute('aria-current', item === link ? 'page' : 'false');
    });
    onWorkspaceChange(link.dataset.workspace);
    document.body.classList.remove('sidebar-open');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}
