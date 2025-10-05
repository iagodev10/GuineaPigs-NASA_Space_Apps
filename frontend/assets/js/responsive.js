// Responsive behavior and UI interactions for FireWatch

// Initialize responsive features when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  initMobileMenu()
  initLanguageSelector()
  initScrollEffects()
  initResponsiveMap()
  if (typeof window.initTheme === "function") {
    window.initTheme()
  }
})

// Mobile Menu Toggle
function initMobileMenu() {
  const mobileMenuBtn = document.getElementById("mobileMenuBtn")
  const mobileMenu = document.getElementById("mobileMenu")

  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener("click", (e) => {
      e.stopPropagation()
      mobileMenu.classList.toggle("active")

      // Update icon
      const icon = mobileMenuBtn.querySelector("i")
      if (icon) {
        icon.classList.toggle("fa-bars")
        icon.classList.toggle("fa-times")
      }
    })

    // Close menu when clicking outside
    document.addEventListener("click", (e) => {
      if (!mobileMenu.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
        mobileMenu.classList.remove("active")
        const icon = mobileMenuBtn.querySelector("i")
        if (icon) {
          icon.classList.remove("fa-times")
          icon.classList.add("fa-bars")
        }
      }
    })

    // Close menu when clicking a link
    const mobileLinks = mobileMenu.querySelectorAll(".mobile-nav-link")
    mobileLinks.forEach((link) => {
      link.addEventListener("click", () => {
        mobileMenu.classList.remove("active")
        const icon = mobileMenuBtn.querySelector("i")
        if (icon) {
          icon.classList.remove("fa-times")
          icon.classList.add("fa-bars")
        }
      })
    })
  }
}

// Language Selector Dropdown
function initLanguageSelector() {
  const languageBtn = document.getElementById("languageBtn")
  const languageDropdown = document.getElementById("languageDropdown")

  if (languageBtn && languageDropdown) {
    languageBtn.addEventListener("click", (e) => {
      e.stopPropagation()
      languageDropdown.classList.toggle("active")
    })

    // Close dropdown when clicking outside
    document.addEventListener("click", (e) => {
      if (!languageDropdown.contains(e.target) && !languageBtn.contains(e.target)) {
        languageDropdown.classList.remove("active")
      }
    })
  }

  // Language option clicks (both desktop and mobile)
  const languageOptions = document.querySelectorAll(".language-option")
  languageOptions.forEach((option) => {
    option.addEventListener("click", () => {
      const lang = option.getAttribute("data-lang")
      if (lang && typeof window.changeLanguage === "function") {
        window.changeLanguage(lang)
      }
    })
  })
}

// Scroll Effects
function initScrollEffects() {
  const header = document.querySelector(".header")

  if (header) {
    let lastScroll = 0

    window.addEventListener("scroll", () => {
      const currentScroll = window.pageYOffset

      // Add shadow on scroll
      if (currentScroll > 10) {
        header.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.3)"
      } else {
        header.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
      }

      lastScroll = currentScroll
    })
  }

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      const href = this.getAttribute("href")
      if (href !== "#" && href !== "") {
        e.preventDefault()
        const target = document.querySelector(href)
        if (target) {
          target.scrollIntoView({
            behavior: "smooth",
            block: "start",
          })
        }
      }
    })
  })
}

// Responsive Map Adjustments
function initResponsiveMap() {
  const mapContainer = document.getElementById("map")

  if (mapContainer) {
    // Adjust map height on window resize
    const adjustMapHeight = () => {
      const width = window.innerWidth

      if (width < 480) {
        mapContainer.style.height = "350px"
      } else if (width < 768) {
        mapContainer.style.height = "400px"
      } else {
        mapContainer.style.height = "600px"
      }

      // Trigger map resize if Leaflet is available
      if (window.map && typeof window.map.invalidateSize === "function") {
        setTimeout(() => {
          window.map.invalidateSize()
        }, 100)
      }
    }

    // Initial adjustment
    adjustMapHeight()

    // Adjust on resize with debounce
    let resizeTimer
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(adjustMapHeight, 250)
    })
  }
}

// Utility: Debounce function
function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// Handle window resize events
const handleResize = debounce(() => {
  // Recalculate any responsive elements
  const width = window.innerWidth

  // Close mobile menu on desktop
  if (width > 768) {
    const mobileMenu = document.getElementById("mobileMenu")
    if (mobileMenu && mobileMenu.classList.contains("active")) {
      mobileMenu.classList.remove("active")
      const mobileMenuBtn = document.getElementById("mobileMenuBtn")
      if (mobileMenuBtn) {
        const icon = mobileMenuBtn.querySelector("i")
        if (icon) {
          icon.classList.remove("fa-times")
          icon.classList.add("fa-bars")
        }
      }
    }
  }
}, 250)

window.addEventListener("resize", handleResize)

// Initialize translations when page loads
if (typeof window.initTranslations === "function") {
  window.initTranslations()
}

// Export functions for external use
if (typeof window !== "undefined") {
  window.responsiveUtils = {
    debounce,
    initMobileMenu,
    initLanguageSelector,
    initScrollEffects,
    initResponsiveMap,
  }
}
