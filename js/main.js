// ================================================
// Mobile Menu Toggle
// ================================================
const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
const navLinks = document.querySelector('.nav-links');

if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', () => {
        mobileMenuToggle.classList.toggle('active');
        navLinks.classList.toggle('active');
        
        // Prevent body scroll when menu is open
        if (navLinks.classList.contains('active')) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
    });
    
    // Close menu when clicking on a link
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            mobileMenuToggle.classList.remove('active');
            navLinks.classList.remove('active');
            document.body.style.overflow = 'auto';
        });
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!navLinks.contains(e.target) && !mobileMenuToggle.contains(e.target)) {
            mobileMenuToggle.classList.remove('active');
            navLinks.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    });
}

// ================================================
// Smooth scroll
// ================================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

// ================================================
// Scroll animations (IntersectionObserver)
// ================================================
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
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
window.addEventListener('scroll', () => {
    let current = '';
    const sections = document.querySelectorAll('section[id]');
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        if (pageYOffset >= sectionTop - 200) {
            current = section.getAttribute('id');
        }
    });

    document.querySelectorAll('.nav-links a').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href').slice(1) === current) {
            link.classList.add('active');
        }
    });
});

// ================================================
// CAROUSEL — automático + manual
// Usa el índice del elemento en el DOM como ID único,
// así no importa qué valor tenga data-carousel.
// ================================================
let currentSlides = {};
let autoTimers = {};
let carouselElements = []; // referencia directa a cada .carousel-slides

const AUTOPLAY_DELAY = 3000;

document.addEventListener('DOMContentLoaded', () => {
    // Recopilar todos los carousels por orden de aparición
    document.querySelectorAll('.carousel-slides').forEach((el, index) => {
        carouselElements[index] = el;
        currentSlides[index] = 0;
        startAutoplay(index);
    });

    // Generar los dots dinámicamente según la cantidad real de slides
    carouselElements.forEach((carousel, index) => {
        const slides = carousel.querySelectorAll('.carousel-slide');
        const dotsContainer = carousel.parentElement.querySelector('.carousel-dots');
        if (!dotsContainer) return;

        // Limpiar dots existentes (por si el HTML tiene una cantidad incorrecta)
        dotsContainer.innerHTML = '';

        slides.forEach((_, i) => {
            const dot = document.createElement('span');
            dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
            dot.addEventListener('click', () => goToSlide(index, i));
            dotsContainer.appendChild(dot);
        });
    });

    // Reapuntar los botones prev/next de cada carousel al índice correcto
    document.querySelectorAll('.project-carousel').forEach((carouselWrapper, index) => {
        const prevBtn = carouselWrapper.querySelector('.carousel-nav.prev');
        const nextBtn = carouselWrapper.querySelector('.carousel-nav.next');

        if (prevBtn) {
            prevBtn.removeAttribute('onclick');
            prevBtn.addEventListener('click', () => changeSlide(index, -1));
        }
        if (nextBtn) {
            nextBtn.removeAttribute('onclick');
            nextBtn.addEventListener('click', () => changeSlide(index, 1));
        }
    });

    // Click en imágenes → lightbox
    document.querySelectorAll('.carousel-slide img').forEach((img) => {
        const slidesEl = img.closest('.carousel-slides');
        const carouselIndex = carouselElements.indexOf(slidesEl);
        const slideIndex = Array.from(slidesEl.querySelectorAll('.carousel-slide'))
            .indexOf(img.closest('.carousel-slide'));

        img.addEventListener('click', () => {
            openLightbox(carouselIndex, slideIndex);
        });
    });
});

// ------------------------------------------------
// Autoplay
// ------------------------------------------------
function startAutoplay(carouselIndex) {
    if (autoTimers[carouselIndex]) {
        clearInterval(autoTimers[carouselIndex]);
    }
    autoTimers[carouselIndex] = setInterval(() => {
        changeSlide(carouselIndex, 1, false);
    }, AUTOPLAY_DELAY);
}

function resetAutoplay(carouselIndex) {
    if (autoTimers[carouselIndex]) {
        clearInterval(autoTimers[carouselIndex]);
    }
    startAutoplay(carouselIndex);
}

// ------------------------------------------------
// Cambio de slide
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

    if (resetTimer) {
        resetAutoplay(carouselIndex);
    }
}

function goToSlide(carouselIndex, slideIndex) {
    currentSlides[carouselIndex] = slideIndex;
    updateCarousel(carouselIndex);
    resetAutoplay(carouselIndex);
}

function updateCarousel(carouselIndex) {
    const carousel = carouselElements[carouselIndex];
    if (!carousel) return;

    const dots = carousel.parentElement.querySelectorAll('.carousel-dot');

    carousel.style.transform = `translateX(-${currentSlides[carouselIndex] * 100}%)`;

    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === currentSlides[carouselIndex]);
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
    document.getElementById('lightboxModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    document.getElementById('lightboxModal').classList.remove('active');
    document.body.style.overflow = 'auto';
}

function lightboxNavigate(direction) {
    currentLightboxIndex += direction;

    if (currentLightboxIndex < 0) {
        currentLightboxIndex = lightboxImages.length - 1;
    } else if (currentLightboxIndex >= lightboxImages.length) {
        currentLightboxIndex = 0;
    }

    updateLightboxImage();
}

function updateLightboxImage() {
    document.getElementById('lightboxImage').src = lightboxImages[currentLightboxIndex];
    document.getElementById('lightboxCounter').textContent =
        `${currentLightboxIndex + 1} / ${lightboxImages.length}`;
}

// Teclado: ESC cierra, arrows navegan lightbox
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeLightbox();
    } else if (e.key === 'ArrowLeft') {
        lightboxNavigate(-1);
    } else if (e.key === 'ArrowRight') {
        lightboxNavigate(1);
    }
});

// Click fuera de la imagen cierra el lightbox
document.getElementById('lightboxModal').addEventListener('click', (e) => {
    if (e.target.id === 'lightboxModal') {
        closeLightbox();
    }
});

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
        formStatus.style.display = 'none';
        formStatus.classList.remove('success', 'error');
        
        try {
            const formData = new FormData(contactForm);
            const response = await fetch(contactForm.action, {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            if (response.ok) {
                formStatus.textContent = '¡Mensaje enviado exitosamente! Te responderé pronto.';
                formStatus.classList.add('success');
                contactForm.reset();
            } else {
                throw new Error('Error al enviar el formulario');
            }
        } catch (error) {
            formStatus.textContent = 'Hubo un error al enviar el mensaje. Por favor intenta nuevamente.';
            formStatus.classList.add('error');
        } finally {
            submitBtn.classList.remove('loading');
            formStatus.style.display = 'block';
        }
    });
}