// ===================================
// ALVI PORTFOLIO - JAVASCRIPT
// Interactive Features & Animations
// ===================================

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    initNavigation();
    initScrollAnimations();
    initCounters();
    initContactForm();
    initScrollToTop();
    initAOS();
});

// ===== NAVIGATION =====
function initNavigation() {
    const navbar = document.getElementById('navbar');
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('navMenu');
    const navLinks = document.querySelectorAll('.nav-link');
    
    // Sticky navbar on scroll
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
    
    // Mobile menu toggle
    if (hamburger) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
            document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
        });
    }
    
    // Close mobile menu on link click
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (hamburger.classList.contains('active')) {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    });
    
    // Active section highlighting
    const sections = document.querySelectorAll('section[id]');
    
    window.addEventListener('scroll', () => {
        const scrollY = window.pageYOffset;
        
        sections.forEach(section => {
            const sectionHeight = section.offsetHeight;
            const sectionTop = section.offsetTop - 100;
            const sectionId = section.getAttribute('id');
            const correspondingLink = document.querySelector(`.nav-link[href="#${sectionId}"]`);
            
            if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
                navLinks.forEach(link => link.classList.remove('active'));
                if (correspondingLink) {
                    correspondingLink.classList.add('active');
                }
            }
        });
    });
}

// ===== SCROLL ANIMATIONS =====
function initScrollAnimations() {
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            
            if (target) {
                const offsetTop = target.offsetTop - 80;
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// ===== ANIMATED COUNTERS =====
function initCounters() {
    const counters = document.querySelectorAll('.stat-number');
    const speed = 2000; // Animation duration in ms
    let hasAnimated = false;
    
    const animateCounters = () => {
        if (hasAnimated) return;
        
        const heroStats = document.querySelector('.hero-stats');
        if (!heroStats) return;
        
        const rect = heroStats.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight && rect.bottom >= 0;
        
        if (isVisible) {
            hasAnimated = true;
            
            counters.forEach(counter => {
                const target = parseInt(counter.getAttribute('data-target'));
                const increment = target / (speed / 16); // 60fps
                let current = 0;
                
                const updateCounter = () => {
                    current += increment;
                    
                    if (current < target) {
                        counter.textContent = Math.ceil(current);
                        requestAnimationFrame(updateCounter);
                    } else {
                        counter.textContent = target;
                    }
                };
                
                updateCounter();
            });
        }
    };
    
    window.addEventListener('scroll', animateCounters);
    animateCounters(); // Check on load
}

// ===== CONTACT FORM =====
function initContactForm() {
    const form = document.getElementById('contactForm');
    const formSuccess = document.getElementById('formSuccess');
    
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(form);
            const data = Object.fromEntries(formData);
            
            // Validate form
            if (!validateForm(data)) {
                return;
            }
            
            // Simulate form submission (replace with actual API call)
            submitForm(data);
        });
    }
}

function validateForm(data) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!data.name || data.name.trim().length < 2) {
        alert('Please enter your name (at least 2 characters)');
        return false;
    }
    
    if (!emailRegex.test(data.email)) {
        alert('Please enter a valid email address');
        return false;
    }
    
    if (!data.subject || data.subject.trim().length < 3) {
        alert('Please enter a subject (at least 3 characters)');
        return false;
    }
    
    if (!data.message || data.message.trim().length < 10) {
        alert('Please enter a message (at least 10 characters)');
        return false;
    }
    
    return true;
}

function submitForm(data) {
    const form = document.getElementById('contactForm');
    const formSuccess = document.getElementById('formSuccess');
    const submitButton = form.querySelector('button[type="submit"]');
    
    // Disable submit button
    submitButton.disabled = true;
    submitButton.innerHTML = '<span>Sending...</span>';
    
    // Simulate API call (replace with actual implementation)
    setTimeout(() => {
        console.log('Form submitted:', data);
        
        // Show success message
        formSuccess.classList.add('show');
        form.style.display = 'none';
        
        // Reset form after 5 seconds
        setTimeout(() => {
            form.reset();
            form.style.display = 'block';
            formSuccess.classList.remove('show');
            submitButton.disabled = false;
            submitButton.innerHTML = '<span>Send Message</span><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>';
        }, 5000);
        
        // In production, replace the setTimeout above with actual API call:
        /*
        fetch('YOUR_API_ENDPOINT', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        })
        .then(response => response.json())
        .then(result => {
            // Handle success
            formSuccess.classList.add('show');
            form.style.display = 'none';
        })
        .catch(error => {
            // Handle error
            console.error('Error:', error);
            alert('Something went wrong. Please try again or email me directly.');
            submitButton.disabled = false;
            submitButton.innerHTML = '<span>Send Message</span><svg>...</svg>';
        });
        */
    }, 1500);
}

// ===== SCROLL TO TOP BUTTON =====
function initScrollToTop() {
    const scrollTopBtn = document.getElementById('scrollTop');
    
    if (scrollTopBtn) {
        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 500) {
                scrollTopBtn.classList.add('show');
            } else {
                scrollTopBtn.classList.remove('show');
            }
        });
        
        scrollTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
}

// ===== AOS (Animate On Scroll) IMPLEMENTATION =====
function initAOS() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('aos-animate');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // Observe all elements with data-aos attribute
    document.querySelectorAll('[data-aos]').forEach(element => {
        observer.observe(element);
    });
}

// ===== SKILL BARS ANIMATION =====
function animateSkillBars() {
    const skillBars = document.querySelectorAll('.skill-progress');
    let hasAnimated = false;
    
    const animateBars = () => {
        if (hasAnimated) return;
        
        const skillsSection = document.querySelector('.skills');
        if (!skillsSection) return;
        
        const rect = skillsSection.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight && rect.bottom >= 0;
        
        if (isVisible) {
            hasAnimated = true;
            
            skillBars.forEach((bar, index) => {
                setTimeout(() => {
                    const width = bar.style.width;
                    bar.style.width = '0%';
                    setTimeout(() => {
                        bar.style.width = width;
                    }, 50);
                }, index * 100);
            });
        }
    };
    
    window.addEventListener('scroll', animateBars);
    animateBars(); // Check on load
}

// Initialize skill bars animation
window.addEventListener('load', animateSkillBars);

// ===== UTILITY FUNCTIONS =====

// Debounce function for performance optimization
function debounce(func, wait = 20, immediate = true) {
    let timeout;
    return function() {
        const context = this;
        const args = arguments;
        const later = function() {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
}

// Throttle function for scroll events
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// ===== CURSOR TRAIL EFFECT (OPTIONAL ENHANCEMENT) =====
function initCursorTrail() {
    const coords = { x: 0, y: 0 };
    const circles = document.querySelectorAll('.circle');
    
    if (circles.length === 0) return; // Only if cursor trail elements exist
    
    circles.forEach(function(circle) {
        circle.x = 0;
        circle.y = 0;
    });
    
    window.addEventListener('mousemove', function(e) {
        coords.x = e.clientX;
        coords.y = e.clientY;
    });
    
    function animateCircles() {
        let x = coords.x;
        let y = coords.y;
        
        circles.forEach(function(circle, index) {
            circle.style.left = x - 12 + 'px';
            circle.style.top = y - 12 + 'px';
            circle.style.transform = `scale(${(circles.length - index) / circles.length})`;
            
            circle.x = x;
            circle.y = y;
            
            const nextCircle = circles[index + 1] || circles[0];
            x += (nextCircle.x - x) * 0.3;
            y += (nextCircle.y - y) * 0.3;
        });
        
        requestAnimationFrame(animateCircles);
    }
    
    animateCircles();
}

// ===== EASTER EGG: KONAMI CODE =====
function initKonamiCode() {
    const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    let konamiIndex = 0;
    
    document.addEventListener('keydown', (e) => {
        if (e.key === konamiCode[konamiIndex]) {
            konamiIndex++;
            
            if (konamiIndex === konamiCode.length) {
                activateEasterEgg();
                konamiIndex = 0;
            }
        } else {
            konamiIndex = 0;
        }
    });
}

function activateEasterEgg() {
    // Fun easter egg effect
    document.body.style.animation = 'rainbow 2s ease-in-out';
    
    // Show a fun message
    const message = document.createElement('div');
    message.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 2rem 3rem;
        border-radius: 20px;
        font-size: 2rem;
        font-weight: 800;
        color: white;
        z-index: 10000;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        animation: popIn 0.3s ease-out;
    `;
    message.textContent = '🎮 You found the secret! 🎉';
    document.body.appendChild(message);
    
    setTimeout(() => {
        message.style.animation = 'popOut 0.3s ease-in';
        setTimeout(() => message.remove(), 300);
        document.body.style.animation = '';
    }, 3000);
}

// Initialize easter egg
initKonamiCode();

// ===== PERFORMANCE MONITORING =====
if (window.performance && console.info) {
    const loadTime = window.performance.timing.domContentLoadedEventEnd - window.performance.timing.navigationStart;
    console.info(`🚀 Portfolio loaded in ${loadTime}ms`);
}

// ===== ADD ANIMATIONS CSS =====
const style = document.createElement('style');
style.textContent = `
    @keyframes rainbow {
        0% { filter: hue-rotate(0deg); }
        100% { filter: hue-rotate(360deg); }
    }
    
    @keyframes popIn {
        0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
        100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
    }
    
    @keyframes popOut {
        0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        100% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
    }
`;
document.head.appendChild(style);

// ===== CONSOLE MESSAGE =====
console.log(`
%c
╔═══════════════════════════════════════════════╗
║                                               ║
║     👋 Hey there, curious developer!         ║
║                                               ║
║     Like what you see? Let's work together!  ║
║     Email: as.alvi.md@gmail.com              ║
║                                               ║
║     Built with 💪 & ☕                        ║
║                                               ║
╚═══════════════════════════════════════════════╝
`, 'color: #667eea; font-family: monospace; font-size: 12px;');

console.log('%cPsst... Try the Konami Code! 🎮', 'color: #f5576c; font-size: 14px; font-weight: bold;');