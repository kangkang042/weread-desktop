// ===== Custom title bar for Pake (Tauri/WebView2) =====
const TITLE_BAR_HEIGHT = 36;

function createTitleBar() {
  if (document.getElementById('pake-titlebar')) return;
  const bar = document.createElement('div');
  bar.id = 'pake-titlebar';
  bar.style.cssText = `position:fixed;top:0;left:0;right:0;height:${TITLE_BAR_HEIGHT}px;z-index:1000;-webkit-app-region:drag;display:flex;align-items:center;justify-content:flex-end;padding-right:4px;`;
  document.body.insertBefore(bar, document.body.firstChild);
  createWindowControls();
}

function createWindowControls() {
  if (document.getElementById('pake-window-controls')) return;
  if (!window.__TAURI__) {
    setTimeout(createWindowControls, 200);
    return;
  }
  var appWindow = window.__TAURI__.window.getCurrentWindow();
  var controls = document.createElement('div');
  controls.id = 'pake-window-controls';
  controls.style.cssText = 'display:flex;align-items:center;gap:2px;-webkit-app-region:no-drag;';
  var btns = [
    { id: 'pake-btn-minimize', title: 'Minimize', svg: '<svg width="12" height="12" viewBox="0 0 12 12"><rect x="1" y="5.5" width="10" height="1" fill="currentColor"/></svg>', action: function() { appWindow.minimize(); } },
    { id: 'pake-btn-maximize', title: 'Maximize', svg: '<svg width="12" height="12" viewBox="0 0 12 12"><rect x="1.5" y="1.5" width="9" height="9" rx="1" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>', action: function() { appWindow.toggleMaximize(); } },
    { id: 'pake-btn-close', title: 'Close', svg: '<svg width="12" height="12" viewBox="0 0 12 12"><path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" stroke-width="1.3" fill="none" stroke-linecap="round"/></svg>', action: function() { appWindow.close(); } }
  ];
  var html = '';
  btns.forEach(function(b) {
    html += '<button id="' + b.id + '" title="' + b.title + '" style="width:28px;height:28px;border:none;background:transparent;border-radius:4px;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#666;">' + b.svg + '</button>';
  });
  controls.innerHTML = html;
  btns.forEach(function(b) {
    controls.querySelector('#' + b.id).addEventListener('click', b.action);
  });
  controls.querySelectorAll('button').forEach(function(btn) {
    btn.addEventListener('mouseenter', function() { btn.style.background = btn.id === 'pake-btn-close' ? '#c42b1c' : 'rgba(128,128,128,0.2)'; btn.style.color = btn.id === 'pake-btn-close' ? '#fff' : '#333'; });
    btn.addEventListener('mouseleave', function() { btn.style.background = 'transparent'; btn.style.color = '#666'; });
  });
  function updateMaxIcon() {
    var btn = document.getElementById('pake-btn-maximize');
    if (!btn) return;
    appWindow.isMaximized().then(function(max) {
      btn.innerHTML = max
        ? '<svg width="12" height="12" viewBox="0 0 12 12"><rect x="1" y="2.5" width="7" height="7" rx="1" fill="none" stroke="currentColor" stroke-width="1.2"/><rect x="3.5" y="0.5" width="7" height="7" rx="1" fill="currentColor" opacity="0.15" stroke="currentColor" stroke-width="1.2"/></svg>'
        : '<svg width="12" height="12" viewBox="0 0 12 12"><rect x="1.5" y="1.5" width="9" height="9" rx="1" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>';
    });
  }
  updateMaxIcon();
  appWindow.onResized(updateMaxIcon);
  var bar = document.getElementById('pake-titlebar');
  bar.insertBefore(controls, bar.firstChild);
}

function updateTitleBarAppearance() {
  var bar = document.getElementById('pake-titlebar');
  if (!bar) return;
  bar.style.background = getPageBackgroundColor();
}

// ===== Dynamic background color detection =====
function getPageBackgroundColor() {
  var selectors = [
    '#readerContainer', '.readerContainer', '[class*="readerContainer" i]',
    '#app', '.app', 'main', '.main',
    '[class*="readerBody" i]', '[class*="reader_body" i]'
  ];
  for (var i = 0; i < selectors.length; i++) {
    try {
      var el = document.querySelector(selectors[i]);
      if (el) {
        var bg = window.getComputedStyle(el).backgroundColor;
        if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') return bg;
      }
    } catch (_) {}
  }
  var bodyBg = window.getComputedStyle(document.body).backgroundColor;
  return bodyBg || '#ffffff';
}

// ===== Dynamic Scrollbar Color =====
var scrollbarStyle = document.createElement('style');
scrollbarStyle.id = 'pake-scrollbar';
document.head.appendChild(scrollbarStyle);

function updateScrollbarColor(bgColor) {
  var rgb = { r: 255, g: 255, b: 255 };
  try {
    var match = bgColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (match) {
      rgb = { r: parseInt(match[1]), g: parseInt(match[2]), b: parseInt(match[3]) };
    } else if (bgColor.startsWith('#')) {
      rgb = { r: parseInt(bgColor.slice(1, 3), 16), g: parseInt(bgColor.slice(3, 5), 16), b: parseInt(bgColor.slice(5, 7), 16) };
    }
  } catch (_) {}
  var lum = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  var factor = lum > 0.5 ? 0.75 : 1.4;
  var tr = Math.min(255, Math.max(0, Math.round(rgb.r * factor)));
  var tg = Math.min(255, Math.max(0, Math.round(rgb.g * factor)));
  var tb = Math.min(255, Math.max(0, Math.round(rgb.b * factor)));
  scrollbarStyle.textContent =
    '::-webkit-scrollbar { width: 8px; height: 8px; }' +
    '::-webkit-scrollbar-track { background: transparent; }' +
    '::-webkit-scrollbar-thumb { background: rgb(' + tr + ',' + tg + ',' + tb + '); border-radius: 4px; }' +
    '::-webkit-scrollbar-thumb:hover { background: rgb(' + Math.min(255,Math.round(tr*0.85)) + ',' + Math.min(255,Math.round(tg*0.85)) + ',' + Math.min(255,Math.round(tb*0.85)) + '); }' +
    '::-webkit-scrollbar-corner { background: transparent; }';
}

function updateColors() {
  var color = getPageBackgroundColor();
  updateScrollbarColor(color);
  updateTitleBarAppearance();
  document.documentElement.style.setProperty('background', color, 'important');
}

// ===== Push fixed/sticky/absolute headers down =====
function pushFixedHeadersDown() {
  if (!window._pakePushedHeaders) window._pakePushedHeaders = new WeakSet();
  document.querySelectorAll('div, header, nav, section, [class*="header" i], [class*="topbar" i], [class*="navbar" i], [class*="title" i], [class*="readerTop" i], [class*="readerHeader" i]').forEach(function(el) {
    if (window._pakePushedHeaders.has(el)) return;
    if (el.id === 'pake-titlebar') return;
    var cs = window.getComputedStyle(el);
    var pos = cs.position;
    if (pos !== 'fixed' && pos !== 'sticky' && pos !== 'absolute') return;
    var rect = el.getBoundingClientRect();
    if (rect.top >= -5 && rect.top <= TITLE_BAR_HEIGHT && rect.height > 20 && rect.height <= 200) {
      var currentTopPx = parseInt(el.style.top);
      if (isNaN(currentTopPx) || currentTopPx < TITLE_BAR_HEIGHT) {
        el.style.setProperty('top', TITLE_BAR_HEIGHT + 'px', 'important');
        el.style.setProperty('overflow', 'visible', 'important');
        el.style.setProperty('min-height', rect.height + 'px', 'important');
        el.style.setProperty('line-height', '1.5', 'important');
        window._pakePushedHeaders.add(el);
      }
    }
  });
}

function ensureTitleBar() {
  document.documentElement.style.setProperty('padding-top', TITLE_BAR_HEIGHT + 'px', 'important');
  document.documentElement.style.setProperty('box-sizing', 'border-box', 'important');
  createTitleBar();
  updateTitleBarAppearance();
  setTimeout(pushFixedHeadersDown, 300);
  setTimeout(pushFixedHeadersDown, 1200);
  setTimeout(pushFixedHeadersDown, 3000);
}

// ===== CSS =====
var style = document.createElement('style');
style.id = 'pake-custom';
style.textContent = '.pake-scroll-hidden { opacity: 0 !important; transition: opacity 0.25s ease !important; }';
document.head.appendChild(style);

// ===== Scroll hide (simplified global approach) =====
function isPopupOrModal(el) {
  var current = el;
  while (current && current !== document.body) {
    var cls = (current.className || '').toString();
    var id = current.id || '';
    var joined = cls + ' ' + id;
    if (/popup|modal|dialog|overlay|dropdown|menu|panel|toast|tooltip|drawer/i.test(joined)) return true;
    var cs = window.getComputedStyle(current);
    if (parseInt(cs.zIndex) > 100) return true;
    current = current.parentElement;
  }
  return false;
}

function setupScrollHide() {
  if (window._pakeScrollHooked) return;
  window._pakeScrollHooked = true;

  var lastY = 0;
  var ticking = false;

  function getScrollY() {
    // Prioritize elements with non-zero scrollTop
    var containers = document.querySelectorAll('[class*="readerContainer" i], [class*="readerBody" i], [class*="readerContent" i], [class*="app_content" i], #readerContainer, .readerContainer');
    for (var i = 0; i < containers.length; i++) {
      if (containers[i].scrollTop > 0) return containers[i].scrollTop;
    }
    return window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function() {
      var y = getScrollY();
      if (y > lastY && y > 30) {
        document.querySelectorAll('.pake-scroll-target').forEach(function(el) {
          el.classList.add('pake-scroll-hidden');
        });
      } else if (y < lastY - 3) {
        document.querySelectorAll('.pake-scroll-target').forEach(function(el) {
          el.classList.remove('pake-scroll-hidden');
        });
      }
      lastY = y;
      ticking = false;
    });
  }

  document.addEventListener('scroll', onScroll, { passive: true, capture: true });
}

// ===== Top bar detection =====
function markTopBar() {
  var candidates = [];
  document.querySelectorAll('div, header, nav, section').forEach(function(el) {
    if (isPopupOrModal(el)) return;
    if (el.classList.contains('pake-scroll-target')) return;
    var rect = el.getBoundingClientRect();
    if (rect.top <= TITLE_BAR_HEIGHT + 10 && rect.height >= 24 && rect.height <= 100 &&
        rect.width > window.innerWidth * 0.5 && rect.width <= window.innerWidth) {
      candidates.push({ el: el, rect: rect, area: rect.width * rect.height });
    }
  });
  if (candidates.length === 0) return;
  candidates.sort(function(a, b) { return b.area - a.area; });
  var topBar = candidates[0].el;
  if (!topBar.classList.contains('pake-scroll-target')) {
    topBar.classList.add('pake-scroll-target');
    topBar.style.transition = 'opacity 0.25s ease';
  }
}

// ===== Right-side buttons detection =====
function markRightButtons() {
  var viewportWidth = window.innerWidth;
  var candidates = [];

  // Scan broadly — div, section, nav, aside, ul, li, a, button, span
  document.querySelectorAll('div, section, nav, aside, ul, li, a, button, span').forEach(function(el) {
    if (isPopupOrModal(el)) return;
    if (el.classList.contains('pake-scroll-target')) return;

    var rect = el.getBoundingClientRect();
    if (rect.width < 8 || rect.height < 8) return;
    if (rect.width > 200) return;
    if (rect.height > window.innerHeight * 0.8) return;

    // Must be on the right side
    if (rect.right < viewportWidth - 130) return;

    // Must be reasonably visible
    if (rect.top < -30 || rect.bottom > window.innerHeight + 60) return;

    // Must be interactive or contain interactive/icon children
    var childIcons = el.querySelectorAll('svg, img, [class*="icon" i], use, button, [class*="btn" i], [class*="action" i]');
    var isInteractive = el.matches('button, a, [class*="icon" i], [class*="btn" i], [class*="action" i]') || el.getAttribute('role') === 'button';

    // Also check if element itself looks like a button (small, clickable area)
    var looksLikeButton = rect.width <= 60 && rect.height <= 60 && (el.onclick || el.getAttribute('onclick') || el.matches('[class*="btn" i], [class*="button" i], [class*="action" i], [class*="tool" i]'));

    if (childIcons.length > 0 || isInteractive || looksLikeButton) {
      candidates.push({
        el: el,
        rect: rect,
        score: 0,
        iconCount: childIcons.length
      });
    }
  });

  if (candidates.length === 0) return;

  candidates.forEach(function(c) {
    c.score += (c.rect.right - (viewportWidth - 130)) / 10;
    c.score += (130 - c.rect.width) / 10;
    c.score += c.iconCount * 3;
    if (c.rect.right >= viewportWidth - 5) c.score += 5;
    if (c.el.children.length >= 1 && c.el.children.length <= 20) c.score += 2;
    // Prefer fixed/absolute right-side elements
    var pos = window.getComputedStyle(c.el).position;
    if (pos === 'fixed' || pos === 'absolute') c.score += 4;
  });

  candidates.sort(function(a, b) { return b.score - a.score; });

  candidates.slice(0, 4).forEach(function(c) {
    if (!c.el.classList.contains('pake-scroll-target')) {
      c.el.classList.add('pake-scroll-target');
      c.el.style.transition = 'opacity 0.25s ease';
    }
  });
}

// ===== Reading layout adjustment =====
function adjustReadingLayout() {
  document.querySelectorAll('section, article, div').forEach(function(el) {
    if (isPopupOrModal(el)) return;
    if (el.closest('header, nav, footer, [class*="toolbar" i], [class*="sidebar" i], [class*="catalog" i], [class*="toc" i]')) return;
    var cs = window.getComputedStyle(el);
    var maxW = parseInt(cs.maxWidth);
    var marginL = parseInt(cs.marginLeft);
    var marginR = parseInt(cs.marginRight);
    if (maxW >= 500 && maxW <= 1000 && marginL >= 0 && marginR >= 0) {
      el.style.setProperty('max-width', 'min(98vw, 1200px)', 'important');
    }
    var cls = (el.className || '').toString().toLowerCase();
    if ((cls.includes('readercontent') || cls.includes('readermain') ||
         cls.includes('readerbody') || cls.includes('app_content')) &&
        !isPopupOrModal(el)) {
      el.style.setProperty('max-width', 'min(98vw, 1400px)', 'important');
    }
    if (cls.includes('readerwrap') && !isPopupOrModal(el)) {
      el.style.setProperty('padding-left', '0', 'important');
      el.style.setProperty('margin-left', '0', 'important');
    }
  });
}

// ===== Initialization =====
function startObserving() {
  if (document.body) {
    ensureTitleBar();
    updateColors();
    setupScrollHide();
  } else {
    setTimeout(startObserving, 100);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startObserving);
} else {
  startObserving();
}

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateColors);

// MutationObserver for color changes
var domObserver = new MutationObserver(function() { updateColors(); });
(function observeBody() {
  if (document.body) {
    domObserver.observe(document.body, { attributes: true, subtree: true, childList: true });
  } else {
    setTimeout(observeBody, 100);
  }
})();

// Load handlers
window.addEventListener('load', function() {
  setTimeout(adjustReadingLayout, 800);
  setTimeout(adjustReadingLayout, 2500);
  setTimeout(markRightButtons, 1000);
  setTimeout(markRightButtons, 2800);
  setTimeout(markTopBar, 600);
  setTimeout(markTopBar, 2000);
  setupScrollHide();
  ensureTitleBar();
});

// SPA navigation: re-apply on URL change
var lastUrl = location.href;
new MutationObserver(function() {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    setTimeout(adjustReadingLayout, 600);
    setTimeout(adjustReadingLayout, 2000);
    setTimeout(markRightButtons, 800);
    setTimeout(markRightButtons, 2200);
    setTimeout(markTopBar, 500);
    setTimeout(markTopBar, 1800);
    setupScrollHide();
    ensureTitleBar();
  }
}).observe(document.body || document.documentElement, { childList: true, subtree: true });

// Re-apply on resize
var resizeDeboundeTimer = null;
window.addEventListener('resize', function() {
  if (resizeDeboundeTimer) clearTimeout(resizeDeboundeTimer);
  resizeDeboundeTimer = setTimeout(function() {
    markRightButtons();
    markTopBar();
    updateTitleBarAppearance();
    setTimeout(pushFixedHeadersDown, 200);
  }, 300);
});

// Button observer for DOM changes + reader content detection
var btnObserver = new MutationObserver(function() {
  if (!document.querySelector('.pake-scroll-target')) markRightButtons();
  // Detect new reader content loading without URL change (SPA book switching)
  var readerEl = document.querySelector('[class*="readerContainer" i], [class*="readerContent" i], #readerContainer');
  if (readerEl) {
    var len = readerEl.innerHTML.length;
    if (len > 0 && len !== window._lastReaderLen) {
      window._lastReaderLen = len;
      setTimeout(adjustReadingLayout, 400);
      setTimeout(adjustReadingLayout, 1200);
      setTimeout(markRightButtons, 600);
      setTimeout(markRightButtons, 1800);
      setTimeout(markTopBar, 500);
      setTimeout(markTopBar, 1600);
      setupScrollHide();
    }
  }
});
(function observeForButtons() {
  if (document.body) {
    btnObserver.observe(document.body, { childList: true, subtree: true });
  } else {
    setTimeout(observeForButtons, 200);
  }
})();

// Re-apply when titlebar disappears (SPA full-page transitions)
new MutationObserver(function() {
  if (!document.getElementById('pake-titlebar')) {
    ensureTitleBar();
  }
  if (document.getElementById('pake-titlebar')) {
    setTimeout(pushFixedHeadersDown, 400);
  }
}).observe(document.documentElement, { childList: true, subtree: true });
