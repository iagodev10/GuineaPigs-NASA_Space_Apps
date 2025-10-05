// FireWatch Diagnostics Script
// - Checks fire count changes between consecutive reads
// - Verifies theme toggle responsiveness (site + map)

(function () {
  const log = (...args) => console.log("[Diagnostics]", ...args)
  const error = (...args) => console.error("[Diagnostics]", ...args)

  async function fetchJson(url, options) {
    const resp = await fetch(url, options)
    const text = await resp.text()
    try {
      return JSON.parse(text)
    } catch (e) {
      return { __raw: text, error: String(e) }
    }
  }

  async function checkFireCounts(apiBase) {
    try {
      const first = await fetchJson(`${apiBase}/fires`)
      const firstCount = Number(first && first.count)
      log("First fires count:", firstCount)

      // Force backend refresh to attempt a change in data source
      await fetch(`${apiBase}/refresh`, { method: "POST" }).catch(() => {})

      // Small delay to allow refresh to complete
      await new Promise((r) => setTimeout(r, 1500))

      const second = await fetchJson(`${apiBase}/fires`)
      const secondCount = Number(second && second.count)
      log("Second fires count:", secondCount)

      if (!Number.isFinite(firstCount) || !Number.isFinite(secondCount)) {
        return { ok: false, reason: "invalid_counts" }
      }

      const changed = firstCount !== secondCount
      return { ok: changed, firstCount, secondCount }
    } catch (e) {
      error("Fire count check failed:", e)
      return { ok: false, reason: String(e) }
    }
  }

  async function checkThemeToggle() {
    try {
      const el = document.documentElement
      const current = el.getAttribute("data-theme") === "light" ? "light" : "dark"
      const target = current === "light" ? "dark" : "light"

      let themeChanged = false
      const onChange = (evt) => {
        const t = evt && evt.detail && evt.detail.theme
        if (t === target) themeChanged = true
      }
      window.addEventListener("themechange", onChange, { once: true })

      if (typeof window.setTheme === "function") {
        window.setTheme(target)
      } else {
        // Fallback: directly set attribute
        el.setAttribute("data-theme", target)
        themeChanged = true
      }

      // Allow DOM/CSS to apply
      await new Promise((r) => setTimeout(r, 300))

      const applied = el.getAttribute("data-theme") === "light" ? "light" : "dark"

      // If on map page, ensure map tiles re-applied
      let mapSynced = true
      if (window.map && typeof L !== "undefined") {
        // Find a tile layer and check its URL matches the theme expectation
        let tileUrl = null
        window.map.eachLayer((layer) => {
          if (layer instanceof L.TileLayer && !tileUrl) {
            // Leaflet stores the URL template in layer._url
            tileUrl = layer._url || null
          }
        })
        if (target === "light") {
          mapSynced = !!(tileUrl && tileUrl.includes("tile.openstreetmap.org"))
        } else {
          mapSynced = !!(tileUrl && tileUrl.includes("basemaps.cartocdn.com/dark_all"))
        }
      }

      // Restore original theme to avoid visible flicker during diagnostics
      try {
        if (typeof window.setTheme === "function") {
          window.setTheme(current)
        } else {
          el.setAttribute("data-theme", current)
        }
      } catch (_) {}

      const ok = themeChanged && applied === target && mapSynced
      return { ok, themeChanged, applied, target, mapSynced }
    } catch (e) {
      error("Theme toggle check failed:", e)
      return { ok: false, reason: String(e) }
    }
  }

  async function run() {
    const apiBase = (window.CONFIG && window.CONFIG.BACKEND_URL) || "http://localhost:5000/api"

    const fireRes = await checkFireCounts(apiBase)
    const themeRes = await checkThemeToggle()

    // Detailed logs
    log("Fire count diagnostics:", fireRes)
    log("Theme toggle diagnostics:", themeRes)

    // Final verdict
    if (!fireRes.ok && fireRes.reason === "invalid_counts") {
      console.log("ERRO: contagem de focos não muda (contagens inválidas)")
      return
    }
    if (!fireRes.ok) {
      console.log("ERRO: contagem de focos não muda")
      return
    }
    if (!themeRes.ok) {
      console.log("ERRO: troca de tema não responde")
      return
    }
    console.log("OK")
  }

  // Gate diagnostics to avoid auto theme changes in production
  function diagnosticsEnabled() {
    try {
      const url = new URL(window.location.href)
      if (url.searchParams.get("diagnostics") === "1") return true
    } catch (_) {}
    try {
      if (window.FIREWATCH_DIAGNOSTICS === true) return true
    } catch (_) {}
    try {
      if (localStorage.getItem("firewatch_diagnostics") === "1") return true
    } catch (_) {}
    return false
  }

  // Auto-run only when explicitly enabled
  if (diagnosticsEnabled()) {
    if (document.readyState === "complete" || document.readyState === "interactive") {
      setTimeout(run, 100)
    } else {
      document.addEventListener("DOMContentLoaded", () => setTimeout(run, 100))
    }
  }

  // Expose for manual trigger
  if (typeof window !== "undefined") {
    window.runDiagnostics = run
  }
})()


