// ================================================
// Mobile Menu Toggle
// ================================================
const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
const navLinks = document.querySelector('.nav-links');

if (mobileMenuToggle && navLinks) {
    mobileMenuToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = navLinks.classList.contains('active');
        mobileMenuToggle.classList.toggle('active');
        navLinks.classList.toggle('active');
        document.body.style.overflow = isOpen ? '' : 'hidden';
    });

    // Close menu when clicking on a link
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            mobileMenuToggle.classList.remove('active');
            navLinks.classList.remove('active');
            document.body.style.overflow = '';
        });
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (navLinks.classList.contains('active') &&
            !navLinks.contains(e.target) &&
            !mobileMenuToggle.contains(e.target)) {
            mobileMenuToggle.classList.remove('active');
            navLinks.classList.remove('active');
            document.body.style.overflow = '';
        }
    });

    // Close on ESC key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navLinks.classList.contains('active')) {
            mobileMenuToggle.classList.remove('active');
            navLinks.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
}

// ================================================
// Smooth scroll (respects reduced motion)
// ================================================
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href === '#') return;
        const target = document.querySelector(href);
        if (target) {
            e.preventDefault();
            target.scrollIntoView({
                behavior: prefersReducedMotion ? 'auto' : 'smooth',
                block: 'start'
            });
        }
    });
});

// ================================================
// Scroll animations (IntersectionObserver)
// ================================================
const observerOptions = {
    threshold: 0.08,
    rootMargin: '0px 0px -60px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animated');
        }
    });
}, observerOptions);

document.querySelectorAll('[data-animate]').forEach(el => {
    observer.observe(el);
});

// ================================================
// Active nav link on scroll
// ================================================
const sections = document.querySelectorAll('section[id]');

const scrollObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const id = entry.target.getAttribute('id');
            document.querySelectorAll('.nav-links a').forEach(link => {
                link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
            });
        }
    });
}, { rootMargin: '-40% 0px -55% 0px' });

sections.forEach(section => scrollObserver.observe(section));

// ================================================
// CAROUSEL
// ================================================
let currentSlides = {};
let autoTimers = {};
let carouselElements = [];

const AUTOPLAY_DELAY = 3500;

document.addEventListener('DOMContentLoaded', () => {
    // Collect all carousels by DOM order
    document.querySelectorAll('.carousel-slides').forEach((el, index) => {
        carouselElements[index] = el;
        currentSlides[index] = 0;
        startAutoplay(index);
    });

    // Generate dots dynamically
    carouselElements.forEach((carousel, index) => {
        const slides = carousel.querySelectorAll('.carousel-slide');
        const dotsContainer = carousel.parentElement.querySelector('.carousel-dots');
        if (!dotsContainer) return;

        dotsContainer.innerHTML = '';

        slides.forEach((_, i) => {
            const dot = document.createElement('span');
            dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
            dot.addEventListener('click', () => goToSlide(index, i));
            dotsContainer.appendChild(dot);
        });
    });

    // Rebind prev/next buttons by DOM index
    document.querySelectorAll('.project-carousel').forEach((carouselWrapper, index) => {
        const prevBtn = carouselWrapper.querySelector('.carousel-nav.prev');
        const nextBtn = carouselWrapper.querySelector('.carousel-nav.next');

        if (prevBtn) {
            prevBtn.removeAttribute('onclick');
            prevBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                changeSlide(index, -1);
            });
        }
        if (nextBtn) {
            nextBtn.removeAttribute('onclick');
            nextBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                changeSlide(index, 1);
            });
        }
    });

    // Touch/swipe support for carousels
    carouselElements.forEach((carousel, index) => {
        let touchStartX = 0;
        let touchEndX = 0;
        let isDragging = false;

        carousel.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
            isDragging = false;
        }, { passive: true });

        carousel.addEventListener('touchmove', (e) => {
            isDragging = true;
        }, { passive: true });

        carousel.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            const diff = touchStartX - touchEndX;
            if (Math.abs(diff) > 40) { // min swipe distance
                changeSlide(index, diff > 0 ? 1 : -1);
            }
        }, { passive: true });

        // Click on image → lightbox
        carousel.querySelectorAll('.carousel-slide img').forEach((img) => {
            const slideIndex = Array.from(carousel.querySelectorAll('.carousel-slide'))
                .indexOf(img.closest('.carousel-slide'));

            img.addEventListener('click', () => {
                if (!isDragging) {
                    openLightbox(index, slideIndex);
                }
            });
        });
    });
});

// ------------------------------------------------
// Autoplay
// ------------------------------------------------
function startAutoplay(carouselIndex) {
    if (autoTimers[carouselIndex]) clearInterval(autoTimers[carouselIndex]);
    autoTimers[carouselIndex] = setInterval(() => {
        changeSlide(carouselIndex, 1, false);
    }, AUTOPLAY_DELAY);
}

function resetAutoplay(carouselIndex) {
    if (autoTimers[carouselIndex]) clearInterval(autoTimers[carouselIndex]);
    startAutoplay(carouselIndex);
}

// ------------------------------------------------
// Slide change
// ------------------------------------------------
function changeSlide(carouselIndex, direction, resetTimer = true) {
    const carousel = carouselElements[carouselIndex];
    if (!carousel) return;

    const slides = carousel.querySelectorAll('.carousel-slide');
    currentSlides[carouselIndex] += direction;

    if (currentSlides[carouselIndex] < 0) {
        currentSlides[carouselIndex] = slides.length - 1;
    } else if (currentSlides[carouselIndex] >= slides.length) {
        currentSlides[carouselIndex] = 0;
    }

    updateCarousel(carouselIndex);
    if (resetTimer) resetAutoplay(carouselIndex);
}

function goToSlide(carouselIndex, slideIndex) {
    currentSlides[carouselIndex] = slideIndex;
    updateCarousel(carouselIndex);
    resetAutoplay(carouselIndex);
}

function updateCarousel(carouselIndex) {
    const carousel = carouselElements[carouselIndex];
    if (!carousel) return;

    carousel.style.transform = `translateX(-${currentSlides[carouselIndex] * 100}%)`;

    const dots = carousel.parentElement.querySelectorAll('.carousel-dot');
    dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === currentSlides[carouselIndex]);
    });
}

// ================================================
// LIGHTBOX
// ================================================
let lightboxImages = [];
let currentLightboxIndex = 0;

function openLightbox(carouselIndex, slideIndex) {
    const carousel = carouselElements[carouselIndex];
    if (!carousel) return;

    const imgs = carousel.querySelectorAll('.carousel-slide img');
    lightboxImages = Array.from(imgs).map(img => img.src);
    currentLightboxIndex = slideIndex;

    if (lightboxImages.length === 0) return;

    updateLightboxImage();
    const modal = document.getElementById('lightboxModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeLightbox() {
    const modal = document.getElementById('lightboxModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function lightboxNavigate(direction) {
    currentLightboxIndex += direction;
    if (currentLightboxIndex < 0) currentLightboxIndex = lightboxImages.length - 1;
    else if (currentLightboxIndex >= lightboxImages.length) currentLightboxIndex = 0;
    updateLightboxImage();
}

function updateLightboxImage() {
    const img = document.getElementById('lightboxImage');
    const counter = document.getElementById('lightboxCounter');
    if (img) img.src = lightboxImages[currentLightboxIndex];
    if (counter) counter.textContent = `${currentLightboxIndex + 1} / ${lightboxImages.length}`;
}

// Keyboard navigation
document.addEventListener('keydown', (e) => {
    const modal = document.getElementById('lightboxModal');
    if (!modal || !modal.classList.contains('active')) return;

    if (e.key === 'Escape') closeLightbox();
    else if (e.key === 'ArrowLeft') lightboxNavigate(-1);
    else if (e.key === 'ArrowRight') lightboxNavigate(1);
});

// Touch swipe on lightbox
(function () {
    const modal = document.getElementById('lightboxModal');
    if (!modal) return;
    let startX = 0;

    modal.addEventListener('touchstart', (e) => {
        startX = e.changedTouches[0].screenX;
    }, { passive: true });

    modal.addEventListener('touchend', (e) => {
        const diff = startX - e.changedTouches[0].screenX;
        if (Math.abs(diff) > 40) lightboxNavigate(diff > 0 ? 1 : -1);
    }, { passive: true });

    // Click outside image closes lightbox
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeLightbox();
    });
})();

// ================================================
// SCROLL TO TOP BUTTON
// ================================================
(function () {
    const btn = document.createElement('button');
    btn.className = 'scroll-to-top';
    btn.setAttribute('aria-label', 'Volver al inicio');
    btn.setAttribute('title', 'Volver al inicio');
    btn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"
             stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polyline points="18 15 12 9 6 15"></polyline>
        </svg>`;
    document.body.appendChild(btn);

    const toggleVisibility = () => {
        btn.classList.toggle('visible', window.scrollY > 400);
    };

    window.addEventListener('scroll', toggleVisibility, { passive: true });
    toggleVisibility();

    btn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: prefersReducedMotion ? 'auto' : 'smooth'
        });
    });
})();

// ================================================
// CONTACT FORM HANDLING
// ================================================
const contactForm = document.getElementById('contactForm');
const formStatus = document.querySelector('.form-status');

if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = contactForm.querySelector('.btn-submit');
        submitBtn.classList.add('loading');
        if (formStatus) {
            formStatus.style.display = 'none';
            formStatus.classList.remove('success', 'error');
        }

        try {
            const formData = new FormData(contactForm);
            const response = await fetch(contactForm.action, {
                method: 'POST',
                body: formData,
                headers: { 'Accept': 'application/json' }
            });

            if (response.ok) {
                if (formStatus) {
                    formStatus.textContent = '¡Mensaje enviado exitosamente! Te responderé pronto.';
                    formStatus.classList.add('success');
                }
                contactForm.reset();
            } else {
                throw new Error('Error en el servidor');
            }
        } catch (error) {
            if (formStatus) {
                formStatus.textContent = 'Hubo un error al enviar el mensaje. Por favor intenta nuevamente.';
                formStatus.classList.add('error');
            }
        } finally {
            submitBtn.classList.remove('loading');
            if (formStatus) formStatus.style.display = 'block';
        }
    });
}
