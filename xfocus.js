// ═══════════════════════════════════
//  superlevels: X Focus Mode
// ═══════════════════════════════════
(() => {
  const STYLE_ID = "sl-xfocus";
  const ROOT_CLASS = "sl-xfocus-active";
  const HIDE_ATTR = "data-sl-xfocus-hide";
  const COMPOSER_ATTR = "data-sl-xfocus-composer";
  const UI_KEEP_ATTR = "data-sl-xfocus-ui";

  const XFOCUS_CSS = `
    html.${ROOT_CLASS} [data-testid="sidebarColumn"],
    html.${ROOT_CLASS} [data-testid="DMDrawer"],
    html.${ROOT_CLASS} aside[role="complementary"],
    html.${ROOT_CLASS} [data-testid="BottomBar"],
    html.${ROOT_CLASS} [data-testid="TopNavBar"],
    html.${ROOT_CLASS} header[role="banner"],
    html.${ROOT_CLASS} button[aria-label="Skip to home timeline"],
    html.${ROOT_CLASS} button[aria-label="Skip to trending"],
    html.${ROOT_CLASS} [${HIDE_ATTR}="true"] {
      display: none !important;
    }

    html.${ROOT_CLASS} main[role="main"] {
      justify-content: center !important;
    }

    html.${ROOT_CLASS} [data-testid="primaryColumn"] {
      max-width: 720px !important;
      width: 100% !important;
      margin: 0 auto !important;
    }

    html.${ROOT_CLASS} [data-testid="primaryColumn"] [aria-label="Home timeline"],
    html.${ROOT_CLASS} [data-testid="primaryColumn"] [${COMPOSER_ATTR}="true"] {
      padding-top: 24px !important;
    }

    html.${ROOT_CLASS} [data-testid="primaryColumn"] [data-testid="tweetTextarea_0"],
    html.${ROOT_CLASS} [data-testid="primaryColumn"] [data-testid="tweetTextarea_0RichTextInputContainer"] {
      display: block !important;
      visibility: visible !important;
      opacity: 1 !important;
    }

    html.${ROOT_CLASS} [data-testid="primaryColumn"] [data-testid="tweetTextarea_0"] {
      min-height: 180px !important;
    }

    html.${ROOT_CLASS} [data-testid="primaryColumn"] [data-testid="toolBar"],
    html.${ROOT_CLASS} [data-testid="primaryColumn"] [data-testid="tweetButtonInline"] {
      display: flex !important;
      visibility: visible !important;
      opacity: 1 !important;
    }

    html.${ROOT_CLASS} [data-testid="primaryColumn"] [${COMPOSER_ATTR}="true"] {
      display: block !important;
      visibility: visible !important;
      opacity: 1 !important;
    }

    html.${ROOT_CLASS} [${UI_KEEP_ATTR}="true"] {
      display: block !important;
      visibility: visible !important;
      opacity: 1 !important;
    }

    html.${ROOT_CLASS} body:not(:has([data-testid="tweetTextarea_0"], [data-testid="tweetButtonInline"], [role="dialog"] [data-testid="tweetTextarea_0"])) [data-testid="primaryColumn"]::before {
      content: "Focus Mode - Use the Post button";
      display: block;
      padding: 40px 24px;
      text-align: center;
      font-size: 20px;
      font-weight: 600;
      color: rgb(113, 118, 123);
    }

    html.${ROOT_CLASS} [role="dialog"]:has([data-testid="tweetTextarea_0"]) {
      display: flex !important;
    }
  `;

  const HIDE_SELECTORS = [
    '[role="status"]',
    '[role="tablist"]',
    '[data-testid="ScrollSnap-List"]',
    '[data-testid="cellInnerDiv"]',
    '[aria-label^="Timeline:"]',
    'section[role="region"]',
    'article',
    'nav[role="navigation"]',
    '[data-testid="placementTracking"]',
  ].join(", ");

  let observer = null;

  function inject() {
    if (!document.getElementById(STYLE_ID)) {
      const style = document.createElement("style");
      style.id = STYLE_ID;
      style.textContent = XFOCUS_CSS;
      (document.head || document.documentElement).appendChild(style);
    }
    document.documentElement.classList.add(ROOT_CLASS);
    startObserver();
    refreshFocus();
  }

  function remove() {
    document.documentElement.classList.remove(ROOT_CLASS);
    stopObserver();
    clearFocusMarks();
  }

  function clearFocusMarks() {
    for (const el of document.querySelectorAll(`[${HIDE_ATTR}], [${COMPOSER_ATTR}], [${UI_KEEP_ATTR}]`)) {
      el.removeAttribute(HIDE_ATTR);
      el.removeAttribute(COMPOSER_ATTR);
      el.removeAttribute(UI_KEEP_ATTR);
    }
  }

  function getPrimaryColumn() {
    return document.querySelector('[data-testid="primaryColumn"]');
  }

  function getComposerAnchor(root) {
    if (!root) return null;
    return (
      root.querySelector('[data-testid="tweetButtonInline"]') ||
      root.querySelector('[data-testid="tweetTextarea_0"]') ||
      root.querySelector('[data-testid="toolBar"]')
    );
  }

  function getComposerContainer(primaryColumn) {
    const anchor = getComposerAnchor(primaryColumn);
    if (!anchor) return null;

    let candidate = anchor;
    let current = anchor;

    while (current && current !== primaryColumn) {
      const parent = current.parentElement;
      if (!parent || parent === primaryColumn) break;
      if (parent.querySelector('section[role="region"], [aria-label^="Timeline:"], article, [data-testid="cellInnerDiv"]')) {
        break;
      }
      candidate = parent;
      current = parent;
    }

    return candidate;
  }

  function shouldKeepVisible(el, composerContainer) {
    if (!el) return false;
    if (composerContainer && (el === composerContainer || composerContainer.contains(el) || el.contains(composerContainer))) {
      return true;
    }
    if (el.matches('[role="dialog"]') && el.querySelector('[data-testid="tweetTextarea_0"], [data-testid="tweetButtonInline"]')) {
      return true;
    }
    if (el.closest('[role="dialog"]') && el.closest('[role="dialog"]').querySelector('[data-testid="tweetTextarea_0"], [data-testid="tweetButtonInline"]')) {
      return true;
    }
    return !!el.querySelector('[data-testid="tweetTextarea_0"], [data-testid="tweetButtonInline"], [data-testid="toolBar"]');
  }

  function refreshFocus() {
    if (!document.documentElement.classList.contains(ROOT_CLASS)) return;

    clearFocusMarks();

    const primaryColumn = getPrimaryColumn();
    if (!primaryColumn) return;

    const composerContainer = getComposerContainer(primaryColumn);
    if (composerContainer) composerContainer.setAttribute(COMPOSER_ATTR, "true");

    for (const el of primaryColumn.querySelectorAll('[data-testid="tweetTextarea_0"], [data-testid="tweetButtonInline"], [data-testid="toolBar"]')) {
      el.setAttribute(UI_KEEP_ATTR, "true");
    }

    for (const el of primaryColumn.querySelectorAll(HIDE_SELECTORS)) {
      if (shouldKeepVisible(el, composerContainer)) continue;
      el.setAttribute(HIDE_ATTR, "true");
    }
  }

  function startObserver() {
    if (observer) return;
    observer = new MutationObserver(() => {
      refreshFocus();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  function stopObserver() {
    if (!observer) return;
    observer.disconnect();
    observer = null;
  }

  chrome.storage.local.get(["xfocus_enabled"], (data) => {
    if (data.xfocus_enabled) inject();
  });

  chrome.storage.onChanged.addListener((changes) => {
    if (!changes.xfocus_enabled) return;
    if (changes.xfocus_enabled.newValue) inject();
    else remove();
  });

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === "xfocus_toggle") {
      if (msg.enabled) inject();
      else remove();
    }
  });
})();
