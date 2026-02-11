// Lightweight analytics helper for all pages in this project.
// Usage in HTML:
//   <script src="./assets/js/analytics.js"></script>
//   <script>
//     initAnalyticsTracking({ site: 'analytics-lab', baseEvent: 'playground' });
//   </script>

(function () {
  var DEFAULT_ENDPOINT = "https://stats.colab.indevs.in/collect";
  var DEFAULT_SECRET = null; // unused, kept for API compatibility
  var SESSION_KEY = "analytics_lab_session_id";

  function generateSessionId() {
    if (window.crypto && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return "s-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

  function getSessionId() {
    var existing = null;
    try {
      existing = localStorage.getItem(SESSION_KEY);
    } catch (e) {}
    if (existing) return existing;
    var id = generateSessionId();
    try {
      localStorage.setItem(SESSION_KEY, id);
    } catch (e) {}
    return id;
  }

  function getFingerprintTraits() {
    var nav = (typeof navigator !== "undefined" && navigator) || {};
    var scr = (typeof window !== "undefined" && window.screen) || {};
    var intlOpts = {};
    try {
      if (window.Intl && Intl.DateTimeFormat) {
        intlOpts = Intl.DateTimeFormat().resolvedOptions() || {};
      }
    } catch (e) {}

    var pointerCoarse = false;
    try {
      if (window.matchMedia) {
        pointerCoarse = window.matchMedia("(pointer: coarse)").matches;
      }
    } catch (e) {}

    return {
      hardwareConcurrency: nav.hardwareConcurrency || null,
      deviceMemory: nav.deviceMemory || null, // GB on some browsers
      colorDepth: scr.colorDepth || null,
      maxTouchPoints:
        typeof nav.maxTouchPoints === "number" ? nav.maxTouchPoints : null,
      timeZone: intlOpts.timeZone || null,
      languages: nav.languages || (nav.language ? [nav.language] : null),
      pointerCoarse: pointerCoarse,
      platform: nav.platform || null,
      vendor: nav.vendor || null,
      userAgent: nav.userAgent || null
    };
  }

  function buildBasePayload(config, eventName) {
    return {
      site: config.site || "analytics-lab",
      event: eventName,
      sessionId: config.sessionId,
      ts: new Date().toISOString(),
      path: window.location.pathname + window.location.search,
      referrer: document.referrer || null,
      userAgent: navigator.userAgent || null,
      language: navigator.language || null,
      platform: navigator.platform || null,
      device: {
        width: window.innerWidth || null,
        height: window.innerHeight || null,
        screenWidth: window.screen && window.screen.width,
        screenHeight: window.screen && window.screen.height,
        pixelRatio: window.devicePixelRatio || 1,
        touch: "ontouchstart" in window || navigator.maxTouchPoints > 0
      },
      fpTraits: getFingerprintTraits()
    };
  }

  function sendAnalyticsEvent(config, eventName, extra) {
    if (!config.endpoint) return;

    var payload = buildBasePayload(config, eventName);
    if (extra && typeof extra === "object") {
      for (var k in extra) {
        if (Object.prototype.hasOwnProperty.call(extra, k)) {
          payload[k] = extra[k];
        }
      }
    }

    var body = JSON.stringify(payload);

    try {
      // Prefer sendBeacon so the request is sent even on page unload
      if (navigator.sendBeacon) {
        var blob = new Blob([body], { type: "application/json" });
        navigator.sendBeacon(config.endpoint, blob);
      } else {
        // Standard CORS-aware POST; Worker will send proper CORS headers
        fetch(config.endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          keepalive: true,
          credentials: "include"
        }).catch(function () {});
      }
    } catch (e) {
      // Never break the page
    }
  }

  window.initAnalyticsTracking = function initAnalyticsTracking(options) {
    try {
      var pageLoadMs = Date.now();
      var sessionId = getSessionId();
      var cfg = {
        site: (options && options.site) || "analytics-lab",
        baseEvent: (options && options.baseEvent) || "page",
        endpoint: (options && options.endpoint) || DEFAULT_ENDPOINT || null,
        secret: (options && options.secret) || DEFAULT_SECRET || null,
        sessionId: sessionId
      };

      if (!cfg.endpoint) return;

      // Initial visit
      sendAnalyticsEvent(cfg, cfg.baseEvent + "_visit");

      // Time-on-page on unload
      window.addEventListener("beforeunload", function () {
        var durationMs = Date.now() - pageLoadMs;
        if (durationMs >= 0 && durationMs < 24 * 60 * 60 * 1000) {
          sendAnalyticsEvent(cfg, cfg.baseEvent + "_unload", {
            durationMs: durationMs
          });
        }
      });
    } catch (e) {
      // Fail silently
    }
  };
})();

