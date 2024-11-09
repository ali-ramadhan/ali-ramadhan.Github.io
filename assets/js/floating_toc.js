document.addEventListener('DOMContentLoaded', function() {
    // Clone the existing TOC into the floating TOC
    const originalToc = document.getElementById('markdown-toc');
    const floatingTocContent = document.querySelector('.floating-toc-content');
    if (originalToc && floatingTocContent) {
      const tocClone = originalToc.cloneNode(true);
      floatingTocContent.appendChild(tocClone);
    }

    // Highlight current section while scrolling
    const headings = document.querySelectorAll('h1[id], h2[id], h3[id]');
    const tocLinks = document.querySelectorAll('.floating-toc a');

    function highlightTocSection() {
      let currentSection = '';
      const scrollPosition = window.scrollY;

      headings.forEach(heading => {
        const sectionTop = heading.offsetTop - 100;
        if (scrollPosition >= sectionTop) {
          currentSection = heading.id;
        }
      });

      tocLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === '#' + currentSection) {
          link.classList.add('active');
        }
      });
    }

    // Smooth scroll to section when clicking TOC links
    tocLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href').slice(1);
        const targetElement = document.getElementById(targetId);
        if (targetElement) {
          window.scrollTo({
            top: targetElement.offsetTop - 80,
            behavior: 'smooth'
          });
        }
      });
    });

    // Add scroll event listener with throttling
    let ticking = false;
    document.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          highlightTocSection();
          ticking = false;
        });
        ticking = true;
      }
    });

    // Initial highlight
    highlightTocSection();
  });
