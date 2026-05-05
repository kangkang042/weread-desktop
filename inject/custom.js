const { ipcRenderer } = require('electron');

// ===== Custom title bar =====
const TITLE_BAR_HEIGHT = 36;

function createTitleBar() {
  if (document.getElementById('weread-titlebar')) return;
  const bar = document.createElement('div');
  bar.id = 'weread-titlebar';
  bar.style.cssText = `position:fixed;top:0;left:0;right:0;height:${TITLE_BAR_HEIGHT}px;z-index:1000;-webkit-app-region:drag;`;
  document.body.insertBefore(bar, document.body.firstChild);
}

// Push fixed/sticky/absolute headers down so they aren't hidden behind custom title bar
function pushFixedHeadersDown() {
  // Track elements we've already adjusted to avoid infinite loops
  if (!window._wereadPushedHeaders) window._wereadPushedHeaders = new WeakSet();

  document.querySelectorAll('div, header, nav, section, [class*="header" i], [class*="topbar" i], [class*="navbar" i], [class*="title" i], [class*="readerTop" i], [class*="readerHeader" i]').forEach((el) => {
    if (window._wereadPushedHeaders.has(el)) return;
    if (el.id === 'weread-titlebar') return;
    const cs = window.getComputedStyle(el);
    const pos = cs.position;
    if (pos !== 'fixed' && pos !== 'sticky' && pos !== 'absolute') return;
    const rect = el.getBoundingClientRect();
    // Only push elements that are at or near the very top of the viewport
    if (rect.top >= -5 && rect.top <= TITLE_BAR_HEIGHT && rect.height > 20 && rect.height <= 200) {
      const currentTop = el.style.top || '';
      // Only adjust if not already pushed down
      const currentTopPx = parseInt(currentTop);
      if (isNaN(currentTopPx) || currentTopPx < TITLE_BAR_HEIGHT) {
        el.style.setProperty('top', TITLE_BAR_HEIGHT + 'px', 'important');
        // Prevent content clipping after pushing down
        el.style.setProperty('overflow', 'visible', 'important');
        el.style.setProperty('min-height', rect.height + 'px', 'important');
        el.style.setProperty('line-height', '1.5', 'important');
        window._wereadPushedHeaders.add(el);
      }
    }
  });
}

function ensureTitleBarAndPadding() {
  // Push html content down via inline style (highest specificity)
  document.documentElement.style.setProperty('padding-top', TITLE_BAR_HEIGHT + 'px', 'important');
  document.documentElement.style.setProperty('box-sizing', 'border-box', 'important');
  createTitleBar();
  updateTitleBarAppearance();
  // Push fixed/sticky site headers down so they aren't hidden
  setTimeout(pushFixedHeadersDown, 300);
  setTimeout(pushFixedHeadersDown, 1200);
  setTimeout(pushFixedHeadersDown, 3000);
}

function updateTitleBarAppearance() {
  const bar = document.getElementById('weread-titlebar');
  if (!bar) return;
  const color = getPageBackgroundColor();
  bar.style.background = color;
  document.documentElement.style.setProperty('background', color, 'important');
}

// Re-apply when SPA navigates
new MutationObserver(() => {
  if (!document.getElementById('weread-titlebar')) {
    ensureTitleBarAndPadding();
  }
  // Also check for new fixed headers after DOM changes
  if (document.getElementById('weread-titlebar')) {
    setTimeout(pushFixedHeadersDown, 400);
  }
}).observe(document.documentElement, { childList: true, subtree: true });

// ===== CSS =====
const style = document.createElement('style');
style.id = 'weread-custom';
style.textContent = `
  .weread-scroll-hidden {
    opacity: 0 !important;
    transition: opacity 0.25s ease !important;
  }
`;
document.head.appendChild(style);

// ===== Scrollbar style (dynamically updated) =====
const scrollbarStyle = document.createElement('style');
scrollbarStyle.id = 'weread-scrollbar';
document.head.appendChild(scrollbarStyle);

// ===== Dynamic Title Bar Color =====
function getPageBackgroundColor() {
  const selectors = [
    '#readerContainer', '.readerContainer', '[class*="readerContainer" i]',
    '#app', '.app', 'main', '.main',
    '[class*="readerBody" i]', '[class*="reader_body" i]'
  ];
  for (const sel of selectors) {
    try {
      const el = document.querySelector(sel);
      if (el) {
        const bg = window.getComputedStyle(el).backgroundColor;
        if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') return bg;
      }
    } catch (_) {}
  }
  const bodyBg = window.getComputedStyle(document.body).backgroundColor;
  return bodyBg || '#ffffff';
}

function rgbToHex(color) {
  const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (match) {
    return '#' + [1, 2, 3].map(i => parseInt(match[i]).toString(16).padStart(2, '0')).join('');
  }
  return color;
}

function updateTitleBarColor() {
  const color = getPageBackgroundColor();
  try { ipcRenderer.send('set-titlebar-color', rgbToHex(color)); } catch (_) {}
  updateScrollbarColor(color);
  updateTitleBarAppearance();
}

// ===== Dynamic Scrollbar Color =====
function updateScrollbarColor(bgColor) {
  let rgb;
  try {
    const match = bgColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (match) {
      rgb = { r: parseInt(match[1]), g: parseInt(match[2]), b: parseInt(match[3]) };
    } else if (bgColor.startsWith('#')) {
      rgb = {
        r: parseInt(bgColor.slice(1, 3), 16),
        g: parseInt(bgColor.slice(3, 5), 16),
        b: parseInt(bgColor.slice(5, 7), 16)
      };
    } else {
      rgb = { r: 255, g: 255, b: 255 };
    }
  } catch (_) {
    rgb = { r: 255, g: 255, b: 255 };
  }

  const lum = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  const factor = lum > 0.5 ? 0.75 : 1.4;
  const tr = Math.min(255, Math.max(0, Math.round(rgb.r * factor)));
  const tg = Math.min(255, Math.max(0, Math.round(rgb.g * factor)));
  const tb = Math.min(255, Math.max(0, Math.round(rgb.b * factor)));

  scrollbarStyle.textContent = `
    ::-webkit-scrollbar { width: 8px; height: 8px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: rgb(${tr},${tg},${tb}); border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: rgb(${Math.min(255,Math.round(tr*0.85))},${Math.min(255,Math.round(tg*0.85))},${Math.min(255,Math.round(tb*0.85))}); }
    ::-webkit-scrollbar-corner { background: transparent; }
  `;
}

const domObserver = new MutationObserver(() => updateTitleBarColor());
function startObserving() {
  if (document.body) {
    domObserver.observe(document.body, { attributes: true, subtree: true, childList: true });
    ensureTitleBarAndPadding();
    updateTitleBarColor();
  } else {
    setTimeout(startObserving, 100);
  }
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startObserving);
} else {
  startObserving();
}
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateTitleBarColor);

// ===== Reading layout adjustment (JS-only, no broad CSS) =====
function isPopupOrModal(el) {
  let current = el;
  while (current && current !== document.body) {
    const cls = (current.className || '').toString();
    const id = current.id || '';
    const joined = cls + ' ' + id;
    if (/popup|modal|dialog|overlay|dropdown|menu|panel|toast|tooltip|drawer/i.test(joined)) return true;
    const cs = window.getComputedStyle(current);
    if (parseInt(cs.zIndex) > 100) return true;
    current = current.parentElement;
  }
  return false;
}

function adjustReadingLayout() {
  document.querySelectorAll('section, article, div').forEach((el) => {
    if (isPopupOrModal(el)) return;
    if (el.closest('header, nav, footer, [class*="toolbar" i], [class*="sidebar" i], [class*="catalog" i], [class*="toc" i]')) return;

    const cs = window.getComputedStyle(el);
    const maxW = parseInt(cs.maxWidth);
    const marginL = parseInt(cs.marginLeft);
    const marginR = parseInt(cs.marginRight);

    // For content containers with narrow max-width (500-1000px), widen them responsively
    if (maxW >= 500 && maxW <= 1000 && marginL >= 0 && marginR >= 0) {
      // Use a wider max but keep it responsive: use 98vw capped at a generous 1200px
      el.style.setProperty('max-width', 'min(98vw, 1200px)', 'important');
    }

    const cls = (el.className || '').toString().toLowerCase();
    // For reader content areas, use a generous max-width instead of removing it entirely
    if ((cls.includes('readercontent') || cls.includes('readermain') ||
         cls.includes('readerbody') || cls.includes('app_content')) &&
        !isPopupOrModal(el)) {
      // Use full available width minus some padding, capped at 1400px
      el.style.setProperty('max-width', 'min(98vw, 1400px)', 'important');
    }

    if (cls.includes('readerwrap') && !isPopupOrModal(el)) {
      el.style.setProperty('padding-left', '0', 'important');
      el.style.setProperty('margin-left', '0', 'important');
    }
  });
}

window.addEventListener('load', () => {
  setTimeout(adjustReadingLayout, 800);
  setTimeout(adjustReadingLayout, 2500);
  setTimeout(markRightButtons, 1000);
  setTimeout(markRightButtons, 2800);
  setTimeout(markTopBar, 600);
  setTimeout(markTopBar, 2000);
  setTimeout(setupScrollHide, 400);
  setTimeout(setupScrollHide, 1500);
  ensureTitleBarAndPadding();
});

// ===== Window resize handler for re-detecting buttons and top bar =====
let resizeDebounceTimer = null;
window.addEventListener('resize', () => {
  if (resizeDebounceTimer) clearTimeout(resizeDebounceTimer);
  resizeDebounceTimer = setTimeout(() => {
    markRightButtons();
    markTopBar();
    updateTitleBarAppearance();
    setTimeout(pushFixedHeadersDown, 200);
  }, 300);
});

let lastUrl = location.href;
new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    setTimeout(adjustReadingLayout, 600);
    setTimeout(adjustReadingLayout, 2000);
    setTimeout(markRightButtons, 800);
    setTimeout(markRightButtons, 2200);
    setTimeout(markTopBar, 500);
    setTimeout(markTopBar, 1800);
    setTimeout(setupScrollHide, 600);
    setTimeout(setupScrollHide, 2000);
    ensureTitleBarAndPadding();
  }
}).observe(document.body || document.documentElement, { childList: true, subtree: true });

// ===== Top bar: scroll-hide (book name / home row) =====
function markTopBar() {
  const candidates = [];
  document.querySelectorAll('div, header, nav, section').forEach((el) => {
    if (isPopupOrModal(el)) return;
    if (el.classList.contains('weread-scroll-target')) return;

    const rect = el.getBoundingClientRect();
    // Allow top bar to be at the title bar height (pushed down by our fix)
    if (rect.top <= TITLE_BAR_HEIGHT + 10 && rect.height >= 24 && rect.height <= 100 &&
        rect.width > window.innerWidth * 0.5 && rect.width <= window.innerWidth) {
      candidates.push({ el, rect, area: rect.width * rect.height });
    }
  });

  if (candidates.length === 0) return;
  candidates.sort((a, b) => b.area - a.area);
  const topBar = candidates[0].el;

  if (!topBar.classList.contains('weread-scroll-target')) {
    topBar.classList.add('weread-scroll-target');
    topBar.style.transition = 'opacity 0.25s ease';
  }
}

// ===== Right-side buttons: scroll-hide only, no position change =====
function markRightButtons() {
  const viewportWidth = window.innerWidth;
  const candidates = [];

  document.querySelectorAll('div, section, nav, aside, ul').forEach((el) => {
    if (isPopupOrModal(el)) return;
    if (el.closest('header, nav, [class*="catalog" i], [class*="sidebar" i], [class*="toc" i]')) return;

    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    // Relaxed conditions for better detection
    const isRightAligned = rect.right >= viewportWidth - 100; // Wider search zone
    const isNarrow = rect.width <= 90 && rect.width >= 12; // Wider width range
    const isModerateHeight = rect.height >= 30 && rect.height <= 600; // Wider height range
    // Allow elements that are partially visible or at the very top (rect.top can be 0 for fixed elements)
    const isMostlyVisible = rect.top >= -2 && rect.bottom <= window.innerHeight + 20;
    const hasFewChildren = el.children.length >= 1 && el.children.length <= 15;
    const hasIcons = el.querySelector('svg, img, [class*="icon" i], [class*="Icon" i], use, [class*="btn" i], button');

    if (isRightAligned && isNarrow && isModerateHeight && isMostlyVisible && hasFewChildren && hasIcons) {
      candidates.push({ el, rect, score: 0 });
    }
  });

  if (candidates.length === 0) return;

  candidates.forEach(c => {
    c.score += (c.rect.right - (viewportWidth - 100)) / 10;
    c.score += (c.el.querySelectorAll('svg, img, [class*="icon" i]').length) * 2;
    // Bonus for elements clearly on the right edge
    if (c.rect.right >= viewportWidth - 5) c.score += 3;
  });

  candidates.sort((a, b) => b.score - a.score);
  candidates.slice(0, 2).forEach(c => {
    if (!c.el.classList.contains('weread-scroll-target')) {
      c.el.classList.add('weread-scroll-target');
      c.el.style.transition = 'opacity 0.25s ease';
    }
  });

  setupScrollHide();
}

// ===== Scroll hide =====
function findScrollContainers() {
  const results = [];
  document.querySelectorAll('div, section, main, article').forEach((el) => {
    const cs = window.getComputedStyle(el);
    const oy = cs.overflowY;
    if ((oy === 'auto' || oy === 'scroll' || oy === 'overlay') &&
        el.scrollHeight > el.clientHeight + 5) {
      results.push(el);
    }
  });
  // Also check document.scrollingElement
  const se = document.scrollingElement;
  if (se && se.scrollHeight > se.clientHeight + 5) {
    results.push(se);
  }
  return results;
}

function setupScrollHide() {
  if (!window._wereadScrollContainers) window._wereadScrollContainers = new WeakSet();

  function getScrollTop(c) { return c === window ? window.scrollY : c.scrollTop; }

  function hookContainer(container) {
    if (window._wereadScrollContainers.has(container)) return;
    window._wereadScrollContainers.add(container);

    let lastScrollY = getScrollTop(container);
    let ticking = false;
    container.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = getScrollTop(container);
        document.querySelectorAll('.weread-scroll-target').forEach(el => {
          if (y < lastScrollY) {
            el.classList.remove('weread-scroll-hidden');
          } else if (y > lastScrollY) {
            el.classList.add('weread-scroll-hidden');
          }
        });
        lastScrollY = y;
        ticking = false;
      });
    }, { passive: true });
  }

  // Always hook window (WeakSet prevents duplicates)
  hookContainer(window);

  // Find and hook ALL scroll containers
  const containers = findScrollContainers();
  containers.forEach(function(c) { hookContainer(c); });

  // Retry multiple times for late-appearing scroll containers (more aggressive)
  [300, 800, 1500, 2500, 4000, 6000, 10000].forEach(function(delay) {
    setTimeout(function() {
      const found = findScrollContainers();
      found.forEach(function(c) { hookContainer(c); });
    }, delay);
  });
}

// Watch for new scrollable containers appearing in the DOM
if (!window._wereadScrollObserver) {
  let scrollObserverTimer = null;
  window._wereadScrollObserver = new MutationObserver(function() {
    if (scrollObserverTimer) return;
    scrollObserverTimer = setTimeout(function() {
      scrollObserverTimer = null;
      if (window._wereadScrollContainers) {
        const containers = findScrollContainers();
        containers.forEach(function(c) {
          if (!window._wereadScrollContainers.has(c)) {
            setupScrollHide();
          }
        });
      }
    }, 500);
  });
}

(function startScrollObserver() {
  if (document.body) {
    window._wereadScrollObserver.observe(document.body, { childList: true, subtree: true });
  } else {
    setTimeout(startScrollObserver, 200);
  }
})();

const btnObserver = new MutationObserver(() => {
  if (!document.querySelector('.weread-scroll-target')) markRightButtons();
});

(function observeForButtons() {
  if (document.body) {
    btnObserver.observe(document.body, { childList: true, subtree: true });
    updateScrollbarColor(getPageBackgroundColor());
  } else {
    setTimeout(observeForButtons, 200);
  }
})();
