document.addEventListener("DOMContentLoaded", function () {
  // Configuration constants
  const CONFIG = {
    STARTING_SECTION: 2, // Land section index
    TOUCH_THRESHOLD: 50, // Minimum swipe distance in pixels
    SCROLL_DEBOUNCE_DELAY: 100, // Scroll event debounce in ms
    SCROLL_ANIMATION_DURATION: 1000, // Scroll animation timeout in ms
  };

  const layers = document.querySelectorAll(".layer");
  const navDots = document.querySelectorAll(".nav-dot");
  const themeToggle = document.getElementById("theme-toggle");
  const toggleIcon = document.querySelector(".toggle-icon");
  const sunElement = document.getElementById("sun");
  const moonElement = document.getElementById("moon");

  let isScrolling = false;
  let currentSection = CONFIG.STARTING_SECTION;

  // Theme management
  function initTheme() {
    const savedTheme = localStorage.getItem("theme") || "light";
    setTheme(savedTheme);
  }

  function updateThemeIcon(theme) {
    toggleIcon.innerHTML = theme === "dark" ? "🌙" : "☀️";
  }

  function setTheme(theme) {
    document.body.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
    updateThemeIcon(theme);
  }

  function toggleTheme() {
    const currentTheme = document.body.getAttribute("data-theme") || "light";
    const newTheme = currentTheme === "light" ? "dark" : "light";
    setTheme(newTheme);
  }

  // Handle sun click to switch to dark mode
  function handleSunClick() {
    const currentTheme = document.body.getAttribute("data-theme") || "light";
    // Only allow sun click to switch to dark mode when in light mode
    if (currentTheme === "light") {
      setTheme("dark");
    }
  }

  // Handle moon click to switch to light mode
  function handleMoonClick() {
    const currentTheme = document.body.getAttribute("data-theme") || "light";
    // Only allow moon click to switch to light mode when in dark mode
    if (currentTheme === "dark") {
      setTheme("light");
    }
  }

  // Theme toggle event listeners
  themeToggle.addEventListener("click", toggleTheme);
  if (sunElement) {
    sunElement.addEventListener("click", handleSunClick);
  }
  if (moonElement) {
    moonElement.addEventListener("click", handleMoonClick);
  }

  // Initialize - scroll to land section on load
  function init() {
    const landSection = getSectionById("land");
    if (landSection) {
      landSection.scrollIntoView({ behavior: "instant" });
      updateActiveNav("land");
    }
  }

  // Update active navigation dot
  function updateActiveNav(layerId) {
    navDots.forEach((dot) => {
      const isActive = dot.getAttribute("data-layer") === layerId;

      // Update visual active state
      dot.classList.toggle("active", isActive);

      // Update accessibility attributes
      if (isActive) {
        dot.setAttribute("aria-current", "page");
      } else {
        dot.removeAttribute("aria-current");
      }
    });
  }

  // Cache section data for efficient navigation
  const sectionData = Array.from(layers).map((layer, index) => ({
    element: layer,
    id: layer.id,
    index: index,
  }));

  // Get section index by ID (optimized with cached data)
  function getSectionIndex(layerId) {
    const section = sectionData.find((s) => s.id === layerId);
    return section ? section.index : -1;
  }

  // Get section by index (direct access)
  function getSectionById(layerId) {
    const section = sectionData.find((s) => s.id === layerId);
    return section ? section.element : null;
  }

  // Handle scroll events
  function handleScroll() {
    if (isScrolling) return;

    const scrollTop = window.pageYOffset;
    const windowHeight = window.innerHeight;
    const currentScrollSection = Math.round(scrollTop / windowHeight);

    if (
      currentScrollSection !== currentSection &&
      currentScrollSection >= 0 &&
      currentScrollSection < layers.length
    ) {
      currentSection = currentScrollSection;
      const activeLayer = layers[currentSection];
      updateActiveNav(activeLayer.id);
    }
  }

  // Smooth scroll to section
  function scrollToSection(targetId) {
    isScrolling = true;
    const targetSection = getSectionById(targetId);

    if (targetSection) {
      targetSection.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });

      currentSection = getSectionIndex(targetId);
      updateActiveNav(targetId);
    }

    // Reset scrolling flag after animation
    setTimeout(() => {
      isScrolling = false;
    }, CONFIG.SCROLL_ANIMATION_DURATION);
  }

  // Handle navigation dot clicks
  navDots.forEach((dot) => {
    dot.addEventListener("click", function (e) {
      e.preventDefault();
      const targetLayer = this.getAttribute("data-layer");
      scrollToSection(targetLayer);
    });
  });

  // Handle keyboard navigation
  document.addEventListener("keydown", function (e) {
    if (isScrolling) return;

    if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      e.preventDefault();
      if (currentSection > 0) {
        const targetId = layers[currentSection - 1].id;
        scrollToSection(targetId);
      }
    } else if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault();
      if (currentSection < layers.length - 1) {
        const targetId = layers[currentSection + 1].id;
        scrollToSection(targetId);
      }
    }
  });

  // Consolidated scroll handling with debouncing
  let scrollTimeout;
  function debouncedScrollHandler() {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      if (!isScrolling) {
        handleScroll();
      }
    }, CONFIG.SCROLL_DEBOUNCE_DELAY);
  }

  // Handle all scroll-related events
  document.addEventListener("wheel", debouncedScrollHandler);
  window.addEventListener("scroll", debouncedScrollHandler);

  // Handle touch events for mobile
  let touchStartY = 0;
  let touchEndY = 0;

  document.addEventListener("touchstart", function (e) {
    touchStartY = e.changedTouches[0].screenY;
  });

  document.addEventListener("touchend", function (e) {
    touchEndY = e.changedTouches[0].screenY;
    const touchDiff = touchStartY - touchEndY;

    if (Math.abs(touchDiff) > CONFIG.TOUCH_THRESHOLD && !isScrolling) {
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
  window.addEventListener("resize", function () {
    const activeLayer = layers[currentSection];
    activeLayer.scrollIntoView({ behavior: "instant" });
  });

  // Research functionality with error handling
  function initSlideshow() {
    try {
      const slideshows = document.querySelectorAll('.slideshow');
      
      slideshows.forEach(slideshow => {
        try {
          const slides = slideshow.querySelectorAll('div');
          if (slides.length === 0) return;
          
          let currentSlide = 0;
          
          // Show first slide initially
          slides[currentSlide].classList.add('active');
          
          // Auto-advance slides
          setInterval(() => {
            slides[currentSlide].classList.remove('active');
            currentSlide = (currentSlide + 1) % slides.length;
            slides[currentSlide].classList.add('active');
          }, 4000); // Change slide every 4 seconds
        } catch (error) {
          console.error('Error initializing slideshow:', error);
        }
      });
    } catch (error) {
      console.error('Error in slideshow initialization:', error);
    }
  }

  function initProjectSections() {
    try {
      const projectTitles = document.querySelectorAll('.project-title');
      
      projectTitles.forEach(title => {
        try {
          title.addEventListener('click', function() {
            const projectNum = this.getAttribute('data-project');
            const projectDetails = document.getElementById(`project${projectNum}`);
            
            if (!projectDetails) return;
            
            const isExpanded = this.classList.contains('expanded');
            
            if (isExpanded) {
              // Collapse
              this.classList.remove('expanded');
              projectDetails.classList.remove('expanded');
              projectDetails.style.display = 'none';
            } else {
              // Expand
              this.classList.add('expanded');
              projectDetails.style.display = 'block';
              // Small delay to allow display change to take effect
              setTimeout(() => {
                projectDetails.classList.add('expanded');
              }, 10);
            }
          });
        } catch (error) {
          console.error('Error setting up project section:', error);
        }
      });
    } catch (error) {
      console.error('Error in project sections initialization:', error);
    }
  }

  // Initialize the page
  initTheme();
  init();
  initSlideshow();
  initProjectSections();
});
