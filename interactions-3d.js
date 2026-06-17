/* ============================================================
   VERITAS — 3D interactions
   - boots WebGL scene(s) on any <canvas class="hero-canvas">
   - mouse-reactive 3D tilt on cards
   - subtle scroll parallax on hero canvas
   ============================================================ */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- boot scenes ---------- */
  function boot() {
    if (!window.VeritasScene) return;
    document.querySelectorAll('canvas.hero-canvas').forEach(function (cv) {
      var mode = cv.getAttribute('data-mode') || 'hero';
      window.VeritasScene.init(cv, { mode: mode });
    });
  }
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(boot, 0);
  } else {
    window.addEventListener('DOMContentLoaded', boot);
  }
  // also try on full load in case the CDN script was slow
  window.addEventListener('load', function () {
    if (window.VeritasScene && !window.__veritasBooted) { window.__veritasBooted = true; }
  });

  /* ---------- 3D tilt on cards ---------- */
  if (!reduce && window.matchMedia('(pointer:fine)').matches) {
    var sel = '.svc-card, .compare-card, .ind-card, .stat-card, .cred-card, .value-card, .step, .facts-card, .contact-card';
    var cards = Array.prototype.slice.call(document.querySelectorAll(sel));
    cards.forEach(function (card) {
      card.classList.add('tilt3d');
      var glare = document.createElement('span');
      glare.className = 'tilt-glare';
      glare.setAttribute('aria-hidden', 'true');
      card.appendChild(glare);

      var rect = null;
      function enter() { rect = card.getBoundingClientRect(); }
      function move(e) {
        if (!rect) rect = card.getBoundingClientRect();
        var px = (e.clientX - rect.left) / rect.width;   // 0..1
        var py = (e.clientY - rect.top) / rect.height;   // 0..1
        var rx = (0.5 - py) * 9;   // rotateX
        var ry = (px - 0.5) * 11;  // rotateY
        card.style.transform = 'perspective(900px) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg) translateZ(6px)';
        glare.style.opacity = '1';
        glare.style.background =
          'radial-gradient(circle at ' + (px * 100).toFixed(1) + '% ' + (py * 100).toFixed(1) + '%, rgba(232,178,74,.18), transparent 55%)';
      }
      function leave() {
        rect = null;
        card.style.transform = '';
        glare.style.opacity = '0';
      }
      card.addEventListener('pointerenter', enter);
      card.addEventListener('pointermove', move);
      card.addEventListener('pointerleave', leave);
    });
  }

  /* ---------- hero canvas scroll parallax ---------- */
  var heroCanvas = document.querySelector('.hero .hero-canvas');
  if (heroCanvas && !reduce) {
    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var y = window.scrollY || window.pageYOffset;
        var f = Math.min(y / 900, 1);
        heroCanvas.style.transform = 'translateY(' + (y * 0.18).toFixed(1) + 'px) scale(' + (1 + f * 0.06).toFixed(3) + ')';
        heroCanvas.style.opacity = (1 - f * 0.55).toFixed(3);
        ticking = false;
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
  }
})();
