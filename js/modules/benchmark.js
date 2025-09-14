/**
 * Benchmark Display Module
 * Handles interactive benchmark tooltips and modals
 */

function parseAnsiToHtml(text) {
  // ANSI color codes to HTML class mapping
  const ansiMap = {
    '0': 'reset',
    '1': 'bold',
    '22': 'normal',
    '30': 'black',
    '31': 'red',
    '32': 'green',
    '33': 'yellow',
    '34': 'blue',
    '35': 'magenta',
    '36': 'cyan',
    '37': 'white',
    '39': 'default',
    '90': 'gray'
  };

  // Stack to keep track of open spans
  let openSpans = [];

  // Replace ANSI escape codes with HTML spans
  return text
    .replace(/\[(\d+)m/g, (match, code) => {
      const colorClass = ansiMap[code];

      if (code === '0' || code === '39') {
        // Reset - close all open spans
        const closing = openSpans.map(() => '</span>').join('');
        openSpans = [];
        return closing;
      } else if (code === '22') {
        // Normal weight - just close bold if it's open
        const boldIndex = openSpans.findIndex(span => span.includes('ansi-bold'));
        if (boldIndex !== -1) {
          openSpans.splice(boldIndex, 1);
          return '</span>';
        }
        return '';
      } else if (colorClass) {
        const className = `ansi-${colorClass}`;
        openSpans.push(className);
        return `<span class="${className}">`;
      }

      return match; // Unknown code, leave as is
    })
    // Close any remaining open spans at the end
    + openSpans.map(() => '</span>').join('');
}

export class BenchmarkManager {
  constructor() {
    this.tooltip = null;
    this.activeReference = null;
    this.init();
  }

  init() {
    this.createTooltip();
    this.attachEventListeners();
  }

  createTooltip() {
    // Create tooltip element
    this.tooltip = document.createElement('div');
    this.tooltip.className = 'benchmark-tooltip';
    this.tooltip.innerHTML = `
      <div class="benchmark-tooltip-content">
        <div class="benchmark-metadata"></div>
        <pre class="benchmark-output"></pre>
        <button class="benchmark-close" aria-label="Close benchmark details">&times;</button>
      </div>
    `;
    document.body.appendChild(this.tooltip);

    // Add click handler for close button
    this.tooltip.querySelector('.benchmark-close').addEventListener('click', () => {
      this.hideTooltip();
    });

    // Hide tooltip when clicking outside
    document.addEventListener('click', (e) => {
      if (!this.tooltip.contains(e.target) && !e.target.classList.contains('benchmark-reference')) {
        this.hideTooltip();
      }
    });

    // Hide tooltip on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.hideTooltip();
      }
    });
  }

  attachEventListeners() {
    // Use event delegation for benchmark references
    document.addEventListener('mouseenter', this.handleMouseEnter.bind(this), true);
    document.addEventListener('mouseleave', this.handleMouseLeave.bind(this), true);
    document.addEventListener('click', this.handleClick.bind(this), true);
  }

  handleMouseEnter(e) {
    if (e.target.classList.contains('benchmark-reference')) {
      // Add slight delay before showing tooltip
      this.hoverTimeout = setTimeout(() => {
        this.showTooltip(e.target, e);
      }, 300);
    }
  }

  handleMouseLeave(e) {
    if (e.target.classList.contains('benchmark-reference')) {
      // Clear any pending hover timeout
      if (this.hoverTimeout) {
        clearTimeout(this.hoverTimeout);
        this.hoverTimeout = null;
      }

      // Small delay to allow moving to tooltip
      setTimeout(() => {
        if (!this.tooltip.matches(':hover') && !e.target.matches(':hover')) {
          this.hideTooltip();
        }
      }, 100);
    }
  }

  handleClick(e) {
    if (e.target.classList.contains('benchmark-reference')) {
      e.preventDefault();
      this.showTooltip(e.target, e, true);
    }
  }

  showTooltip(element, event, forceShow = false) {
    try {
      const benchmarkData = JSON.parse(element.dataset.benchmark);

      // Update tooltip content with colored ANSI output
      const output = this.tooltip.querySelector('.benchmark-output');
      output.innerHTML = parseAnsiToHtml(benchmarkData.full_output);

      // Update system info (Julia version | OS | CPU)
      const metadataElement = this.tooltip.querySelector('.benchmark-metadata');
      metadataElement.textContent = `${benchmarkData.julia_version} | ${benchmarkData.os} | ${benchmarkData.cpu}`;

      // Show tooltip
      this.tooltip.classList.add('visible');
      this.activeReference = element;

      // Position tooltip
      this.positionTooltip(event || element);

    } catch (error) {
      console.error('Error displaying benchmark:', error);
    }
  }

  hideTooltip() {
    if (this.tooltip) {
      this.tooltip.classList.remove('visible');
      this.activeReference = null;
    }
  }

  positionTooltip(eventOrElement) {
    if (!this.tooltip) return;

    let x, y;

    if (eventOrElement.clientX !== undefined) {
      // Mouse event
      x = eventOrElement.clientX;
      y = eventOrElement.clientY;
    } else {
      // Element
      const rect = eventOrElement.getBoundingClientRect();
      x = rect.left + rect.width / 2;
      y = rect.bottom;
    }

    // Get viewport dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const tooltipRect = this.tooltip.getBoundingClientRect();

    // Adjust horizontal position
    if (x + tooltipRect.width / 2 > viewportWidth - 20) {
      x = viewportWidth - tooltipRect.width - 20;
    } else if (x - tooltipRect.width / 2 < 20) {
      x = 20;
    } else {
      x = x - tooltipRect.width / 2;
    }

    // Adjust vertical position
    if (y + tooltipRect.height > viewportHeight - 20) {
      // Show above instead of below
      if (eventOrElement.getBoundingClientRect) {
        y = eventOrElement.getBoundingClientRect().top - tooltipRect.height - 10;
      } else {
        y = y - tooltipRect.height - 20;
      }
    } else {
      y = y + 10;
    }

    // Apply position
    this.tooltip.style.left = `${x}px`;
    this.tooltip.style.top = `${y}px`;
  }

  cleanup() {
    if (this.tooltip && this.tooltip.parentNode) {
      this.tooltip.parentNode.removeChild(this.tooltip);
    }
  }
}
