/**
 * Citation tooltips and interactions
 * Handles hover tooltips for citations and click-to-scroll behavior
 */
export class CitationManager {
  constructor() {
    this.tooltipHandlers = [];
    this.clickHandlers = [];
    this.tooltips = [];

    this.initializeCitations();

    window.addEventListener("pagehide", () => this.cleanup(), { once: true });
  }

  initializeCitations() {
    document.addEventListener("DOMContentLoaded", () => {
      this.setupCitationTooltips();
      this.setupCitationClicks();
    });
  }

  setupCitationTooltips() {
    const citations = document.querySelectorAll(".citation[data-tooltip]");

    citations.forEach((citation) => {
      const tooltipData = JSON.parse(citation.getAttribute("data-tooltip"));

      // Create tooltip element
      const tooltip = document.createElement("div");
      tooltip.className = "citation-tooltip";
      tooltip.innerHTML = this.formatTooltipContent(tooltipData);
      document.body.appendChild(tooltip);
      this.tooltips.push(tooltip);

      const enterHandler = (e) => {
        const rect = e.target.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

        // Position above the citation
        tooltip.style.left = rect.left + scrollLeft + "px";
        tooltip.style.top = rect.top + scrollTop - tooltip.offsetHeight - 10 + "px";
        tooltip.style.opacity = "1";
        tooltip.style.visibility = "visible";
      };

      const leaveHandler = () => {
        tooltip.style.opacity = "0";
        tooltip.style.visibility = "hidden";
      };

      citation.addEventListener("mouseenter", enterHandler);
      citation.addEventListener("mouseleave", leaveHandler);

      this.tooltipHandlers.push({ citation, enterHandler, leaveHandler });

      // Store reference to tooltip for cleanup
      citation._tooltip = tooltip;
    });
  }

  setupCitationClicks() {
    const citations = document.querySelectorAll(".citation[href]");

    citations.forEach((citation) => {
      const handler = (e) => {
        e.preventDefault();
        const targetId = citation.getAttribute("href").substring(1); // Remove #
        const targetElement = document.getElementById(targetId);

        if (targetElement) {
          targetElement.scrollIntoView({ behavior: "smooth" });
          // Flash the target briefly
          targetElement.style.backgroundColor = "#ffeb3b";
          setTimeout(() => {
            targetElement.style.backgroundColor = "";
          }, 1000);
        }
      };

      citation.addEventListener("click", handler);
      this.clickHandlers.push({ citation, handler });
    });
  }

  cleanup() {
    this.tooltipHandlers.forEach(({ citation, enterHandler, leaveHandler }) => {
      citation.removeEventListener("mouseenter", enterHandler);
      citation.removeEventListener("mouseleave", leaveHandler);
    });
    this.tooltipHandlers = [];

    this.clickHandlers.forEach(({ citation, handler }) => {
      citation.removeEventListener("click", handler);
    });
    this.clickHandlers = [];

    this.tooltips.forEach((tooltip) => tooltip.remove());
    this.tooltips = [];
  }

  formatTooltipContent(data) {
    let content = `<strong>${data.title}</strong><br>`;
    content += `${data.authors} (${data.year})`;

    if (data.journal) {
      content += `<br><em>${data.journal}</em>`;
    }

    if (data.doi) {
      content += `<br><a href="${data.doi}" target="_blank" rel="noopener">DOI</a>`;
    }

    return content;
  }
}
