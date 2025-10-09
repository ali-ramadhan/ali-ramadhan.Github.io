/**
 * Navigation Module
 * Handles section navigation, scrolling, and active state management
 */

class NavigationManager {
  constructor() {
    this.CONFIG = {
      STARTING_SECTION: 2, // Land section index
      SCROLL_ANIMATION_DURATION: 1000, // Scroll animation timeout in ms
    };

    this.layers = document.querySelectorAll(".layer");
    this.navDots = document.querySelectorAll(".nav-dot");
    this.isScrolling = false;
    this.currentSection = this.CONFIG.STARTING_SECTION;

    this.eventListeners = [];
    this.intersectionObserver = null;

    this.init();
  }

  init() {
    this.cacheSectionData();
    this.scrollToInitialSection();
    this.setupIntersectionObserver();
    this.bindEvents();
  }

  cacheSectionData() {
    this.sectionData = Array.from(this.layers).map((layer, index) => ({
      element: layer,
      id: layer.id,
      index: index,
    }));
  }

  scrollToInitialSection() {
    // Check if there's a hash in the URL
    const hash = window.location.hash.slice(1); // Remove the # prefix

    let targetSection;
    let targetId;

    if (hash && (targetSection = this.getSectionById(hash))) {
      // If there's a valid hash, scroll to that section
      targetId = hash;
    } else {
      // Otherwise, default to the land section
      targetSection = this.getSectionById("land");
      targetId = "land";
    }

    if (targetSection) {
      targetSection.scrollIntoView({ behavior: "instant" });
      this.updateActiveNav(targetId);
      this.currentSection = this.getSectionIndex(targetId);
    }
  }

  updateActiveNav(layerId) {
    this.navDots.forEach((dot) => {
      const isActive = dot.getAttribute("data-layer") === layerId;

      dot.classList.toggle("active", isActive);

      if (isActive) {
        dot.setAttribute("aria-current", "page");
      } else {
        dot.removeAttribute("aria-current");
      }
    });
  }

  getSectionIndex(layerId) {
    const section = this.sectionData.find((s) => s.id === layerId);
    return section ? section.index : -1;
  }

  getSectionById(layerId) {
    const section = this.sectionData.find((s) => s.id === layerId);
    return section ? section.element : null;
  }

  setupIntersectionObserver() {
    const options = {
      root: null,
      // Trigger when top 20% of section is in viewport
      // This works for both fixed (100vh) and variable-height (auto) sections
      rootMargin: "0px 0px -80% 0px",
      threshold: 0,
    };

    this.intersectionObserver = new IntersectionObserver((entries) => {
      // Don't update during programmatic scrolling
      if (this.isScrolling) return;

      // Find the section that's most prominently in view
      let topMostSection = null;
      let topMostY = Infinity;

      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // Get distance from top of viewport to top of section
          const rect = entry.target.getBoundingClientRect();
          const distanceFromTop = Math.abs(rect.top);

          // Track the section closest to the top of viewport
          if (distanceFromTop < topMostY) {
            topMostY = distanceFromTop;
            topMostSection = entry.target;
          }
        }
      });

      // Update navigation if we found an active section
      if (topMostSection) {
        const layerId = topMostSection.id;
        const sectionIndex = this.getSectionIndex(layerId);

        if (sectionIndex !== -1 && sectionIndex !== this.currentSection) {
          this.currentSection = sectionIndex;
          this.updateActiveNav(layerId);
        }
      }
    }, options);

    // Observe all sections
    this.layers.forEach((layer) => {
      this.intersectionObserver.observe(layer);
    });
  }

  scrollToSection(targetId) {
    this.isScrolling = true;
    const targetSection = this.getSectionById(targetId);

    if (targetSection) {
      targetSection.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });

      this.currentSection = this.getSectionIndex(targetId);
      this.updateActiveNav(targetId);
    }

    setTimeout(() => {
      this.isScrolling = false;
    }, this.CONFIG.SCROLL_ANIMATION_DURATION);
  }

  handleKeyboardNavigation(e) {
    if (this.isScrolling) return;

    if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      e.preventDefault();
      if (this.currentSection > 0) {
        const targetId = this.layers[this.currentSection - 1].id;
        this.scrollToSection(targetId);
      }
    } else if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault();
      if (this.currentSection < this.layers.length - 1) {
        const targetId = this.layers[this.currentSection + 1].id;
        this.scrollToSection(targetId);
      }
    }
  }

  handleResize() {
    const activeLayer = this.layers[this.currentSection];
    if (activeLayer) {
      activeLayer.scrollIntoView({ behavior: "instant" });
    }
  }

  bindEvents() {
    // Navigation dot clicks
    this.navDots.forEach((dot) => {
      const clickHandler = (e) => {
        e.preventDefault();
        const targetLayer = dot.getAttribute("data-layer");
        this.scrollToSection(targetLayer);
      };
      dot.addEventListener("click", clickHandler);
      this.eventListeners.push({ element: dot, event: "click", handler: clickHandler });
    });

    // Keyboard navigation
    const keyHandler = (e) => this.handleKeyboardNavigation(e);
    document.addEventListener("keydown", keyHandler);
    this.eventListeners.push({ element: document, event: "keydown", handler: keyHandler });

    // Resize handling
    const resizeHandler = () => this.handleResize();
    window.addEventListener("resize", resizeHandler);
    this.eventListeners.push({ element: window, event: "resize", handler: resizeHandler });
  }

  cleanup() {
    // Disconnect Intersection Observer
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
      this.intersectionObserver = null;
    }

    // Remove event listeners
    this.eventListeners.forEach(({ element, event, handler }) => {
      element.removeEventListener(event, handler);
    });
    this.eventListeners = [];
  }
}

export { NavigationManager };
