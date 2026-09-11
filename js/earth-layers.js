/**
 * Earth Layers - Main Application Entry Point
 * Orchestrates all the modular components
 */

import { ThemeManager } from "./modules/theme.js";
import { NavigationManager } from "./modules/navigation.js";
import { SlideshowManager } from "./modules/slideshow.js";

class EarthLayersApp {
  constructor() {
    this.managers = new Map();
    this.init();
  }

  init() {
    document.addEventListener("DOMContentLoaded", () => {
      this.initializeManagers();

      // Cached pages resume with their existing handlers and timers. Only
      // tear down managers when the document is actually being discarded.
      window.addEventListener("pagehide", (event) => {
        if (!event.persisted) this.cleanup();
      });
    });
  }

  initializeManagers() {
    try {
      // Initialize theme management
      this.managers.set("theme", new ThemeManager());

      // Initialize navigation
      this.managers.set("navigation", new NavigationManager());

      // Initialize slideshow functionality
      this.managers.set("slideshow", new SlideshowManager());
    } catch (error) {
      console.error("Error initializing Earth Layers app:", error);
    }
  }

  getManager(name) {
    return this.managers.get(name);
  }

  cleanup() {
    this.managers.forEach((manager, name) => {
      try {
        if (manager.cleanup && typeof manager.cleanup === "function") {
          manager.cleanup();
        }
      } catch (error) {
        console.error(`Error cleaning up ${name} manager:`, error);
      }
    });
    this.managers.clear();
  }
}

// Initialize the application
new EarthLayersApp();

// Export for potential external use
export { EarthLayersApp };
