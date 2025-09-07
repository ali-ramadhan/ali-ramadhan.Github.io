/**
 * Navigation Module
 * Handles section navigation, scrolling, and active state management
 */

class NavigationManager {
  constructor() {
    this.CONFIG = {
      STARTING_SECTION: 2, // Land section index
      TOUCH_THRESHOLD: 50, // Minimum swipe distance in pixels
      SCROLL_DEBOUNCE_DELAY: 100, // Scroll event debounce in ms
      SCROLL_ANIMATION_DURATION: 1000, // Scroll animation timeout in ms
    };

    this.layers = document.querySelectorAll(".layer");
    this.navDots = document.querySelectorAll(".nav-dot");
    this.isScrolling = false;
    this.currentSection = this.CONFIG.STARTING_SECTION;
    
    this.eventListeners = [];
    this.touchStartY = 0;
    this.touchEndY = 0;
    this.scrollTimeout = null;
    
    this.init();
  }

  init() {
    this.cacheSectionData();
    this.scrollToInitialSection();
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
    const landSection = this.getSectionById("land");
    if (landSection) {
      landSection.scrollIntoView({ behavior: "instant" });
      this.updateActiveNav("land");
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

  handleScroll() {
    if (this.isScrolling) return;

    const scrollTop = window.pageYOffset;
    const windowHeight = window.innerHeight;
    const currentScrollSection = Math.round(scrollTop / windowHeight);

    if (
      currentScrollSection !== this.currentSection &&
      currentScrollSection >= 0 &&
      currentScrollSection < this.layers.length
    ) {
      this.currentSection = currentScrollSection;
      const activeLayer = this.layers[this.currentSection];
      this.updateActiveNav(activeLayer.id);
    }
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

  debouncedScrollHandler() {
    clearTimeout(this.scrollTimeout);
    this.scrollTimeout = setTimeout(() => {
      if (!this.isScrolling) {
        this.handleScroll();
      }
    }, this.CONFIG.SCROLL_DEBOUNCE_DELAY);
  }

  handleTouchStart(e) {
    this.touchStartY = e.changedTouches[0].screenY;
  }

  handleTouchEnd(e) {
    this.touchEndY = e.changedTouches[0].screenY;
    const touchDiff = this.touchStartY - this.touchEndY;

    if (Math.abs(touchDiff) > this.CONFIG.TOUCH_THRESHOLD && !this.isScrolling) {
      if (touchDiff > 0 && this.currentSection < this.layers.length - 1) {
        // Swipe up - go down
        const targetId = this.layers[this.currentSection + 1].id;
        this.scrollToSection(targetId);
      } else if (touchDiff < 0 && this.currentSection > 0) {
        // Swipe down - go up
        const targetId = this.layers[this.currentSection - 1].id;
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

    // Scroll handling
    const scrollHandler = () => this.debouncedScrollHandler();
    document.addEventListener("wheel", scrollHandler);
    window.addEventListener("scroll", scrollHandler);
    this.eventListeners.push({ element: document, event: "wheel", handler: scrollHandler });
    this.eventListeners.push({ element: window, event: "scroll", handler: scrollHandler });

    // Touch events
    const touchStartHandler = (e) => this.handleTouchStart(e);
    const touchEndHandler = (e) => this.handleTouchEnd(e);
    document.addEventListener("touchstart", touchStartHandler);
    document.addEventListener("touchend", touchEndHandler);
    this.eventListeners.push({ element: document, event: "touchstart", handler: touchStartHandler });
    this.eventListeners.push({ element: document, event: "touchend", handler: touchEndHandler });

    // Resize handling
    const resizeHandler = () => this.handleResize();
    window.addEventListener("resize", resizeHandler);
    this.eventListeners.push({ element: window, event: "resize", handler: resizeHandler });
  }

  cleanup() {
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }
    
    this.eventListeners.forEach(({ element, event, handler }) => {
      element.removeEventListener(event, handler);
    });
    this.eventListeners = [];
  }
}

export { NavigationManager };