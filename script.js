// ===== MODERN INTERACTIVE WEBSITE SCRIPT =====

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all components
    initLoader();
    initNavigation();
    initScrollEffects();
    initProjectFilters();
    initAnimations();
    initTypingEffect();
    initParticles();
    
    console.log('✅ Tim Maes website loaded successfully!');
});

// ===== LOADER ANIMATION =====
function initLoader() {
    const loader = document.getElementById('loader');
    
    // Hide loader after page load
    window.addEventListener('load', () => {
        setTimeout(() => {
            loader.classList.add('hidden');
            document.body.style.overflow = 'visible';
        }, 500);
    });
    
    // Fallback: hide loader after 3 seconds
    setTimeout(() => {
        if (!loader.classList.contains('hidden')) {
            loader.classList.add('hidden');
            document.body.style.overflow = 'visible';
        }
    }, 3000);
}

// ===== NAVIGATION =====
function initNavigation() {
    const navbar = document.getElementById('navbar');
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');
    
    // Mobile menu toggle
    navToggle.addEventListener('click', () => {
        navToggle.classList.toggle('active');
        navMenu.classList.toggle('active');
        
        // Prevent body scroll when mobile menu is open
        if (navMenu.classList.contains('active')) {
            document.body.style.overflow = 'hidden';
            document.body.style.position = 'fixed';
            document.body.style.top = `-${window.scrollY}px`;
            document.body.style.width = '100%';
        } else {
            const scrollY = document.body.style.top;
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.width = '';
            window.scrollTo(0, parseInt(scrollY || '0') * -1);
        }
    });
    
    // Close mobile menu when clicking on links
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navToggle.classList.remove('active');
            navMenu.classList.remove('active');
            
            // Restore body scroll
            const scrollY = document.body.style.top;
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.width = '';
            window.scrollTo(0, parseInt(scrollY || '0') * -1);
        });
    });
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!navbar.contains(e.target) && navMenu.classList.contains('active')) {
            navToggle.classList.remove('active');
            navMenu.classList.remove('active');
            
            // Restore body scroll
            const scrollY = document.body.style.top;
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.width = '';
            window.scrollTo(0, parseInt(scrollY || '0') * -1);
        }
    });
    
    // Handle window resize to close mobile menu on desktop
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768 && navMenu.classList.contains('active')) {
            navToggle.classList.remove('active');
            navMenu.classList.remove('active');
            
            // Restore body scroll
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.width = '';
        }
    });
    
    // Smooth scrolling for navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');

            // Only intercept same-page anchor links (starting with '#')
            if (href && href.startsWith('#')) {
                e.preventDefault();
                const targetId = href.substring(1);
                const targetSection = document.getElementById(targetId);

                if (targetSection) {
                    const offsetTop = targetSection.offsetTop - 80;
                    window.scrollTo({
                        top: offsetTop,
                        behavior: 'smooth'
                    });
                }
            }
            // For normal links (e.g., resume.html, projects.html), do not prevent default so navigation occurs
        });
    });
    
    // Navbar scroll effects
    let lastScrollY = window.scrollY;
    
    window.addEventListener('scroll', throttle(() => {
        const currentScrollY = window.scrollY;
        
        // Add scrolled class for backdrop effect
        if (currentScrollY > 100) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
        
        // Hide/show navbar on scroll (only on desktop to avoid issues with mobile menu)
        if (window.innerWidth > 768) {
            if (currentScrollY > lastScrollY && currentScrollY > 200) {
                navbar.style.transform = 'translateY(-100%)';
            } else {
                navbar.style.transform = 'translateY(0)';
            }
        }
        
        lastScrollY = currentScrollY;
        
        // Update active navigation link
        updateActiveNavLink();
    }, 16));
}

// ===== SCROLL EFFECTS =====
function initScrollEffects() {
    // Intersection Observer for animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in-up');
            }
        });
    }, observerOptions);
    
    // Observe elements for animation
    const animatedElements = document.querySelectorAll('.project-card, .blog-card, .highlight, .tech-item');
    animatedElements.forEach(el => observer.observe(el));
    
    // Parallax effect for hero background
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const heroGrid = document.querySelector('.hero-grid');
        const heroParticles = document.querySelector('.hero-particles');
        
        if (heroGrid) {
            heroGrid.style.transform = `translateY(${scrolled * 0.3}px)`;
        }
        
        if (heroParticles) {
            heroParticles.style.transform = `translateY(${scrolled * 0.2}px)`;
        }
    });
}

// ===== PROJECT FILTERS =====
function initProjectFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const projectCards = document.querySelectorAll('.project-card');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Update active button
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            const filter = button.getAttribute('data-filter');
            
            // Filter projects with animation
            projectCards.forEach((card, index) => {
                const categories = card.getAttribute('data-category').split(' ');
                const shouldShow = filter === 'all' || categories.includes(filter);
                
                setTimeout(() => {
                    if (shouldShow) {
                        card.style.display = 'block';
                        setTimeout(() => {
                            card.style.opacity = '1';
                            card.style.transform = 'translateY(0)';
                        }, 50);
                    } else {
                        card.style.opacity = '0';
                        card.style.transform = 'translateY(20px)';
                        setTimeout(() => {
                            card.style.display = 'none';
                        }, 300);
                    }
                }, index * 100);
            });
        });
    });
}

// ===== ANIMATIONS =====
function initAnimations() {
    // Stagger animation for hero stats
    const stats = document.querySelectorAll('.stat');
    stats.forEach((stat, index) => {
        stat.style.animationDelay = `${index * 0.2}s`;
        stat.classList.add('fade-in-up');
    });
    
    // Animate tech stack items
    const techItems = document.querySelectorAll('.tech-item');
    techItems.forEach((item, index) => {
        item.style.animationDelay = `${index * 0.1}s`;
    });
    
    // Floating animation for project cards
    const projectCards = document.querySelectorAll('.project-card');
    projectCards.forEach((card, index) => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-12px) rotateY(5deg)';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0) rotateY(0)';
        });
    });
    
    // Glitch effect for brand text
    const brandText = document.querySelector('.brand-text');
    if (brandText) {
        setInterval(() => {
            if (Math.random() < 0.1) { // 10% chance
                brandText.style.textShadow = '2px 0 #64ffda, -2px 0 #7c3aed';
                setTimeout(() => {
                    brandText.style.textShadow = 'none';
                }, 100);
            }
        }, 2000);
    }
}

// ===== TYPING EFFECT =====
function initTypingEffect() {
    const heroRole = document.querySelector('.hero-role');
    if (!heroRole) return;
    
    const roles = [
        '.NET Developer & Open Source Contributor',
        'Blazor Enthusiast & Security Advocate',
        'Code Generation Specialist',
        'Developer Tools Creator'
    ];
    
    let currentRole = 0;
    let currentChar = 0;
    let isDeleting = false;
    
    function typeEffect() {
        const fullText = roles[currentRole];
        
        if (isDeleting) {
            heroRole.textContent = fullText.substring(0, currentChar - 1);
            currentChar--;
        } else {
            heroRole.textContent = fullText.substring(0, currentChar + 1);
            currentChar++;
        }
        
        let typeSpeed = isDeleting ? 50 : 100;
        
        if (!isDeleting && currentChar === fullText.length) {
            typeSpeed = 2000; // Pause at end
            isDeleting = true;
        } else if (isDeleting && currentChar === 0) {
            isDeleting = false;
            currentRole = (currentRole + 1) % roles.length;
            typeSpeed = 500; // Pause before next role
        }
        
        setTimeout(typeEffect, typeSpeed);
    }
    
    // Start typing effect after a delay
    setTimeout(typeEffect, 2000);
}

// ===== PARTICLE SYSTEM =====
function initParticles() {
    const particlesContainer = document.querySelector('.hero-particles');
    if (!particlesContainer) return;
    
    // Create floating particles
    for (let i = 0; i < 20; i++) {
        createParticle(particlesContainer);
    }
    
    function createParticle(container) {
        const particle = document.createElement('div');
        particle.style.position = 'absolute';
        particle.style.width = Math.random() * 4 + 2 + 'px';
        particle.style.height = particle.style.width;
        particle.style.background = 'rgba(100, 255, 218, 0.3)';
        particle.style.borderRadius = '50%';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.pointerEvents = 'none';
        
        // Animate particle
        const duration = Math.random() * 10 + 10; // 10-20 seconds
        const distance = Math.random() * 200 + 100; // 100-300px
        
        particle.style.animation = `floatParticle ${duration}s ease-in-out infinite`;
        
        container.appendChild(particle);
        
        // Remove and recreate particle after animation
        setTimeout(() => {
            if (particle.parentNode) {
                particle.remove();
                createParticle(container);
            }
        }, duration * 1000);
    }
    
    // Add particle animation to CSS
    const style = document.createElement('style');
    style.textContent = `
        @keyframes floatParticle {
            0%, 100% {
                transform: translateY(0px) translateX(0px);
                opacity: 0;
            }
            10%, 90% {
                opacity: 1;
            }
            50% {
                transform: translateY(-100px) translateX(50px);
                opacity: 0.7;
            }
        }
    `;
    document.head.appendChild(style);
}

// ===== UTILITY FUNCTIONS =====
function updateActiveNavLink() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    
    let current = '';
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop - 100;
        const sectionHeight = section.clientHeight;
        
        if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
            current = section.getAttribute('id');
        }
    });
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
}

// ===== PERFORMANCE OPTIMIZATIONS =====
// Throttle scroll events
function throttle(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Optimize scroll event listeners
const optimizedScrollHandler = throttle(() => {
    // Your scroll handling code here
}, 16); // ~60fps

// ===== ACCESSIBILITY ENHANCEMENTS =====
// Keyboard navigation for project cards
document.querySelectorAll('.project-card').forEach(card => {
    card.setAttribute('tabindex', '0');
    
    card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            const link = card.querySelector('.project-link');
            if (link) link.click();
        }
    });
});

// Focus management for mobile menu
const navToggle = document.getElementById('nav-toggle');
const navMenu = document.getElementById('nav-menu');

if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
        if (navMenu.classList.contains('active')) {
            // Focus first menu item when opening
            const firstLink = navMenu.querySelector('.nav-link');
            if (firstLink) {
                setTimeout(() => firstLink.focus(), 100);
            }
        }
    });
}

// ===== EASTER EGGS =====
// Konami code easter egg
let konamiCode = [];
const konamiSequence = [
    'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
    'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
    'KeyB', 'KeyA'
];

document.addEventListener('keydown', (e) => {
    konamiCode.push(e.code);
    
    if (konamiCode.length > konamiSequence.length) {
        konamiCode.shift();
    }
    
    // Check QWERTY, AZERTY, and alternative AZERTY variations
    const azertySequence1 = [
        'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
        'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
        'KeyQ', 'KeyA'  // AZERTY: Q where B is on QWERTY, A same position
    ];
    
    const azertySequence2 = [
        'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
        'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
        'KeyB', 'KeyQ'  // Alternative AZERTY interpretation
    ];
    
    if (JSON.stringify(konamiCode) === JSON.stringify(konamiSequence) || 
        JSON.stringify(konamiCode) === JSON.stringify(azertySequence1) ||
        JSON.stringify(konamiCode) === JSON.stringify(azertySequence2)) {
        triggerEasterEgg();
        konamiCode = [];
    }
});

function triggerEasterEgg() {
    // Add rainbow animation to the page
    document.body.style.animation = 'rainbow 2s ease-in-out';
    
    // Show a fun message
    const message = document.createElement('div');
    message.textContent = '🎉 You found the secret! Tim loves easter eggs! 🥚';
    message.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: var(--accent-gradient);
        color: var(--bg-primary);
        padding: 2rem;
        border-radius: 1rem;
        font-weight: bold;
        z-index: 10000;
        animation: bounce 0.5s ease-in-out;
    `;
    
    document.body.appendChild(message);
    
    setTimeout(() => {
        message.remove();
        document.body.style.animation = '';
    }, 3000);
    
    // Add rainbow animation
    const rainbowStyle = document.createElement('style');
    rainbowStyle.textContent = `
        @keyframes rainbow {
            0% { filter: hue-rotate(0deg); }
            100% { filter: hue-rotate(360deg); }
        }
        @keyframes bounce {
            0%, 100% { transform: translate(-50%, -50%) scale(1); }
            50% { transform: translate(-50%, -50%) scale(1.1); }
        }
    `;
    document.head.appendChild(rainbowStyle);
    
    setTimeout(() => rainbowStyle.remove(), 3000);
}

// ===== CONSOLE MESSAGE =====
console.log(`
%c🎯 Welcome to Tim Maes' Portfolio! 👋
%cBuilt with love using vanilla JavaScript, modern CSS, and a lot of coffee ?
%cInterested in the code? Check out the GitHub repo!
%chttps://github.com/Tim-Maes/Tim-Maes.github.io

%cPro tip: Try the Konami Code for a surprise! 🎮
`, 
'color: #64ffda; font-size: 16px; font-weight: bold;',
'color: #b8c5d6; font-size: 12px;',
'color: #7c3aed; font-size: 12px; font-weight: bold;',
'color: #64ffda; font-size: 12px;',
'color: #f59e0b; font-size: 10px; font-style: italic;'
);

// ===== EXPORT FOR TESTING =====
window.TimMaesPortfolio = {
    initLoader,
    initNavigation,
    initScrollEffects,
    initProjectFilters,
    initAnimations,
    initTypingEffect,
    initParticles,
    updateActiveNavLink,
    throttle
};