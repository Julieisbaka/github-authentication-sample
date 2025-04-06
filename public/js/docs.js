// DOM Elements
const sidebarLinks = document.querySelectorAll('.sidebar-link');
const docsSections = document.querySelectorAll('.docs-section');

// Function to handle active sidebar link
function activateSidebarLink(hash) {
  // Remove active class from all links
  sidebarLinks.forEach(link => {
    link.classList.remove('active');
  });
  
  // Add active class to current link
  const activeLink = hash ? 
    document.querySelector(`.sidebar-link[href="${hash}"]`) : 
    sidebarLinks[0];
    
  if (activeLink) {
    activeLink.classList.add('active');
  }
}

// Function to handle scroll spy
function handleScrollSpy() {
  // Get current scroll position
  const scrollPosition = window.scrollY;
  
  // Check each section's position
  docsSections.forEach(section => {
    const sectionTop = section.offsetTop - 100;
    const sectionBottom = sectionTop + section.offsetHeight;
    
    if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
      const id = `#${section.id}`;
      activateSidebarLink(id);
      // Update URL hash without scrolling
      history.replaceState(null, null, id);
    }
  });
}

// Initialize the documentation page
document.addEventListener('DOMContentLoaded', () => {
  // Set initial active link based on URL hash
  const initialHash = window.location.hash || '#getting-started';
  activateSidebarLink(initialHash);
  
  // Smooth scroll to section when sidebar link is clicked
  sidebarLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('href');
      const targetSection = document.querySelector(targetId);
      
      if (targetSection) {
        window.scrollTo({
          top: targetSection.offsetTop - 80,
          behavior: 'smooth'
        });
        
        // Update URL hash
        history.pushState(null, null, targetId);
        
        // Update active link
        activateSidebarLink(targetId);
      }
    });
  });
  
  // Add scroll event listener for scroll spy
  window.addEventListener('scroll', handleScrollSpy);
  
  // Handle initial scroll to hash section
  if (initialHash !== '#getting-started') {
    const targetSection = document.querySelector(initialHash);
    if (targetSection) {
      setTimeout(() => {
        window.scrollTo({
          top: targetSection.offsetTop - 80,
          behavior: 'smooth'
        });
      }, 100);
    }
  }
  
  // Keep authentication state consistent across pages
  checkAuthStatus();
});