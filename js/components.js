// Component loader utility
class ComponentLoader {
    static async loadComponent(componentPath, targetSelector) {
        try {
            const response = await fetch(componentPath);
            const html = await response.text();
            const targetElement = document.querySelector(targetSelector);
            if (targetElement) {
                targetElement.innerHTML = html;
                return true;
            }
        } catch (error) {
            console.error(`Failed to load component ${componentPath}:`, error);
            return false;
        }
    }

    static async loadHeader() {
        const loaded = await this.loadComponent('components/header.html', '#header-placeholder');
        if (loaded) {
            this.initializeHeaderFunctionality();
            this.setActiveNavLink();
        }
    }

    static async loadFooter() {
        await this.loadComponent('components/footer.html', '#footer-placeholder');
    }

    static initializeHeaderFunctionality() {
        // Mobile menu toggle
        const hamburger = document.querySelector('.hamburger');
        const navMenu = document.querySelector('.nav-menu');

        if (hamburger && navMenu) {
            hamburger.addEventListener('click', () => {
                hamburger.classList.toggle('active');
                navMenu.classList.toggle('active');
            });
        }

        // Header scroll effect
        window.addEventListener('scroll', () => {
            const header = document.querySelector('.header');
            if (header) {
                if (window.scrollY > 100) {
                    header.classList.add('scrolled');
                } else {
                    header.classList.remove('scrolled');
                }
            }
        });

        // Smooth scrolling for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    static setActiveNavLink() {
        const currentPage = this.getCurrentPage();
        const navLinks = document.querySelectorAll('.nav-link');
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            const linkPage = link.getAttribute('data-page');
            if (linkPage === currentPage) {
                link.classList.add('active');
            }
        });
    }

    static getCurrentPage() {
        const path = window.location.pathname;
        const filename = path.split('/').pop() || 'index.html';
        
        if (filename === 'index.html' || filename === '') {
            return 'home';
        } else if (filename === 'blog.html') {
            return 'blog';
        }
        // Add more page mappings as needed
        return filename.replace('.html', '');
    }
}

// Auto-load components when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    await ComponentLoader.loadHeader();
    await ComponentLoader.loadFooter();
});

// Export for manual loading if needed
window.ComponentLoader = ComponentLoader;