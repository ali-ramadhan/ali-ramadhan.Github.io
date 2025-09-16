/**
 * Citation Tooltip Handler
 * Shows citation details on hover
 */

document.addEventListener('DOMContentLoaded', function() {
  const citations = document.querySelectorAll('.citation[data-tooltip]');
  
  citations.forEach(citation => {
    let tooltip = null;
    let showTimeout = null;
    let hideTimeout = null;
    
    citation.addEventListener('mouseenter', function(e) {
      // Clear any pending hide timeout
      if (hideTimeout) {
        clearTimeout(hideTimeout);
        hideTimeout = null;
      }
      
      // Show tooltip with delay
      showTimeout = setTimeout(() => {
        showTooltip(citation, e);
      }, 300);
    });
    
    citation.addEventListener('mouseleave', function() {
      // Clear any pending show timeout
      if (showTimeout) {
        clearTimeout(showTimeout);
        showTimeout = null;
      }
      
      // Hide tooltip with delay
      hideTimeout = setTimeout(() => {
        hideTooltip();
      }, 150);
    });
    
    function showTooltip(element, event) {
      try {
        const data = JSON.parse(element.getAttribute('data-tooltip'));
        
        // Create tooltip if it doesn't exist
        if (!tooltip) {
          tooltip = document.createElement('div');
          tooltip.className = 'citation-tooltip';
          document.body.appendChild(tooltip);
        }
        
        // Format tooltip content
        let content = `<strong>${data.title}</strong><br>`;
        content += `${data.authors} (${data.year})`;
        if (data.journal) {
          content += `<br><em>${data.journal}</em>`;
        }
        if (data.doi) {
          content += `<br><small>${data.doi}</small>`;
        }
        
        tooltip.innerHTML = content;
        tooltip.style.opacity = '0';
        tooltip.style.visibility = 'visible';
        
        // Position tooltip
        positionTooltip(element, tooltip);
        
        // Fade in
        requestAnimationFrame(() => {
          tooltip.style.opacity = '1';
        });
        
      } catch (error) {
        console.warn('Error showing citation tooltip:', error);
      }
    }
    
    function hideTooltip() {
      if (tooltip) {
        tooltip.style.opacity = '0';
        setTimeout(() => {
          if (tooltip) {
            tooltip.style.visibility = 'hidden';
          }
        }, 300);
      }
    }
    
    function positionTooltip(element, tooltip) {
      const rect = element.getBoundingClientRect();
      const tooltipRect = tooltip.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
      
      let top = rect.top + scrollTop - tooltipRect.height - 10;
      let left = rect.left + scrollLeft + (rect.width / 2) - (tooltipRect.width / 2);
      
      // Ensure tooltip doesn't go off screen
      if (left < 10) {
        left = 10;
      } else if (left + tooltipRect.width > window.innerWidth - 10) {
        left = window.innerWidth - tooltipRect.width - 10;
      }
      
      // If tooltip would be above viewport, show below instead
      if (top < scrollTop + 10) {
        top = rect.bottom + scrollTop + 10;
        // Flip arrow
        tooltip.classList.add('tooltip-below');
      } else {
        tooltip.classList.remove('tooltip-below');
      }
      
      tooltip.style.position = 'absolute';
      tooltip.style.top = `${top}px`;
      tooltip.style.left = `${left}px`;
    }
  });
  
  // Close tooltip when clicking elsewhere
  document.addEventListener('click', function(e) {
    if (!e.target.closest('.citation')) {
      const tooltips = document.querySelectorAll('.citation-tooltip');
      tooltips.forEach(tooltip => {
        tooltip.style.opacity = '0';
        setTimeout(() => {
          tooltip.style.visibility = 'hidden';
        }, 300);
      });
    }
  });
});

// CSS for flipped arrow when tooltip is below
const style = document.createElement('style');
style.textContent = `
  .citation-tooltip.tooltip-below::before {
    top: auto;
    bottom: -6px;
    border-top: 6px solid #333;
    border-bottom: none;
  }
  
  @media (prefers-color-scheme: dark) {
    .citation-tooltip.tooltip-below::before {
      border-top-color: #1f2937;
    }
  }
`;
document.head.appendChild(style);