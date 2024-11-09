document.addEventListener('DOMContentLoaded', function() {
    function buildTocFromHeadings() {
      const content = document.querySelector('.post-body');
      if (!content) return;

      // Find all headings, excluding those with class 'no_toc'
      const headings = Array.from(content.querySelectorAll('h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]'));

      const tocContent = document.querySelector('.floating-toc-content');
      if (!tocContent) return;

      const ol = document.createElement('ol');

      headings.forEach(heading => {
        const level = parseInt(heading.tagName.charAt(1));
        const li = document.createElement('li');
        li.className = `floating-toc-item floating-toc-h${level}`;

        const a = document.createElement('a');
        a.href = `#${heading.id}`;
        a.textContent = heading.textContent;

        li.appendChild(a);
        ol.appendChild(li);
      });

      tocContent.appendChild(ol);
      return headings;
    }

    const headings = buildTocFromHeadings();
    if (!headings) return;

    const tocLinks = document.querySelectorAll('.floating-toc a');

    function highlightTocSection() {
      let currentSection = '';
      const scrollPosition = window.scrollY;

      // Find the current section by checking which heading is at the top of the viewport
      headings.forEach(heading => {
        const sectionTop = heading.offsetTop - 100;
        if (scrollPosition >= sectionTop) {
          currentSection = heading.id;
        }
      });

      // Update active state of TOC links
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
