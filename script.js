/**
 * K Bros Landscaping — Interlock Repair Landing Page
 * Comparison Slider
 *
 * Responsibilities:
 *  - Sync the "before" clip image width to the wrapper so it never shifts
 *  - Respond to mouse, touch, and keyboard (←/→ arrow keys) input
 *  - Allow clicking anywhere on the wrapper to jump the handle
 *  - Expose `initComparisonSlider()` as a plain function so it can be
 *    re-called if the page ever hot-reloads a section
 */

(function () {
  'use strict';

  /** Clamp a value between min and max (inclusive). */
  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function initComparisonSlider() {
    var wrapper = document.querySelector('.comparison-wrapper');
    var clip    = document.getElementById('comparison-clip');
    var handle  = document.getElementById('comparison-handle');

    if (!wrapper || !clip || !handle) return;

    var beforeImg = clip.querySelector('img');
    var rafPending = false;    // rAF guard to prevent duplicate frames
    var currentPct = 50;       // Track position for keyboard steps

    // ── Sync before-image size to wrapper dimensions ──────────────────
    // The "before" image sits inside a clipped element. Its width must
    // always equal the *full* wrapper width so it appears unscaled while
    // only the clip region changes.
    function syncImageSize() {
      var w = wrapper.offsetWidth;
      var h = wrapper.offsetHeight;
      beforeImg.style.width  = w + 'px';
      beforeImg.style.height = h + 'px';
      beforeImg.style.maxWidth = 'none'; // override any inherited constraint
    }

    // Call once on load, again on image decode, and on every resize
    syncImageSize();
    if (!beforeImg.complete) {
      beforeImg.addEventListener('load', syncImageSize, { once: true });
    }
    window.addEventListener('resize', syncImageSize);

    // ── Update handle and clip position ──────────────────────────────
    function setPercent(pct) {
      currentPct = clamp(pct, 0, 100);
      clip.style.width   = currentPct + '%';
      handle.style.left  = currentPct + '%';
      handle.setAttribute('aria-valuenow', Math.round(currentPct));
    }

    // ── Pointer → percentage conversion ──────────────────────────────
    function pctFromPointer(e) {
      var rect   = wrapper.getBoundingClientRect();
      var clientX = (e.touches && e.touches.length > 0)
                    ? e.touches[0].clientX
                    : e.clientX;
      return ((clientX - rect.left) / rect.width) * 100;
    }

    // ── Drag handlers ─────────────────────────────────────────────────
    function onPointerMove(e) {
      if (rafPending) return;
      rafPending = true;
      var pct = pctFromPointer(e);
      window.requestAnimationFrame(function () {
        setPercent(pct);
        rafPending = false;
      });
    }

    function onPointerUp() {
      document.removeEventListener('mousemove',  onPointerMove);
      document.removeEventListener('mouseup',    onPointerUp);
      document.removeEventListener('touchmove',  onPointerMove);
      document.removeEventListener('touchend',   onPointerUp);
      wrapper.classList.remove('active');
    }

    // Mouse drag
    handle.addEventListener('mousedown', function (e) {
      e.preventDefault(); // prevent text selection during drag
      wrapper.classList.add('active');
      document.addEventListener('mousemove', onPointerMove);
      document.addEventListener('mouseup',   onPointerUp);
    });

    // Touch drag
    handle.addEventListener('touchstart', function () {
      wrapper.classList.add('active');
      document.addEventListener('touchmove', onPointerMove, { passive: true });
      document.addEventListener('touchend',  onPointerUp);
    }, { passive: true });

    // Click anywhere on the wrapper to jump the slider
    wrapper.addEventListener('click', function (e) {
      // Ignore clicks that originated on or inside the handle itself
      if (e.target === handle || handle.contains(e.target)) return;
      setPercent(pctFromPointer(e));
    });

    // ── Keyboard support (WCAG 2.1 §4.1.2) ──────────────────────────
    // Arrow keys move the handle in 5 % steps; Home/End jump to extremes.
    handle.addEventListener('keydown', function (e) {
      var step = 5;
      var map  = {
        ArrowLeft:  -step,
        ArrowRight:  step,
        ArrowUp:     step,
        ArrowDown:  -step,
        Home:       -100,
        End:         100,
      };
      if (!(e.key in map)) return;
      e.preventDefault();
      setPercent(currentPct + map[e.key]);
    });

    // ── Initialise at 50 % ────────────────────────────────────────────
    setPercent(50);
  }

  // Run after the DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initComparisonSlider);
  } else {
    initComparisonSlider();
  }

}());

/**
 * Before / During / After — 3-stage panel switcher
 * Handles tab clicks, prev/next buttons, dot indicators and keyboard nav.
 */
(function () {
  'use strict';

  var STAGES = ['before', 'during', 'after'];

  function initBDA() {
    var tabs    = document.querySelectorAll('.bda-tab');
    var panels  = document.querySelectorAll('.bda-panel');
    var dots    = document.querySelectorAll('.bda-dot');
    var prevBtn = document.getElementById('bda-prev');
    var nextBtn = document.getElementById('bda-next');

    if (!tabs.length || !panels.length) return;

    var current = 0; // index into STAGES

    function activateStage(index) {
      // Clamp
      index = Math.max(0, Math.min(STAGES.length - 1, index));
      current = index;

      tabs.forEach(function (tab, i) {
        var active = i === index;
        tab.classList.toggle('bda-tab--active', active);
        tab.setAttribute('aria-selected', active ? 'true' : 'false');
      });

      panels.forEach(function (panel, i) {
        var active = i === index;
        panel.hidden = !active;
        if (active) {
          // Re-trigger entrance animation
          panel.classList.remove('bda-panel--active');
          void panel.offsetWidth; // force reflow
          panel.classList.add('bda-panel--active');
        }
      });

      dots.forEach(function (dot, i) {
        dot.classList.toggle('bda-dot--active', i === index);
      });

      if (prevBtn) prevBtn.disabled = index === 0;
      if (nextBtn) {
        nextBtn.disabled = index === STAGES.length - 1;
        nextBtn.classList.toggle('bda-nav-btn--next', index < STAGES.length - 1);
      }
    }

    // Tab clicks
    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { activateStage(i); });
    });

    // Dot clicks
    dots.forEach(function (dot, i) {
      dot.addEventListener('click', function () { activateStage(i); });
    });

    // Prev / Next
    if (prevBtn) prevBtn.addEventListener('click', function () { activateStage(current - 1); });
    if (nextBtn) nextBtn.addEventListener('click', function () { activateStage(current + 1); });

    // Keyboard: arrow keys on focused tabs
    tabs.forEach(function (tab, i) {
      tab.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault();
          var next = Math.min(i + 1, STAGES.length - 1);
          tabs[next].focus();
          activateStage(next);
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault();
          var prev = Math.max(i - 1, 0);
          tabs[prev].focus();
          activateStage(prev);
        }
      });
    });

    // Init
    activateStage(0);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBDA);
  } else {
    initBDA();
  }

}());
