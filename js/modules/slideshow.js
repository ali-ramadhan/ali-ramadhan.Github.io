/**
 * Slideshow Module
 * Handles automatic slideshow functionality for research sections
 */

class SlideshowManager {
  constructor() {
    this.slideshows = [];
    this.intervals = [];
    this.init();
  }

  init() {
    try {
      this.initializeSlideshows();
    } catch (error) {
      console.error('Error in slideshow initialization:', error);
    }
  }

  initializeSlideshows() {
    const slideshowElements = document.querySelectorAll('.slideshow');
    
    slideshowElements.forEach((slideshow, index) => {
      try {
        const slides = slideshow.querySelectorAll('div');
        if (slides.length === 0) return;

        const slideshowData = {
          element: slideshow,
          slides: slides,
          currentSlide: 0,
          id: index
        };

        this.slideshows.push(slideshowData);
        this.startSlideshow(slideshowData);
      } catch (error) {
        console.error(`Error initializing slideshow ${index}:`, error);
      }
    });
  }

  startSlideshow(slideshowData) {
    const { slides } = slideshowData;
    
    // Show first slide initially
    slides[slideshowData.currentSlide].classList.add('active');
    
    // Auto-advance slides
    const intervalId = setInterval(() => {
      try {
        slides[slideshowData.currentSlide].classList.remove('active');
        slideshowData.currentSlide = (slideshowData.currentSlide + 1) % slides.length;
        slides[slideshowData.currentSlide].classList.add('active');
      } catch (error) {
        console.error(`Error advancing slide in slideshow ${slideshowData.id}:`, error);
      }
    }, 4000); // Change slide every 4 seconds

    this.intervals.push(intervalId);
  }

  pauseAll() {
    this.intervals.forEach(intervalId => {
      clearInterval(intervalId);
    });
  }

  resumeAll() {
    // Clear existing intervals first
    this.pauseAll();
    this.intervals = [];
    
    // Restart all slideshows
    this.slideshows.forEach(slideshowData => {
      this.startSlideshow(slideshowData);
    });
  }

  cleanup() {
    this.pauseAll();
    this.intervals = [];
    this.slideshows = [];
  }
}

export { SlideshowManager };