/**
 * Theme Management Module
 * Handles light/dark theme switching and persistence
 */

class ThemeManager {
  constructor() {
    this.themeToggle = document.getElementById("theme-toggle");
    this.toggleIcon = document.querySelector(".toggle-icon");
    this.sunElement = document.getElementById("sun");
    this.moonElement = document.getElementById("moon");

    this.eventListeners = [];
    this.init();
  }

  init() {
    this.loadSavedTheme();
    this.bindEvents();
  }

  loadSavedTheme() {
    const savedTheme = localStorage.getItem("theme") || "light";
    this.setTheme(savedTheme);
  }

  updateThemeIcon(theme) {
    if (this.toggleIcon) {
      this.toggleIcon.innerHTML = theme === "dark" ? "🌙" : "☀️";
    }
  }

  setTheme(theme) {
    if (theme === "dark") {
      document.body.setAttribute("data-theme", "dark");
    } else {
      document.body.removeAttribute("data-theme");
    }
    localStorage.setItem("theme", theme);
    this.updateThemeIcon(theme);
  }

  toggleTheme() {
    const currentTheme = document.body.getAttribute("data-theme") === "dark" ? "dark" : "light";
    const newTheme = currentTheme === "light" ? "dark" : "light";
    this.setTheme(newTheme);
  }

  handleSunClick() {
    const currentTheme = document.body.getAttribute("data-theme") === "dark" ? "dark" : "light";
    if (currentTheme === "light") {
      this.setTheme("dark");
    }
  }

  handleMoonClick() {
    const currentTheme = document.body.getAttribute("data-theme") === "dark" ? "dark" : "light";
    if (currentTheme === "dark") {
      this.setTheme("light");
    }
  }

  bindEvents() {
    if (this.themeToggle) {
      const toggleHandler = () => this.toggleTheme();
      this.themeToggle.addEventListener("click", toggleHandler);
      this.eventListeners.push({
        element: this.themeToggle,
        event: "click",
        handler: toggleHandler,
      });
    }

    if (this.sunElement) {
      const sunHandler = () => this.handleSunClick();
      this.sunElement.addEventListener("click", sunHandler);
      this.eventListeners.push({ element: this.sunElement, event: "click", handler: sunHandler });
    }

    if (this.moonElement) {
      const moonHandler = () => this.handleMoonClick();
      this.moonElement.addEventListener("click", moonHandler);
      this.eventListeners.push({ element: this.moonElement, event: "click", handler: moonHandler });
    }
  }

  cleanup() {
    this.eventListeners.forEach(({ element, event, handler }) => {
      element.removeEventListener(event, handler);
    });
    this.eventListeners = [];
  }
}

export { ThemeManager };
