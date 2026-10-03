/**
 * Floating Table of Contents Manager
 * Creates a floating table of contents for blog posts when enabled in front matter
 */

import { expandCollapsedSections } from "./collapsible-headers.js";

// Windows at least this wide have room for the ToC beside the post. Below
// 1920px the post column is up to 1200px wide and the ToC takes up the 300px at
// the window's right edge, so they meet at about 1730px, and 1800px leaves a
// gap of about 30px even with a scrollbar. On narrower windows the ToC would
// cover the text, so it starts closed and opens over the post from the 📋
// button.
const BESIDE_POST_QUERY = "(width >= 1800px)";

export class FloatingTocManager {
  constructor() {
    this.tocContainer = null;
    this.restoreButton = null;
    this.headings = [];
    this.tocLinks = [];
    this.isScrolling = false;
    this.besidePost = window.matchMedia(BESIDE_POST_QUERY);
    this.scrollHandler = null;
    this.linkClickHandlers = [];
    this.keydownHandler = null;
    this.outsideClickHandler = null;
    this.widthChangeHandler = null;

    this.init();

    window.addEventListener("pagehide", (event) => {
      if (!event.persisted) this.cleanup();
    });
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
    this.createRestoreButton();
    this.buildTocStructure();
    this.setupScrollListener();
    this.setupTocNavigation();
    this.setupOverlayDismissal();

    // Open the ToC where it fits beside the post and close it where it
    // doesn't, both now and whenever the window crosses that width
    this.widthChangeHandler = () => this.setOpen(this.besidePost.matches);
    this.besidePost.addEventListener("change", this.widthChangeHandler);
    this.setOpen(this.besidePost.matches);

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
    closeButton.addEventListener("click", () => this.setOpen(false));
  }

  // The 📋 button that takes the ToC's place while it's closed
  createRestoreButton() {
    this.restoreButton = document.createElement("button");
    this.restoreButton.className = "floating-toc-restore";
    this.restoreButton.title = "Show Table of Contents";
    this.restoreButton.setAttribute("aria-label", "Show table of contents");

    const icon = document.createElement("span");
    icon.className = "restore-icon";
    icon.textContent = "📋";
    this.restoreButton.appendChild(icon);

    this.restoreButton.addEventListener("click", () => this.setOpen(true));

    document.body.appendChild(this.restoreButton);
  }

  setOpen(open) {
    this.tocContainer.hidden = !open;
    this.restoreButton.hidden = open;
  }

  // Whether the ToC is open on top of the post
  isOverPost() {
    return !this.tocContainer.hidden && !this.besidePost.matches;
  }

  // While the ToC covers the post, Escape or a click anywhere else closes it
  setupOverlayDismissal() {
    this.keydownHandler = (e) => {
      if (e.key === "Escape" && this.isOverPost()) this.setOpen(false);
    };

    // The click on the 📋 button that opened the ToC also reaches the document
    this.outsideClickHandler = (e) => {
      if (
        this.isOverPost() &&
        !this.tocContainer.contains(e.target) &&
        !this.restoreButton.contains(e.target)
      ) {
        this.setOpen(false);
      }
    };

    document.addEventListener("keydown", this.keydownHandler);
    document.addEventListener("click", this.outsideClickHandler);
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
          const toggle = document.createElement("button");
          toggle.type = "button";
          toggle.className = "section-toggle";
          toggle.textContent = "▼";
          toggle.setAttribute("aria-label", `Toggle ${heading.textContent.trim()} subsections`);
          toggle.setAttribute("aria-expanded", "false");
          toggle.setAttribute("aria-controls", `toc-subsections-${sectionCount}`);
          toggle.addEventListener("click", (e) => {
            e.stopPropagation();
            this.setSectionCollapsed(section, !section.classList.contains("collapsed"));
          });
          sectionHeading.appendChild(toggle);
        }

        const link = document.createElement("a");
        link.href = `#${heading.id}`;
        link.textContent = `${sectionCount}. ${heading.textContent}`;

        sectionHeading.appendChild(link);

        const subsectionList = document.createElement("div");
        subsectionList.id = `toc-subsections-${sectionCount}`;
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

  setSectionCollapsed(section, collapsed) {
    section.classList.toggle("collapsed", collapsed);
    const toggle = section.querySelector(".section-toggle");
    if (toggle) toggle.setAttribute("aria-expanded", String(!collapsed));
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
          expandCollapsedSections(targetElement);

          // Don't cover the section the reader picked
          if (this.isOverPost()) this.setOpen(false);

          this.isScrolling = true;

          window.scrollTo({
            top: targetElement.getBoundingClientRect().top + window.scrollY - 80,
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
    if (this.keydownHandler) {
      document.removeEventListener("keydown", this.keydownHandler);
      document.removeEventListener("click", this.outsideClickHandler);
      this.keydownHandler = null;
      this.outsideClickHandler = null;
    }
    if (this.widthChangeHandler) {
      this.besidePost.removeEventListener("change", this.widthChangeHandler);
      this.widthChangeHandler = null;
    }
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
              this.setSectionCollapsed(section, false);
            } else {
              this.setSectionCollapsed(section, true);
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
          this.setSectionCollapsed(parentSection, false);
        }
      }
    });
  }
}
