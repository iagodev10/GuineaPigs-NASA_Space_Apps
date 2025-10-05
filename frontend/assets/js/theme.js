// Theme management: light/dark, persisted with localStorage

(function () {
  const THEME_STORAGE_KEY = "firewatch-theme";

  // Aplica o tema no site inteiro)(aqui)
  function applyTheme(theme) {
    if (theme === "light") {
      document.documentElement.setAttribute("data-theme", "light");
    } else {
      document.documentElement.setAttribute("data-theme", "dark");
    }
    // Update toggle icon and tooltip
    const btn = document.getElementById("themeToggleBtn");
    if (btn) {
      const icon = btn.querySelector("i");
      if (icon) {
        icon.classList.remove("fa-sun", "fa-moon");
        if (theme === "light") {
          icon.classList.add("fa-moon");
        } else {
          icon.classList.add("fa-sun");
        }
      }
      const label = theme === "light" ? "Switch to dark" : "Switch to light";
      btn.setAttribute("aria-label", label);
      btn.setAttribute("title", label);
    }
    // Dispatch event so other modules (e.g., map) can react
    const evt = new CustomEvent("themechange", { detail: { theme } });
    window.dispatchEvent(evt);
  }

  function getPreferredTheme() {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === "light" || saved === "dark") return saved;
    const prefersLight = window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches;
    return prefersLight ? "light" : "dark";
  }

  function setTheme(theme) {
    const value = theme === "light" ? "light" : "dark";
    localStorage.setItem(THEME_STORAGE_KEY, value);
    applyTheme(value);
  }

  function initTheme() {
    applyTheme(getPreferredTheme());
    // Bind header toggle button if present
    const btn = document.getElementById("themeToggleBtn");
    if (btn) {
      btn.addEventListener("click", () => {
        const current = document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
        setTheme(current === "light" ? "dark" : "light");
      });
    }
  }

  // Expose globally
  if (typeof window !== "undefined") {
    window.setTheme = setTheme;
    window.initTheme = initTheme;
  }
})();