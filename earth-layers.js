document.addEventListener('DOMContentLoaded', function() {
    const layers = document.querySelectorAll('.layer');
    const navDots = document.querySelectorAll('.nav-dot');
    const themeToggle = document.getElementById('theme-toggle');
    const toggleIcon = document.querySelector('.toggle-icon');
    
    let isScrolling = false;
    let currentSection = 2; // Start at land (index 2)
    
    // Theme management
    function initTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        setTheme(savedTheme);
    }
    
    function setTheme(theme) {
        document.body.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        
        if (theme === 'dark') {
            toggleIcon.innerHTML = '🌙';
        } else {
            toggleIcon.innerHTML = '☀️';
        }
    }
    
    function toggleTheme() {
        const currentTheme = document.body.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
    }
    
    // Theme toggle event listener
    themeToggle.addEventListener('click', toggleTheme);
    
    // Initialize - scroll to land section on load
    function init() {
        const landSection = document.getElementById('land');
        landSection.scrollIntoView({ behavior: 'instant' });
        updateActiveNav('land');
    }
    
    // Update active navigation dot
    function updateActiveNav(layerId) {
        navDots.forEach(dot => {
            dot.classList.remove('active');
            if (dot.getAttribute('data-layer') === layerId) {
                dot.classList.add('active');
            }
        });
    }
    
    // Get section index by ID
    function getSectionIndex(layerId) {
        const sectionIds = ['outer-space', 'atmosphere', 'land', 'ocean', 'crust-mantle'];
        return sectionIds.indexOf(layerId);
    }
    
    // Handle scroll events
    function handleScroll() {
        if (isScrolling) return;
        
        const scrollTop = window.pageYOffset;
        const windowHeight = window.innerHeight;
        const currentScrollSection = Math.round(scrollTop / windowHeight);
        
        if (currentScrollSection !== currentSection && currentScrollSection >= 0 && currentScrollSection < layers.length) {
            currentSection = currentScrollSection;
            const activeLayer = layers[currentSection];
            updateActiveNav(activeLayer.id);
        }
    }
    
    // Smooth scroll to section
    function scrollToSection(targetId) {
        isScrolling = true;
        const targetSection = document.getElementById(targetId);
        
        targetSection.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
        
        currentSection = getSectionIndex(targetId);
        updateActiveNav(targetId);
        
        // Reset scrolling flag after animation
        setTimeout(() => {
            isScrolling = false;
        }, 1000);
    }
    
    // Handle navigation dot clicks
    navDots.forEach(dot => {
        dot.addEventListener('click', function(e) {
            e.preventDefault();
            const targetLayer = this.getAttribute('data-layer');
            scrollToSection(targetLayer);
        });
    });
    
    // Handle keyboard navigation
    document.addEventListener('keydown', function(e) {
        if (isScrolling) return;
        
        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
            e.preventDefault();
            if (currentSection > 0) {
                const targetId = layers[currentSection - 1].id;
                scrollToSection(targetId);
            }
        } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
            e.preventDefault();
            if (currentSection < layers.length - 1) {
                const targetId = layers[currentSection + 1].id;
                scrollToSection(targetId);
            }
        }
    });
    
    // Handle mouse wheel with debouncing
    let wheelTimeout;
    document.addEventListener('wheel', function(e) {
        clearTimeout(wheelTimeout);
        wheelTimeout = setTimeout(() => {
            handleScroll();
        }, 50);
    });
    
    // Handle touch events for mobile
    let touchStartY = 0;
    let touchEndY = 0;
    
    document.addEventListener('touchstart', function(e) {
        touchStartY = e.changedTouches[0].screenY;
    });
    
    document.addEventListener('touchend', function(e) {
        touchEndY = e.changedTouches[0].screenY;
        const touchDiff = touchStartY - touchEndY;
        
        if (Math.abs(touchDiff) > 50 && !isScrolling) {
            if (touchDiff > 0 && currentSection < layers.length - 1) {
                // Swipe up - go down
                const targetId = layers[currentSection + 1].id;
                scrollToSection(targetId);
            } else if (touchDiff < 0 && currentSection > 0) {
                // Swipe down - go up
                const targetId = layers[currentSection - 1].id;
                scrollToSection(targetId);
            }
        }
    });
    
    // Update scroll position on resize
    window.addEventListener('resize', function() {
        const activeLayer = layers[currentSection];
        activeLayer.scrollIntoView({ behavior: 'instant' });
    });
    
    // Initialize the page
    initTheme();
    init();
    
    // Update navigation on manual scroll
    let scrollTimeout;
    window.addEventListener('scroll', function() {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            if (!isScrolling) {
                handleScroll();
            }
        }, 100);
    });
});