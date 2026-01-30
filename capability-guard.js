/* yabp-capability-guard v1.1.0
   Boring. Fast. Honest.
*/
(function () {
  if (window.__YABP_CAPABILITY_GUARD__) return;
  window.__YABP_CAPABILITY_GUARD__ = true;

  const STORAGE_KEY = "__yabp_capability_guard_ack";

  function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  // 🔒 Hard mobile gate (phones + tablets only)
  function isMobileDevice() {
    return (
      /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
      (
        window.matchMedia("(pointer: coarse)").matches &&
        window.matchMedia("(max-width: 1024px)").matches
      )
    );
  }

  function getCapabilities() {
    return {
      smallViewport: window.matchMedia("(max-width: 767px)").matches,
      coarsePointer: window.matchMedia("(pointer: coarse)").matches,
      noHover: window.matchMedia("(hover: none)").matches,
      lowMemory: navigator.deviceMemory && navigator.deviceMemory <= 2,
      lowCPU: navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2,
    };
  }

  // ⚖️ Lightweight sanity check (mobile already required)
  function isConstrained(cap) {
    let score = 0;
    if (cap.smallViewport) score++;
    if (cap.coarsePointer) score++;
    if (cap.noHover) score++;
    return score >= 2;
  }

  function readConfig() {
    const el = document.getElementById("capability-guard");
    if (!el) return {};
    return {
      message: el.dataset.message,
      mode: el.dataset.mode || "notice",
      redirect: el.dataset.redirect,
    };
  }

  function createOverlay(message) {
    const overlay = document.createElement("div");
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      z-index: 2147483647;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: env(safe-area-inset-top)
               env(safe-area-inset-right)
               env(safe-area-inset-bottom)
               env(safe-area-inset-left);
      background: rgba(255,255,255,0.55);
      backdrop-filter: saturate(180%) blur(20px);
      -webkit-backdrop-filter: saturate(180%) blur(20px);
      font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text",
                   system-ui, sans-serif;
      color: #111;
    `;

    const box = document.createElement("div");
    box.style.cssText = `
      width: 100%;
      max-width: 420px;
      margin: 16px;
      padding: 24px 22px 20px;
      background: #fff;
      border-radius: 16px;
      box-shadow:
        0 10px 30px rgba(0,0,0,0.08),
        0 1px 2px rgba(0,0,0,0.06);
    `;

    const title = document.createElement("h2");
    title.textContent = "Compatibility Notice";
    title.style.cssText = `
      margin: 0 0 8px;
      font-size: 17px;
      font-weight: 600;
      letter-spacing: -0.01em;
    `;

    const text = document.createElement("p");
    text.textContent = message;
    text.style.cssText = `
      margin: 0 0 20px;
      font-size: 15px;
      line-height: 1.45;
      color: #444;
    `;

    const btn = document.createElement("button");
    btn.textContent = "Continue";
    btn.style.cssText = `
      width: 100%;
      border: none;
      background: #007aff;
      color: #fff;
      padding: 12px 16px;
      font-size: 16px;
      font-weight: 600;
      border-radius: 12px;
      cursor: pointer;
    `;

    btn.onclick = function () {
      localStorage.setItem(STORAGE_KEY, "1");
      overlay.remove();
    };

    box.append(title, text, btn);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    btn.focus();
  }

  function run() {
    if (prefersReducedMotion()) return;

    // 🚫 Absolute desktop kill switch
    if (!isMobileDevice()) return;

    const cfg = readConfig();
    const mode = cfg.mode;

    const cap = getCapabilities();
    if (!isConstrained(cap)) return;

    // 🔑 Only suppress repeated notices, never redirects
    if (mode !== "redirect" && localStorage.getItem(STORAGE_KEY)) {
      return;
    }

    if (mode === "redirect" && cfg.redirect) {
      location.replace(cfg.redirect);
      return;
    }

    createOverlay(
      cfg.message ||
        "This site is optimized for desktop devices. Some features or layouts may not work as expected on your device."
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();
