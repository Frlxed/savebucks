export function mountNavigation({ onWorkspaceChange = () => {} } = {}) {
  const nav = document.querySelector('.sidebar .nav-links');
  nav.addEventListener('click', (event) => {
    const link = event.target.closest('.nav-link[data-workspace]');
    if (!link || !nav.contains(link)) return;
    event.preventDefault();
    nav.querySelectorAll('.nav-link').forEach((item) => item.classList.toggle('active', item === link));
    onWorkspaceChange(link.dataset.workspace);
    document.body.classList.remove('sidebar-open');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}
