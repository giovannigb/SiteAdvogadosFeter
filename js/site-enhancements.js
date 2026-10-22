(function () {
    'use strict';

    var consentKey = 'feterAnalyticsConsent';
    var banner = document.querySelector('[data-privacy-banner]');
    var menuButton = document.querySelector('.s-header__trigger');
    var menuOverlay = document.querySelector('.js__bg-overlay');
    var stickyHeader = document.querySelector('.js__header-sticky');
    var backToTop = document.querySelector('.s-back-to-top');
    var testimonialCarousel = document.querySelector('[data-testimonial-carousel]');
    var experience = document.getElementById('tempoAtuacao');
    var whatsappForm = document.querySelector('[data-whatsapp-form]');
    var metricsEnabled = false;
    var menuReturnFocus = null;
    var privacyReturnFocus = null;

    function setMenuState(isOpen, restoreFocus) {
        if (!menuButton || !menuOverlay) return;

        menuOverlay.classList.toggle('-is-open', isOpen);
        if (stickyHeader) stickyHeader.classList.toggle('-is-open', isOpen);
        menuButton.classList.toggle('-is-active', isOpen);
        menuButton.setAttribute('aria-expanded', String(isOpen));
        menuButton.setAttribute('aria-label', isOpen ? 'Fechar menu' : 'Abrir menu');
        menuOverlay.setAttribute('aria-hidden', String(!isOpen));
        document.body.classList.toggle('menu-open', isOpen);

        if (isOpen) {
            menuReturnFocus = document.activeElement;
            menuOverlay.removeAttribute('inert');
            var firstLink = menuOverlay.querySelector('a');
            if (firstLink) window.setTimeout(function () { firstLink.focus(); }, 100);
        } else {
            menuOverlay.setAttribute('inert', '');
            if (restoreFocus && menuReturnFocus) menuReturnFocus.focus();
            menuReturnFocus = null;
        }
    }

    function menuIsOpen() {
        return Boolean(menuOverlay && menuOverlay.classList.contains('-is-open'));
    }

    function updateScrollState() {
        var isScrolled = window.scrollY > 15;
        if (stickyHeader) stickyHeader.classList.toggle('s-header__shrink', isScrolled);
        if (backToTop) {
            backToTop.classList.toggle('-is-visible', window.scrollY > 300);
            backToTop.classList.toggle('-zoom-out', window.scrollY > 1200);
        }
    }

    function loadScript(src, id) {
        if (id && document.getElementById(id)) return;
        var script = document.createElement('script');
        script.async = true;
        script.src = src;
        if (id) script.id = id;
        document.head.appendChild(script);
    }

    function enableMetrics() {
        window.dataLayer = window.dataLayer || [];
        window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
        window.gtag('js', new Date());
        window.gtag('config', 'G-G6Q49DM8S7');
        window.gtag('config', 'AW-405070178');
        loadScript('https://www.googletagmanager.com/gtag/js?id=G-G6Q49DM8S7', 'feter-google-tag');

        if (!window.fbq) {
            var fbq = window.fbq = function () {
                fbq.callMethod ? fbq.callMethod.apply(fbq, arguments) : fbq.queue.push(arguments);
            };
            if (!window._fbq) window._fbq = fbq;
            fbq.push = fbq;
            fbq.loaded = true;
            fbq.version = '2.0';
            fbq.queue = [];
            loadScript('https://connect.facebook.net/pt_BR/fbevents.js', 'feter-meta-pixel');
            fbq('init', '627375711891858');
            fbq('track', 'PageView');
        }

        loadScript(
            'https://d335luupugsy2.cloudfront.net/js/loader-scripts/5739bca4-a4e8-47a2-9c5f-14ccf55226a8-loader.js',
            'feter-rd-station'
        );

        metricsEnabled = true;
    }

    function sendMetric(name, parameters) {
        if (!metricsEnabled || !window.gtag) return;
        window.gtag('event', name, parameters || {});
    }

    function currentPracticeArea() {
        var areaTitle = document.querySelector('.area-hero h1');
        return areaTitle ? areaTitle.textContent.trim() : '';
    }

    function practiceAreaFromLink(link) {
        var cardTitle = link.closest('.practice-card');

        if (cardTitle) {
            var heading = cardTitle.querySelector('h3');
            if (heading) return heading.textContent.replace(/\s+/g, ' ').trim();
        }

        if (link.classList.contains('area-related__card')) {
            var relatedTitle = link.querySelector('span');
            if (relatedTitle) return relatedTitle.textContent.trim();
        }

        return '';
    }

    function whatsappLocation(link) {
        if (link.classList.contains('area-card__button')) return 'area_sidebar';
        if (link.classList.contains('area-whatsapp')) return 'area_floating_button';
        if (link.classList.contains('whatsapp-fab')) return 'home_floating_button';
        return 'link';
    }

    function trackWhatsAppLead(location, area) {
        sendMetric('generate_lead', {
            contact_method: 'whatsapp',
            cta_location: location,
            practice_area: area || 'geral'
        });

        if (metricsEnabled && window.fbq) {
            window.fbq('track', 'Lead', {
                content_name: area || location
            });
        }
    }

    function handleMenuKeydown(event) {
        if (!menuIsOpen()) return;

        if (event.key === 'Escape') {
            event.preventDefault();
            setMenuState(false, true);
            return;
        }

        if (event.key !== 'Tab') return;

        var overlayItems = Array.prototype.slice.call(
            menuOverlay.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')
        );
        var focusableItems = [menuButton].concat(overlayItems);
        var firstItem = focusableItems[0];
        var lastItem = focusableItems[focusableItems.length - 1];

        if (event.shiftKey && document.activeElement === firstItem) {
            event.preventDefault();
            lastItem.focus();
        } else if (!event.shiftKey && document.activeElement === lastItem) {
            event.preventDefault();
            firstItem.focus();
        }
    }

    function initTestimonialCarousel() {
        if (!testimonialCarousel) return;

        var slides = Array.prototype.slice.call(testimonialCarousel.querySelectorAll('[data-testimonial-slide]'));
        var previousButton = testimonialCarousel.querySelector('[data-testimonial-previous]');
        var nextButton = testimonialCarousel.querySelector('[data-testimonial-next]');
        var status = testimonialCarousel.querySelector('[data-testimonial-status]');
        var currentIndex = 0;

        function showSlide(index) {
            currentIndex = (index + slides.length) % slides.length;
            slides.forEach(function (slide, slideIndex) {
                slide.hidden = slideIndex !== currentIndex;
            });
            if (status) status.textContent = String(currentIndex + 1) + ' de ' + String(slides.length);
        }

        if (previousButton) {
            previousButton.addEventListener('click', function () {
                showSlide(currentIndex - 1);
            });
        }

        if (nextButton) {
            nextButton.addEventListener('click', function () {
                showSlide(currentIndex + 1);
            });
        }

        testimonialCarousel.addEventListener('keydown', function (event) {
            if (event.key === 'ArrowLeft') showSlide(currentIndex - 1);
            if (event.key === 'ArrowRight') showSlide(currentIndex + 1);
        });

        showSlide(0);
    }

    function readConsent() {
        try {
            return window.localStorage.getItem(consentKey);
        } catch (error) {
            return null;
        }
    }

    function saveConsent(value) {
        try {
            window.localStorage.setItem(consentKey, value);
        } catch (error) {
            // O banner continua funcional mesmo quando o navegador bloqueia armazenamento local.
        }
    }

    function showBanner(moveFocus, trigger) {
        if (!banner) return;
        privacyReturnFocus = trigger || null;
        banner.hidden = false;
        if (moveFocus) {
            var firstButton = banner.querySelector('button');
            if (firstButton) firstButton.focus();
        }
    }

    function hideBanner(restoreFocus) {
        if (banner) banner.hidden = true;
        if (restoreFocus && privacyReturnFocus) privacyReturnFocus.focus();
        privacyReturnFocus = null;
    }

    if (experience) {
        experience.textContent = String(new Date().getFullYear() - 1996);
    }

    if (whatsappForm) {
        whatsappForm.addEventListener('submit', function (event) {
            event.preventDefault();
            if (!whatsappForm.reportValidity()) return;

            var data = new FormData(whatsappForm);
            var name = String(data.get('name') || '').trim();
            var area = String(data.get('area') || '').trim();
            var summary = String(data.get('summary') || '').trim();
            var message = 'Olá! Meu nome é ' + name + '. Gostaria de atendimento sobre ' + area + '.';

            if (summary) {
                message += '\n\nResumo: ' + summary;
            }

            trackWhatsAppLead('home_contact_form', area);

            window.open('https://wa.me/5551985187304?text=' + encodeURIComponent(message), '_blank', 'noopener,noreferrer');
        });
    }

    document.addEventListener('click', function (event) {
        var target = event.target;
        var link = target && target.closest ? target.closest('a') : null;
        if (!link) return;

        var href = link.getAttribute('href') || '';

        if (href.indexOf('wa.me/') !== -1) {
            trackWhatsAppLead(whatsappLocation(link), currentPracticeArea());
        }

        if (link.matches('.practice-link, .area-related__card')) {
            sendMetric('select_content', {
                content_type: 'practice_area',
                item_id: practiceAreaFromLink(link) || href,
                link_url: link.href
            });
        }
    });

    if (menuButton && menuOverlay) {
        menuButton.addEventListener('click', function () {
            setMenuState(!menuIsOpen(), menuIsOpen());
        });
        document.querySelectorAll('.s-header__nav-menu .js__trigger').forEach(function (link) {
            link.addEventListener('click', function () {
                setMenuState(false, false);
            });
        });
        menuOverlay.addEventListener('click', function (event) {
            if (event.target === menuOverlay) setMenuState(false, true);
        });
        document.addEventListener('keydown', handleMenuKeydown);
        setMenuState(false, false);
    }

    if (stickyHeader || backToTop) {
        updateScrollState();
        window.addEventListener('scroll', updateScrollState, { passive: true });
    }

    initTestimonialCarousel();

    document.querySelectorAll('[data-privacy-settings]').forEach(function (button) {
        button.addEventListener('click', function () {
            showBanner(true, button);
        });
    });

    if (banner) {
        banner.querySelector('[data-privacy-accept]').addEventListener('click', function () {
            saveConsent('accepted');
            hideBanner(true);
            enableMetrics();
        });

        banner.querySelector('[data-privacy-decline]').addEventListener('click', function () {
            saveConsent('declined');
            hideBanner(true);
        });
    }

    var consent = readConsent();
    if (consent === 'accepted') {
        enableMetrics();
    } else if (consent !== 'declined') {
        showBanner(false);
    }
}());
