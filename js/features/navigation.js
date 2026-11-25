export function mountNavigation({ onWorkspaceChange = () => {} } = {}) {
  const nav = document.querySelector('.nav-links');
  nav.addEventListener('click', (event) => {
    const link = event.target.closest('.nav-link');
    if (!link || !nav.contains(link)) return;

    event.preventDefault();
    nav.querySelectorAll('.nav-link').forEach((item) => item.classList.toggle('active', item === link));
    onWorkspaceChange(link.dataset.workspace || 'overview');
  });
}
