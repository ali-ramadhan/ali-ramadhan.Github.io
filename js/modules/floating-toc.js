/**
 * Floating Table of Contents Manager
 * Creates a floating table of contents for blog posts when enabled in front matter
 */

export class FloatingTocManager {
  constructor() {
    this.isVisible = true;
    this.tocContainer = null;
    this.headings = [];
    this.tocLinks = [];
    this.isScrolling = false;
    this.scrollHandler = null;
    this.linkClickHandlers = [];

    this.init();

    window.addEventListener("pagehide", () => this.cleanup(), { once: true });
  }

  init() {
    if (!this.shouldEnableFloatingToc()) {
      return;
    }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => this.setupFloatingToc());
    } else {
      this.setupFloatingToc();
    }
  }

  shouldEnableFloatingToc() {
    const meta = document.querySelector('meta[name="floating-toc"]');
    return meta && meta.getAttribute("content") === "true";
  }

  setupFloatingToc() {
    const postContent = document.querySelector(".blog-post-content");
    if (!postContent) {
      console.warn("Could not find .blog-post-content element");
      return;
    }

    // Find all headings, generate IDs if they don't exist. Only h2/h3 are
    // tracked: the ToC renders nothing deeper, and tracking unrendered levels
    // would clear the active highlight whenever one scrolls under an h4+.
    this.headings = Array.from(postContent.querySelectorAll("h2, h3"));

    this.headings.forEach((heading, index) => {
      if (!heading.id) {
        // Generate ID from heading text
        const text = heading.textContent.trim();
        const id = text
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-")
          .replace(/^-+|-+$/g, "");
        heading.id = id || `heading-${index}`;
      }
    });

    if (this.headings.length === 0) {
      console.warn("No headings found for ToC");
      return;
    }

    this.createTocContainer();
    this.buildTocStructure();
    this.setupScrollListener();
    this.setupTocNavigation();
    this.highlightCurrentSection();
  }

  createTocContainer() {
    this.tocContainer = document.createElement("div");
    this.tocContainer.className = "floating-toc";
    this.tocContainer.innerHTML = `
      <div class="floating-toc-header">
        <span>Table of Contents</span>
        <button class="floating-toc-close" aria-label="Close table of contents">×</button>
      </div>
      <div class="floating-toc-content"></div>
    `;

    document.body.appendChild(this.tocContainer);

    const closeButton = this.tocContainer.querySelector(".floating-toc-close");
    closeButton.addEventListener("click", () => this.hideToc());
  }

  buildTocStructure() {
    const tocContent = this.tocContainer.querySelector(".floating-toc-content");
    tocContent.innerHTML = "";

    const mainList = document.createElement("ol");
    let currentSection = null;
    let sectionCount = 0;
    let subsectionCount = 0;

    this.headings.forEach((heading) => {
      const level = parseInt(heading.tagName.charAt(1));

      if (level === 2) {
        sectionCount++;
        subsectionCount = 0;

        const hasSubsections = this.hasSubsections(heading);

        const section = document.createElement("div");
        section.className = hasSubsections
          ? "floating-toc-section collapsed"
          : "floating-toc-section no-subsections";

        const sectionHeading = document.createElement("div");
        sectionHeading.className = hasSubsections ? "section-heading" : "section-heading no-toggle";

        // The collapse toggle is a sibling of the link, not a child: clicking
        // the toggle should only collapse/expand, and clicking the link should
        // only navigate
        if (hasSubsections) {
          const toggle = document.createElement("span");
          toggle.className = "section-toggle";
          toggle.textContent = "▼";
          toggle.setAttribute("role", "button");
          toggle.setAttribute("aria-label", "Toggle section");
          toggle.addEventListener("click", (e) => {
            e.stopPropagation();
            section.classList.toggle("collapsed");
          });
          sectionHeading.appendChild(toggle);
        }

        const link = document.createElement("a");
        link.href = `#${heading.id}`;
        link.textContent = `${sectionCount}. ${heading.textContent}`;

        sectionHeading.appendChild(link);

        const subsectionList = document.createElement("div");
        subsectionList.className = "floating-toc-subsection";

        section.appendChild(sectionHeading);
        section.appendChild(subsectionList);
        mainList.appendChild(section);

        currentSection = subsectionList;
      } else if (currentSection && level === 3) {
        subsectionCount++;
        const item = document.createElement("div");
        item.className = "floating-toc-item";

        const link = document.createElement("a");
        link.href = `#${heading.id}`;
        link.textContent = `${sectionCount}.${subsectionCount}. ${heading.textContent}`;

        item.appendChild(link);
        currentSection.appendChild(item);
      }
    });

    tocContent.appendChild(mainList);
    this.tocLinks = Array.from(this.tocContainer.querySelectorAll("a"));
  }

  hasSubsections(h2Heading) {
    const currentIndex = this.headings.indexOf(h2Heading);
    const nextH2Index = this.headings.findIndex((h, i) => i > currentIndex && h.tagName === "H2");
    const endIndex = nextH2Index === -1 ? this.headings.length : nextH2Index;

    return this.headings.slice(currentIndex + 1, endIndex).some((h) => h.tagName === "H3");
  }

  setupScrollListener() {
    let ticking = false;

    this.scrollHandler = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          this.highlightCurrentSection();
          ticking = false;
        });
        ticking = true;
      }
    };

    document.addEventListener("scroll", this.scrollHandler);
  }

  setupTocNavigation() {
    this.tocLinks.forEach((link) => {
      const handler = (e) => {
        e.preventDefault();
        const targetId = link.getAttribute("href").slice(1);
        const targetElement = document.getElementById(targetId);

        if (targetElement) {
          // If the target heading is hidden inside collapsed sections
          // (collapsible-headers feature), expand them before measuring
          // offsetTop, otherwise we scroll to a clipped, invisible spot
          for (let i = 0; i < 10; i++) {
            const collapsedWrapper = targetElement.closest(".collapsible-content.collapsed");
            if (!collapsedWrapper) break;

            const controllingHeader = collapsedWrapper.previousElementSibling;
            if (controllingHeader && controllingHeader.classList.contains("collapsible-header")) {
              // Go through the header's own click handler to keep the
              // collapsible-headers module's internal state in sync
              controllingHeader.click();
            } else {
              collapsedWrapper.classList.remove("collapsed");
            }
          }

          this.isScrolling = true;

          window.scrollTo({
            top: targetElement.offsetTop - 80,
            behavior: "smooth",
          });

          setTimeout(() => {
            this.isScrolling = false;
            this.highlightCurrentSection();
          }, 1000);
        }
      };

      this.linkClickHandlers.push({ link, handler });
      link.addEventListener("click", handler);
    });
  }

  cleanup() {
    if (this.scrollHandler) {
      document.removeEventListener("scroll", this.scrollHandler);
      this.scrollHandler = null;
    }
    this.linkClickHandlers.forEach(({ link, handler }) => {
      link.removeEventListener("click", handler);
    });
    this.linkClickHandlers = [];
  }

  highlightCurrentSection() {
    if (this.isScrolling) return;

    let currentSection = "";
    const scrollPosition = window.scrollY;

    this.headings.forEach((heading) => {
      // Headings inside collapsed sections are clipped to the wrapper's
      // position; their offsetTop would produce bogus highlights
      if (heading.closest(".collapsible-content.collapsed")) return;

      const sectionTop = heading.offsetTop - 100;
      if (scrollPosition >= sectionTop) {
        currentSection = heading.id;

        if (heading.tagName === "H2") {
          document.querySelectorAll(".floating-toc-section").forEach((section) => {
            const sectionLink = section.querySelector("a");
            if (sectionLink && sectionLink.getAttribute("href") === "#" + currentSection) {
              section.classList.remove("collapsed");
            } else {
              section.classList.add("collapsed");
            }
          });
        }
      }
    });

    this.tocLinks.forEach((link) => {
      link.classList.remove("active");
      if (link.getAttribute("href") === "#" + currentSection) {
        link.classList.add("active");

        const parentSection = link.closest(".floating-toc-section");
        if (parentSection) {
          parentSection.classList.remove("collapsed");
        }
      }
    });
  }

  hideToc() {
    if (this.tocContainer) {
      this.tocContainer.style.display = "none";
      this.isVisible = false;
      this.createRestoreButton();
    }
  }

  showToc() {
    if (this.tocContainer) {
      this.tocContainer.style.display = "block";
      this.isVisible = true;
      this.removeRestoreButton();
    }
  }

  createRestoreButton() {
    // Don't create multiple restore buttons
    if (document.querySelector(".floating-toc-restore")) return;

    const restoreButton = document.createElement("button");
    restoreButton.className = "floating-toc-restore";
    restoreButton.title = "Show Table of Contents";
    restoreButton.setAttribute("aria-label", "Show table of contents");

    const icon = document.createElement("span");
    icon.className = "restore-icon";
    icon.textContent = "📋";
    restoreButton.appendChild(icon);

    restoreButton.addEventListener("click", () => {
      this.showToc();
    });

    document.body.appendChild(restoreButton);
  }

  removeRestoreButton() {
    const restoreButton = document.querySelector(".floating-toc-restore");
    if (restoreButton) {
      restoreButton.remove();
    }
  }
}
