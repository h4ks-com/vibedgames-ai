// JavaScript for enhanced navigation and interactions

// Smooth scroll for navigation links
document.querySelectorAll('nav a').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const targetSection = document.querySelector(link.getAttribute('href'));
    targetSection.scrollIntoView({ behavior: 'smooth' });
  });
});

// Optional: Implement 'Back to Top' button for future use
// Create button element
const backToTopBtn = document.createElement('button');
backToTopBtn.id = 'backToTop';
backToTopBtn.textContent = 'Back to Top';
// Style the button
backToTopBtn.style.position = 'fixed';
backToTopBtn.style.bottom = '20px';
backToTopBtn.style.right = '20px';
backToTopBtn.style.padding = '10px 15px';
backToTopBtn.style.fontSize = '1em';
backToTopBtn.style.border = 'none';
backToTopBtn.style.borderRadius = '6px';
backToTopBtn.style.backgroundColor = '#006064';
backToTopBtn.style.color = '#fff';
backToTopBtn.style.cursor = 'pointer';
backToTopBtn.style.display = 'none'; // Hidden initially
// Append button to body
document.body.appendChild(backToTopBtn);

// Show button after scrolling down 300px
window.addEventListener('scroll', () => {
  if (window.scrollY > 300) {
    backToTopBtn.style.display = 'block';
  } else {
    backToTopBtn.style.display = 'none';
  }
});

// Scroll to top smoothly on button click
backToTopBtn.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});