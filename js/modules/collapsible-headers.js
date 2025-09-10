/**
 * Collapsible Headers Manager
 * Makes blog post headers collapsible when enabled in front matter
 */

export class CollapsibleHeadersManager {
  constructor() {
    this.init();
  }

  init() {
    // Only initialize if the page indicates collapsible headers are enabled
    if (!this.shouldEnableCollapsible()) {
      return;
    }

    // Wait for DOM to be fully loaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupCollapsibleHeaders());
    } else {
      this.setupCollapsibleHeaders();
    }
  }

  shouldEnableCollapsible() {
    // Check if the body has a data attribute or meta tag indicating collapsible headers
    const meta = document.querySelector('meta[name="collapsible-headers"]');
    return meta && meta.getAttribute('content') === 'true';
  }

  setupCollapsibleHeaders() {
    const postContent = document.querySelector('.blog-post-content');
    if (!postContent) {
      console.warn('Could not find .blog-post-content element');
      return;
    }

    // Find all headers that should be collapsible (h2, h3, h4 with IDs)
    const headers = Array.from(postContent.querySelectorAll('h2[id], h3[id], h4[id], h5[id], h6[id]'))
      .filter(header => !header.classList.contains('no-collapse'));

    if (headers.length === 0) return;

    headers.forEach((header) => {
      this.makeHeaderCollapsible(header);
    });
  }

  makeHeaderCollapsible(header) {
    const headerLevel = parseInt(header.tagName.charAt(1));

    // Find content to collapse (everything between this header and the next header of same or higher level)
    const contentElements = [];
    let currentElement = header.nextElementSibling;

    while (currentElement) {
      // Stop if we hit another header of the same or higher level
      if (currentElement.tagName && currentElement.tagName.match(/^H[1-6]$/)) {
        const currentLevel = parseInt(currentElement.tagName.charAt(1));
        if (currentLevel <= headerLevel) {
          break;
        }
      }
      
      // Skip footnotes - don't include them in collapsible content
      if (currentElement.classList && currentElement.classList.contains('footnotes')) {
        break;
      }
      
      // Also skip footnotes separator
      if (currentElement.classList && currentElement.classList.contains('footnotes-sep')) {
        break;
      }
      
      contentElements.push(currentElement);
      currentElement = currentElement.nextElementSibling;
    }

    // Skip if no content to collapse
    if (contentElements.length === 0) return;

    // Make header collapsible - just add classes, no DOM restructuring
    header.classList.add('collapsible-header');
    header.setAttribute('tabindex', '0');
    header.setAttribute('role', 'button');
    header.setAttribute('aria-expanded', 'true');

    // Create wrapper for collapsible content
    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'collapsible-content';

    // Insert wrapper before first content element
    contentElements[0].parentNode.insertBefore(contentWrapper, contentElements[0]);

    // Move content elements into wrapper
    contentElements.forEach(element => {
      contentWrapper.appendChild(element);
    });

    // Set initial state (expanded)
    let isCollapsed = false;

    // Toggle function
    const toggleCollapse = (e) => {
      if (e) e.preventDefault();
      isCollapsed = !isCollapsed;

      header.classList.toggle('collapsed', isCollapsed);
      contentWrapper.classList.toggle('collapsed', isCollapsed);
      header.setAttribute('aria-expanded', (!isCollapsed).toString());
    };

    // Add event listeners
    header.addEventListener('click', toggleCollapse);
    header.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleCollapse();
      }
    });
  }
}