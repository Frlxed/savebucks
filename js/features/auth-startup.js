/* The auth screen is statically rendered as sign-up. Keep mountAuth's internal
   mode in sync after its handlers have been attached by the preceding module. */
const screen = document.querySelector('#auth-screen');
const heading = document.querySelector('#auth-heading');
const switchButton = document.querySelector('#auth-switch');
if (screen && !screen.hidden && heading?.textContent === 'Welcome to SaveBucks' && switchButton && !switchButton.hidden) {
  switchButton.click();
}
