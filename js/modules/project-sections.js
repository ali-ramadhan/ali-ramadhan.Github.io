/**
 * Project Sections Module
 * Handles expandable/collapsible project sections
 */

class ProjectSectionsManager {
  constructor() {
    this.eventListeners = [];
    this.init();
  }

  init() {
    try {
      this.initializeProjectSections();
    } catch (error) {
      console.error('Error in project sections initialization:', error);
    }
  }

  initializeProjectSections() {
    const projectTitles = document.querySelectorAll('.project-title');
    
    projectTitles.forEach(title => {
      try {
        const clickHandler = () => this.handleProjectTitleClick(title);
        title.addEventListener('click', clickHandler);
        this.eventListeners.push({ element: title, event: 'click', handler: clickHandler });
      } catch (error) {
        console.error('Error setting up project section:', error);
      }
    });
  }

  handleProjectTitleClick(titleElement) {
    try {
      const projectNum = titleElement.getAttribute('data-project');
      const projectDetails = document.getElementById(`project${projectNum}`);
      
      if (!projectDetails) return;
      
      const isExpanded = titleElement.classList.contains('expanded');
      
      if (isExpanded) {
        this.collapseProject(titleElement, projectDetails);
      } else {
        this.expandProject(titleElement, projectDetails);
      }
    } catch (error) {
      console.error('Error handling project title click:', error);
    }
  }

  collapseProject(titleElement, projectDetails) {
    titleElement.classList.remove('expanded');
    projectDetails.classList.remove('expanded');
    projectDetails.style.display = 'none';
  }

  expandProject(titleElement, projectDetails) {
    titleElement.classList.add('expanded');
    projectDetails.style.display = 'block';
    
    // Small delay to allow display change to take effect
    setTimeout(() => {
      projectDetails.classList.add('expanded');
    }, 10);
  }

  cleanup() {
    this.eventListeners.forEach(({ element, event, handler }) => {
      element.removeEventListener(event, handler);
    });
    this.eventListeners = [];
  }
}

export { ProjectSectionsManager };