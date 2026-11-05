// ═══════════════════════════════════
//  superlevels: X Desktop Following
// ═══════════════════════════════════
(() => {
  const STYLE_ID = "sl-xfollowing";
  const HIDE_ATTR = "data-sl-xfollowing-hide";
  let observer = null;
  let clickTimer = 0;

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      [${HIDE_ATTR}="true"] {
        display: none !important;
      }
    `;
    (document.head || document.documentElement).appendChild(style);
  }

  function isDesktopHome() {
    const path = location.pathname;
    const isHome = path === "/" || path === "/home";
    return isHome && !location.hostname.startsWith("mobile.") && window.innerWidth >= 1000;
  }

  function clearMarks() {
    for (const el of document.querySelectorAll(`[${HIDE_ATTR}]`)) {
      el.removeAttribute(HIDE_ATTR);
    }
  }

  function getHomeTablist() {
    const primaryColumn = document.querySelector('[data-testid="primaryColumn"]');
    if (!primaryColumn) return null;
    return (
      primaryColumn.querySelector('[role="tablist"][data-testid="ScrollSnap-List"]') ||
      primaryColumn.querySelector('[role="tablist"]')
    );
  }

  function getTabs(tablist) {
    if (!tablist) return { forYou: null, following: null };
    const tabs = [...tablist.querySelectorAll('[role="tab"]')];
    const normalize = (el) => (el.textContent || "").replace(/\s+/g, " ").trim().toLowerCase();
    return {
      forYou: tabs.find((tab) => normalize(tab).includes("for you")) || null,
      following: tabs.find((tab) => normalize(tab).includes("following")) || null,
    };
  }

  function switchToFollowing(followingTab) {
    if (!followingTab) return;
    if (clickTimer) clearTimeout(clickTimer);
    clickTimer = window.setTimeout(() => {
      followingTab.click();
    }, 50);
  }

  function refresh() {
    clearMarks();
    if (!isDesktopHome()) return;

    const tablist = getHomeTablist();
    if (!tablist) return;

    const { forYou, following } = getTabs(tablist);
    if (!forYou) return;

    const hideTarget = forYou.closest('[role="presentation"]') || forYou;
    hideTarget.setAttribute(HIDE_ATTR, "true");

    if (forYou.getAttribute("aria-selected") === "true" && following) {
      switchToFollowing(following);
    }
  }

  function startObserver() {
    if (observer) return;
    observer = new MutationObserver(() => {
      refresh();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  function init() {
    ensureStyle();
    startObserver();
    refresh();
    window.addEventListener("resize", refresh);
    window.addEventListener("popstate", refresh);
  }

  init();
})();
