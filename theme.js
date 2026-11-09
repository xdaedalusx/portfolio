// Light is the default. The choice is remembered on this device.
(function () {
  var root = document.documentElement;
  function saved() { try { return localStorage.getItem('theme'); } catch (e) { return null; } }
  function apply(theme) {
    root.setAttribute('data-theme', theme);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#090909' : '#ffffff');
    var button = document.querySelector('.theme-toggle');
    if (button) {
      var next = theme === 'dark' ? 'light' : 'dark';
      button.setAttribute('aria-label', 'Switch to ' + next + ' theme');
      button.setAttribute('title', 'Switch to ' + next + ' theme');
    }
  }
  apply(saved() === 'dark' ? 'dark' : 'light');   // before first paint, so there is no flash
  document.addEventListener('DOMContentLoaded', function () {
    apply(root.getAttribute('data-theme'));
    var button = document.querySelector('.theme-toggle');
    if (!button) return;
    button.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      apply(next);
      try { localStorage.setItem('theme', next); } catch (e) { /* private mode: just don't remember */ }
    });
  });
})();
