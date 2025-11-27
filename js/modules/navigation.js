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
      this.currentSection = this.getSectionIndex(targetId);
    }
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
