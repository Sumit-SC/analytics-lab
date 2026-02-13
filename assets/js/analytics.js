// Lightweight analytics helper for all pages in this project.
// Usage in HTML:
//   <script src="./assets/js/analytics.js"></script>
//   <script>
//     initAnalyticsTracking({
//       site: 'analytics-lab',
//       baseEvent: 'playground',
//       endpoint: 'https://events.colab.indevs.in/api/events'
//     });
//   </script>

(function () {
  var DEFAULT_ENDPOINT = "https://events.colab.indevs.in/api/events";
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

    // Extract base URL for fallback paths
    var baseUrl = config.endpoint;
    try {
      var urlObj = new URL(config.endpoint);
      baseUrl = urlObj.origin;
    } catch (e) {
      // If URL parsing fails, use as-is
    }

    // Fallback paths to try (less likely to be blocked)
    var fallbackPaths = ["/api/events", "/api/track", "/events", "/track", "/ping", "/log"];
    var endpointsToTry = [config.endpoint];
    
    // Add fallbacks if we can extract base URL
    if (baseUrl !== config.endpoint) {
      for (var i = 0; i < fallbackPaths.length; i++) {
        endpointsToTry.push(baseUrl + fallbackPaths[i]);
      }
    }

    // Strategy 1: Try sendBeacon first (often less blocked than fetch)
    var beaconSent = false;
    if (navigator.sendBeacon) {
      try {
        for (var b = 0; b < endpointsToTry.length; b++) {
          var blob = new Blob([body], { type: "application/json" });
          if (navigator.sendBeacon(endpointsToTry[b], blob)) {
            beaconSent = true;
            break; // Success
          }
        }
      } catch (e) {
        // sendBeacon failed, continue to fetch fallback
      }
    }

    // Strategy 2: If sendBeacon didn't work, try fetch with multiple endpoints
    if (!beaconSent) {
      function tryEndpoint(index) {
        if (index >= endpointsToTry.length) {
          // All endpoints failed - silently fail
          return;
        }
        
        var endpoint = endpointsToTry[index];
        var timeoutId = setTimeout(function() {
          // Timeout after 2 seconds, try next endpoint
          tryEndpoint(index + 1);
        }, 2000);

        fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: body,
          keepalive: true,
          credentials: "omit"
        })
          .then(function (response) {
            clearTimeout(timeoutId);
            if (response.ok) {
              // Success - stop trying other endpoints
              return;
            } else {
              // Try next endpoint on error
              tryEndpoint(index + 1);
            }
          })
          .catch(function (err) {
            clearTimeout(timeoutId);
            // Try next endpoint on failure
            tryEndpoint(index + 1);
          });
      }

      try {
        tryEndpoint(0);
      } catch (e) {
        // Never break the page
      }
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

