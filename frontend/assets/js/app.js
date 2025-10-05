// FireWatch - Backend Integration & Map Logic
// This file handles all backend API calls and map functionality

// Configuration
const CONFIG = {
  BACKEND_URL: "http://localhost:5000/api",
  MAP_THEME: "dark",
  DEFAULT_ZOOM: 2,
  CITY_ZOOM: 11,
  GEOCODING_API: "https://nominatim.openstreetmap.org/search",
  IP_LOCATION_API: "https://ipinfo.io/json",
  COUNTRY_GEOJSON: "https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json",
  REFRESH_INTERVAL_MS: 20 * 60 * 1000,
}

// Global variables
let map
const markers = []
let markerClusterGroup
let cityHighlight = null
let userMarker = null
let currentMapTheme = CONFIG.MAP_THEME
let currentFireData = []
const L = window.L
let countriesLayer = null

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  // Initialize map if on index page
  if (document.getElementById("map")) {
    initializeMap()
    loadFireData()
    startAutoRefresh()

    // React to global theme changes to keep map tiles in sync
    window.addEventListener("themechange", (e) => {
      const theme = e?.detail?.theme === "light" ? "light" : "dark"
      currentMapTheme = theme
      applyMapTheme(currentMapTheme)
    })
  }

  // Setup event listeners
  setupEventListeners()
})

// Setup all event listeners
function setupEventListeners() {
  // Country search
  const searchBtn = document.getElementById("searchBtn")
  const countrySearch = document.getElementById("countrySearch")

  if (searchBtn && countrySearch) {
    searchBtn.addEventListener("click", () => {
      const country = countrySearch.value.trim()
      if (country) searchCountry(country)
    })

    countrySearch.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        const country = countrySearch.value.trim()
        if (country) searchCountry(country)
      }
    })
  }

  // Quick search buttons
  const quickBtns = document.querySelectorAll(".quick-btn")
  quickBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
      const country = this.getAttribute("data-country")
      searchCountry(country)
    })
  })

  // Close dashboard
  const closeDashboard = document.getElementById("closeDashboard")
  if (closeDashboard) {
    closeDashboard.addEventListener("click", () => {
      document.getElementById("countryDashboard").style.display = "none"
    })
  }

  // City search
  const citySearchBtn = document.getElementById("citySearchBtn")
  const citySearch = document.getElementById("citySearch")

  if (citySearchBtn && citySearch) {
    citySearchBtn.addEventListener("click", () => {
      const city = citySearch.value.trim()
      if (city) searchCity(city)
    })

    citySearch.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        const city = citySearch.value.trim()
        if (city) searchCity(city)
      }
    })
  }

  // Map controls
  const toggleMapThemeBtn = document.getElementById("toggleMapTheme")
  const refreshDataBtn = document.getElementById("refreshData")
  const getUserLocationBtn = document.getElementById("getUserLocation")
  const clearHighlightsBtn = document.getElementById("clearHighlights")

  if (toggleMapThemeBtn) {
    toggleMapThemeBtn.addEventListener("click", () => {
      // When map theme button is clicked, also toggle site theme
      const nextTheme = (document.documentElement.getAttribute("data-theme") === "light") ? "dark" : "light"
      if (typeof window.setTheme === "function") {
        window.setTheme(nextTheme)
      }
      currentMapTheme = nextTheme === "light" ? "light" : "dark"
      applyMapTheme(currentMapTheme)
    })
  }

  if (refreshDataBtn) {
    refreshDataBtn.addEventListener("click", async () => {
      showLoading(true)
      try {
        await fetch(`${CONFIG.BACKEND_URL}/refresh`, { method: "POST" })
        await loadFireData()
        alert("Data updated successfully!")
      } catch (error) {
        console.error("[Frontend] Error refreshing data:", error)
        alert("Error updating data. Please try again.")
      }
      showLoading(false)
    })
  }

  if (getUserLocationBtn) {
    getUserLocationBtn.addEventListener("click", () => {
      getUserLocationFromIP()
    })
  }

  if (clearHighlightsBtn) {
    clearHighlightsBtn.addEventListener("click", () => {
      clearAllHighlights()
    })
  }
}

// Initialize Leaflet map
function initializeMap() {
  map = L.map("map", {
    center: [0, 0],
    zoom: CONFIG.DEFAULT_ZOOM,
    zoomControl: true,
    scrollWheelZoom: true,
  })

  applyMapTheme(currentMapTheme)
  getUserLocationFromIP()
  loadCountriesLayer()

  // Make map globally accessible
  window.map = map
}

// Auto refresh backend data and reload map every REFRESH_INTERVAL_MS
function startAutoRefresh() {
  setInterval(async () => {
    try {
      await fetch(`${CONFIG.BACKEND_URL}/refresh`, { method: "POST" })
    } catch (e) {
      // ignore refresh errors; fallback to just reload data
    }
    await loadFireData()
    await updateGlobalStats()
  }, CONFIG.REFRESH_INTERVAL_MS)
}

// Apply map theme (dark/light)
function applyMapTheme(theme) {
  map.eachLayer((layer) => {
    if (layer instanceof L.TileLayer) {
      map.removeLayer(layer)
    }
  })

  if (theme === "dark") {
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: "abcd",
      maxZoom: 19,
    }).addTo(map)
  } else {
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map)
  }
}

// Load countries as GeoJSON and add hover highlight
async function loadCountriesLayer() {
  try {
    const res = await fetch(CONFIG.COUNTRY_GEOJSON)
    const geojson = await res.json()

    const baseStyle = {
      color: "#64748b",
      weight: 1,
      fillColor: "#0ea5e9",
      fillOpacity: 0.05,
    }

    const hoverStyle = {
      color: "#0ea5e9",
      weight: 2,
      fillColor: "#0ea5e9",
      fillOpacity: 0.2,
    }

    countriesLayer = L.geoJSON(geojson, {
      style: () => baseStyle,
      onEachFeature: (feature, layer) => {
        layer.on({
          mouseover: function () {
            this.setStyle(hoverStyle)
            if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
              this.bringToFront()
            }
          },
          mouseout: function () {
            this.setStyle(baseStyle)
          },
          click: function () {
            const name = feature.properties && (feature.properties.ADMIN || feature.properties.name)
            if (name) {
              searchCountry(name)
            }
          },
        })
      },
    }).addTo(map)
  } catch (error) {
    console.warn("[Frontend] Could not load countries GeoJSON:", error)
  }
}

// Load fire data from backend
async function loadFireData() {
  showLoading(true)

  // Remove old markers/groups to avoid accumulation
  if (markerClusterGroup) {
    map.removeLayer(markerClusterGroup)
    markerClusterGroup.clearLayers()
    markerClusterGroup = null
  }
  if (Array.isArray(markers) && markers.length) {
    markers.length = 0
  }

  try {
    const response = await fetch(`${CONFIG.BACKEND_URL}/fires`)
    const result = await response.json()

    if (!result.success) throw new Error("Error loading fire data")

    console.log("[Frontend] Loaded", result.count, "fire records")
    currentFireData = result.data

    // Update global stats
    updateGlobalStats()

    // Create a fresh marker cluster group (no accumulation)
    markerClusterGroup = L.markerClusterGroup({
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
    })

    // Add markers to cluster
    result.data.forEach((fire) => {
      const color = getMarkerColor(fire.confidence)
      const marker = L.circleMarker([fire.lat, fire.lon], {
        radius: 6,
        fillColor: color,
        color: "#fff",
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8,
      })

      const popup = `
        <div style="color: #1e293b; font-family: sans-serif; min-width: 200px;">
          <h3 style="margin: 0 0 8px 0; color: ${color}; font-size: 16px;">🔥 Fire Hotspot</h3>
          <p style="margin: 4px 0;"><strong>Confidence:</strong> ${fire.confidence.toFixed(1)}%</p>
          <p style="margin: 4px 0;"><strong>Temperature:</strong> ${fire.temp.toFixed(1)}K</p>
          <p style="margin: 4px 0;"><strong>FRP:</strong> ${fire.frp.toFixed(1)} MW</p>
          <p style="margin: 4px 0;"><strong>Date:</strong> ${fire.date}</p>
          <p style="margin: 4px 0;"><strong>Time:</strong> ${fire.time}</p>
          <p style="margin: 4px 0;"><strong>Satellite:</strong> ${fire.satellite}</p>
        </div>
      `
      marker.bindPopup(popup)
      markerClusterGroup.addLayer(marker)
    })

    if (markerClusterGroup) {
      map.addLayer(markerClusterGroup)
    }
    showLoading(false)
  } catch (error) {
    console.error("[Frontend] Error loading fire data:", error)
    alert("Error loading fire data. Please check if the backend is running.")
    showLoading(false)
  }
}

// Update global statistics
async function updateGlobalStats() {
  try {
    const response = await fetch(`${CONFIG.BACKEND_URL}/fires/stats`)
    const result = await response.json()

    if (result.success) {
      animateValue("totalFires", 0, result.stats.totalFires, 1000)
      animateValue("highRisk", 0, result.stats.highRisk, 1000)
      animateValue("avgConfidence", 0, result.stats.avgConfidence, 1000, "%")
      animateValue("countriesAffected", 0, result.stats.countriesAffected, 1000)
    }
  } catch (error) {
    console.error("[Frontend] Error loading stats:", error)
  }
}

// Animate number values
function animateValue(id, start, end, duration, suffix = "") {
  const element = document.getElementById(id)
  if (!element) return

  const range = end - start
  const increment = range / (duration / 16)
  let current = start

  const timer = setInterval(() => {
    current += increment
    if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
      current = end
      clearInterval(timer)
    }
    element.textContent = Math.round(current) + suffix
  }, 16)
}

// Get marker color based on confidence
function getMarkerColor(confidence) {
  if (confidence > 80) return "#ef4444" // High - Red
  if (confidence > 50) return "#f59e0b" // Medium - Orange
  return "#10b981" // Low - Green
}

// Search for fires by country
async function searchCountry(countryName) {
  showLoading(true)

  try {
    const response = await fetch(`${CONFIG.BACKEND_URL}/fires/country/${encodeURIComponent(countryName)}`)
    const result = await response.json()

    if (!result.success) {
      alert("Country not found or no data available.")
      showLoading(false)
      return
    }

    // Show dashboard
    const dashboard = document.getElementById("countryDashboard")
    dashboard.style.display = "block"

    // Update dashboard data
    document.getElementById("countryName").textContent = result.country
    document.getElementById("countryFires").textContent = result.stats.fires
    document.getElementById("countryHighRisk").textContent = result.stats.highRisk
    document.getElementById("countryAvgTemp").textContent = result.stats.avgTemp.toFixed(1) + "°K"
    document.getElementById("countryConfidence").textContent = result.stats.confidence.toFixed(1) + "%"

    // Alert messages by country
    const alertMessages = {
      Brazil: "Alert: Hotspots concentrated in multiple regions. Intensive monitoring recommended.",
      "United States": "Alert: High activity detected. Weather conditions favorable for spread.",
      Canada: "Monitoring: Active hotspots detected. Situation under control.",
      Australia: "Alert: Active fire season. Multiple hotspots detected.",
      Indonesia: "Alert: Fires detected. Regional air quality impact.",
      Russia: "Monitoring: Forest fires detected. Extensive area affected.",
    }

    document.getElementById("countryAlert").textContent =
      alertMessages[countryName] || `${result.stats.fires} fire hotspots detected in ${result.country}.`

    // Zoom to country fires
    if (result.data.length > 0) {
      const bounds = L.latLngBounds(result.data.map((fire) => [fire.lat, fire.lon]))
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 6 })
    }

    // Scroll to dashboard
    dashboard.scrollIntoView({ behavior: "smooth", block: "start" })
    showLoading(false)
  } catch (error) {
    console.error("[Frontend] Error searching country:", error)
    alert("Error searching country data. Please check if the backend is running.")
    showLoading(false)
  }
}

// Search for city and highlight on map
async function searchCity(cityName) {
  if (!cityName || cityName.trim() === "") {
    alert("Please enter a city name.")
    return
  }

  showLoading(true)

  try {
    const url = `${CONFIG.GEOCODING_API}?q=${encodeURIComponent(cityName)}&format=json&limit=1`
    const response = await fetch(url)
    const data = await response.json()

    if (!data || data.length === 0) {
      alert("City not found. Try another name.")
      showLoading(false)
      return
    }

    const city = data[0]
    const lat = Number.parseFloat(city.lat)
    const lon = Number.parseFloat(city.lon)
    const bbox = city.boundingbox

    map.setView([lat, lon], CONFIG.CITY_ZOOM)

    if (document.getElementById("highlightCity").checked) {
      highlightCityArea(bbox, city.display_name)
    }

    if (document.getElementById("showCityFires").checked) {
      filterFiresByBoundingBox(bbox)
    }

    showLoading(false)
  } catch (error) {
    console.error("[Frontend] Error searching city:", error)
    alert("Error searching city. Please try again.")
    showLoading(false)
  }
}

// Highlight city area on map
function highlightCityArea(bbox, cityName) {
  if (cityHighlight) {
    map.removeLayer(cityHighlight)
  }

  const south = Number.parseFloat(bbox[0])
  const north = Number.parseFloat(bbox[1])
  const west = Number.parseFloat(bbox[2])
  const east = Number.parseFloat(bbox[3])

  const bounds = [
    [south, west],
    [north, east],
  ]

  cityHighlight = L.rectangle(bounds, {
    color: "#3b82f6",
    weight: 3,
    fillColor: "rgba(59, 130, 246, 0.2)",
    fillOpacity: 0.3,
  }).addTo(map)

  cityHighlight.bindPopup(`
    <div style="color: #1e293b; font-family: sans-serif;">
      <h3 style="margin: 0 0 8px 0; color: #3b82f6; font-size: 16px;">📍 ${cityName}</h3>
      <p style="margin: 4px 0;">Highlighted area on map</p>
    </div>
  `)

  map.fitBounds(bounds, { padding: [50, 50] })
}

// Filter fires by bounding box
function filterFiresByBoundingBox(bbox) {
  const south = Number.parseFloat(bbox[0])
  const north = Number.parseFloat(bbox[1])
  const west = Number.parseFloat(bbox[2])
  const east = Number.parseFloat(bbox[3])

  if (markerClusterGroup) {
    markerClusterGroup.eachLayer((layer) => {
      const latLng = layer.getLatLng()
      const isInBounds = latLng.lat >= south && latLng.lat <= north && latLng.lng >= west && latLng.lng <= east

      if (isInBounds) {
        layer.setStyle({ opacity: 1, fillOpacity: 0.8 })
      } else {
        layer.setStyle({ opacity: 0.2, fillOpacity: 0.1 })
      }
    })
  }
}

// Get user location from IP
async function getUserLocationFromIP() {
  try {
    const response = await fetch(CONFIG.IP_LOCATION_API)
    const data = await response.json()

    if (data.loc) {
      const [lat, lon] = data.loc.split(",").map(Number.parseFloat)

      if (userMarker) {
        map.removeLayer(userMarker)
      }

      userMarker = L.marker([lat, lon], {
        icon: L.icon({
          iconUrl:
            "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
          shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41],
        }),
      }).addTo(map)

      userMarker.bindPopup(`
        <div style="color: #1e293b; font-family: sans-serif;">
          <h3 style="margin: 0 0 8px 0; color: #10b981; font-size: 16px;">📍 You are here</h3>
          <p style="margin: 4px 0;"><strong>City:</strong> ${data.city || "Unknown"}</p>
          <p style="margin: 4px 0;"><strong>Country:</strong> ${data.country || "Unknown"}</p>
          <p style="margin: 4px 0;"><strong>Coordinates:</strong> ${lat.toFixed(4)}, ${lon.toFixed(4)}</p>
        </div>
      `)

      map.setView([lat, lon], 6)
    }
  } catch (error) {
    console.log("[Frontend] Could not detect user location:", error)
  }
}

// Show/hide loading indicator
function showLoading(show) {
  const loadingEl = document.getElementById("mapLoading")
  if (loadingEl) {
    loadingEl.style.display = show ? "flex" : "none"
  }
}

// Clear all highlights and filters
function clearAllHighlights() {
  if (cityHighlight) {
    map.removeLayer(cityHighlight)
    cityHighlight = null
  }

  if (markerClusterGroup) {
    markerClusterGroup.eachLayer((layer) => {
      layer.setStyle({ opacity: 1, fillOpacity: 0.8 })
    })
  }
}
