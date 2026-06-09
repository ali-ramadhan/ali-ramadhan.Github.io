/**
 * Navigation Module
 * Handles section navigation, scrolling, and active state management
 */

class NavigationManager {
  constructor() {
    this.CONFIG = {
      STARTING_SECTION: 2, // Land section index
      SCROLL_ANIMATION_DURATION: 1000, // Scroll animation timeout in ms (prevents rapid keyboard nav)
    };

    this.layers = document.querySelectorAll(".layer");
    this.isScrolling = false;
    this.currentSection = this.CONFIG.STARTING_SECTION;

    this.eventListeners = [];

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
    // Check if there's a hash in the URL
    const hash = window.location.hash.slice(1); // Remove the # prefix

    if (hash && this.getSectionById(hash)) {
      // Hash names a layer: scroll to that section
      const targetSection = this.getSectionById(hash);
      targetSection.scrollIntoView({ behavior: "instant" });
      this.currentSection = this.getSectionIndex(hash);
    } else if (hash && document.getElementById(hash)) {
      // Hash names a non-layer anchor (e.g. a publication id): leave the
      // browser's native anchor scroll alone, just sync the section index
      this.currentSection = this.getCurrentSectionFromScroll();
    } else {
      // No hash (or a dangling one): default to the land section
      const targetSection = this.getSectionById("land");
      if (targetSection) {
        targetSection.scrollIntoView({ behavior: "instant" });
        this.currentSection = this.getSectionIndex("land");
      }
    }
  }

  // Determine which section currently occupies the viewport center. Needed
  // because the user can move through the page by scrolling, which would
  // otherwise leave this.currentSection stale.
  getCurrentSectionFromScroll() {
    let closest = this.currentSection;
    let minDistance = Infinity;

    this.sectionData.forEach(({ element, index }) => {
      const rect = element.getBoundingClientRect();
      const distance = Math.abs(rect.top + rect.height / 2 - window.innerHeight / 2);
      if (distance < minDistance) {
        minDistance = distance;
        closest = index;
      }
    });

    return closest;
  }

  getSectionIndex(layerId) {
    const section = this.sectionData.find((s) => s.id === layerId);
    return section ? section.index : -1;
  }

  getSectionById(layerId) {
    const section = this.sectionData.find((s) => s.id === layerId);
    return section ? section.element : null;
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
    }

    setTimeout(() => {
      this.isScrolling = false;
    }, this.CONFIG.SCROLL_ANIMATION_DURATION);
  }

  handleKeyboardNavigation(e) {
    if (this.isScrolling) return;

    // Re-derive the current section from the scroll position: manual
    // scrolling (wheel, touch, scrollbar) isn't tracked anywhere
    this.currentSection = this.getCurrentSectionFromScroll();

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

  bindEvents() {
    // Keyboard navigation (arrow keys to move between sections)
    const keyHandler = (e) => this.handleKeyboardNavigation(e);
    document.addEventListener("keydown", keyHandler);
    this.eventListeners.push({ element: document, event: "keydown", handler: keyHandler });
  }

  cleanup() {
    // Remove event listeners
    this.eventListeners.forEach(({ element, event, handler }) => {
      element.removeEventListener(event, handler);
    });
    this.eventListeners = [];
  }
}

export { NavigationManager };
