// Beamer-like navigation logic
(() => {
    const slides = Array.from(document.querySelectorAll('.slide'));
    const total = slides.length;
    const pageNumSpan = document.getElementById('page-num');
    let index = 0;

    // Initialize from hash if present
    if (location.hash) {
        const hashIndex = parseInt(location.hash.replace('#/', '')) - 1;
        if (!isNaN(hashIndex) && hashIndex >= 0 && hashIndex < total) {
            index = hashIndex;
        }
    }

    const showSlide = (n) => {
        // Clamp index
        if (n >= total) index = total - 1;
        else if (n < 0) index = 0;
        else index = n;

        // Update classes
        slides.forEach((slide, i) => {
            if (i === index) {
                slide.classList.add('active');
            } else {
                slide.classList.remove('active');
            }
        });

        // Update page number
        if (pageNumSpan) {
            pageNumSpan.textContent = index + 1;
        }

        // Update URL hash
        history.replaceState(null, '', `#/${index + 1}`);
    };

    // Expose navigation functions to global scope for buttons
    window.prevSlide = () => showSlide(index - 1);
    window.nextSlide = () => showSlide(index + 1);

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
            showSlide(index + 1);
        } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
            showSlide(index - 1);
        } else if (e.key === 'Home') {
            showSlide(0);
        } else if (e.key === 'End') {
            showSlide(total - 1);
        }
    });

    // Initial show
    showSlide(index);
})();
