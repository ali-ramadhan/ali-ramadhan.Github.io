window.addEventListener('load', function () {
    function buildTocStructure() {
        const content = document.querySelector('.post-body');
        if (!content) {
            console.warn('Could not find .post-body element');
            return;
        }

        // Find all headings
        const headings = Array.from(content.querySelectorAll('h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]'));

        const tocContent = document.querySelector('.floating-toc-content');
        if (!tocContent) return;

        // Clear existing content
        tocContent.innerHTML = '';

        // Create main list
        const mainList = document.createElement('ol');
        let currentSection = null;
        let sectionCount = 0;
        let subsectionCount = 0;

        headings.forEach((heading) => {
            const level = parseInt(heading.tagName.charAt(1));

            if (level === 1) {
                // Create new main section
                sectionCount++;
                subsectionCount = 0;

                const section = document.createElement('div');
                section.className = 'floating-toc-section collapsed';

                // Check if this section has any subsections by looking at all headings between
                // this h1 and the next h1 (or end of list)
                const hasSubsections = (() => {
                    const currentIndex = headings.indexOf(heading);
                    const nextH1Index = headings.findIndex((h, i) =>
                        i > currentIndex && h.tagName === 'H1'
                    );
                    const endIndex = nextH1Index === -1 ? headings.length : nextH1Index;

                    return headings.slice(currentIndex + 1, endIndex)
                        .some(h => h.tagName === 'H2');
                })();

                const sectionHeading = document.createElement('div');
                sectionHeading.className = hasSubsections ? 'section-heading' : 'section-heading no-toggle';

                const link = document.createElement('a');
                link.href = `#${heading.id}`;
                link.innerHTML = hasSubsections ?
                    `<span class="section-toggle">▼</span> ${sectionCount}. ${heading.textContent}` :
                    `${sectionCount}. ${heading.textContent}`;
                section.appendChild(link);

                const subsectionList = document.createElement('div');
                subsectionList.className = 'floating-toc-subsection';

                section.appendChild(sectionHeading);
                section.appendChild(subsectionList);
                mainList.appendChild(section);

                currentSection = subsectionList;

                // Add click handler for section heading
                sectionHeading.addEventListener('click', (e) => {
                    section.classList.toggle('collapsed');
                });
            } else if (currentSection && level === 2) {
                // Add subsection
                subsectionCount++;
                const item = document.createElement('div');
                item.className = 'floating-toc-item';

                const link = document.createElement('a');
                link.href = `#${heading.id}`;
                link.textContent = `${sectionCount}.${subsectionCount}. ${heading.textContent}`;

                item.appendChild(link);
                currentSection.appendChild(item);
            }
        });

        tocContent.appendChild(mainList);
        return headings;
    }

    const headings = buildTocStructure();
    if (!headings) return;

    const tocLinks = document.querySelectorAll('.floating-toc a');

    function highlightTocSection() {
        let currentSection = '';
        const scrollPosition = window.scrollY;

        // Find the current section
        headings.forEach(heading => {
            const sectionTop = heading.offsetTop - 100;
            if (scrollPosition >= sectionTop) {
                currentSection = heading.id;

                // If this is an h1, expand its section and collapse others
                if (heading.tagName === 'H1') {
                    document.querySelectorAll('.floating-toc-section').forEach(section => {
                        const sectionLink = section.querySelector('a');
                        if (sectionLink && sectionLink.getAttribute('href') === '#' + currentSection) {
                            section.classList.remove('collapsed');
                        } else {
                            section.classList.add('collapsed');
                        }
                    });
                }
            }
        });

        // Update active state of TOC links
        tocLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === '#' + currentSection) {
                link.classList.add('active');

                // Ensure parent section is expanded if subsection is active
                const parentSection = link.closest('.floating-toc-section');
                if (parentSection) {
                    parentSection.classList.remove('collapsed');
                }
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
