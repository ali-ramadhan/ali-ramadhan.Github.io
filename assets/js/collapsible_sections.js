window.addEventListener('load', function () {
    const postBody = document.querySelector('.post-body');
    if (!postBody) {
        console.warn('Could not find .post-body element');
        return;
    }

    // Find all headers that should be collapsible
    const headers = Array.from(postBody.querySelectorAll('h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]'))
        .filter(header => !header.classList.contains('no-collapse'));

    if (headers.length === 0) return;

    headers.forEach((header) => {
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

        // Click handler
        const toggleCollapse = function(e) {
            e.preventDefault();
            isCollapsed = !isCollapsed;

            header.classList.toggle('collapsed', isCollapsed);
            contentWrapper.classList.toggle('collapsed', isCollapsed);
            header.setAttribute('aria-expanded', (!isCollapsed).toString());
        };

        // Add event listeners
        header.addEventListener('click', toggleCollapse);
        header.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleCollapse();
            }
        });
    });
});
