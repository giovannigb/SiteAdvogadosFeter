(function () {
    'use strict';

    var consentKey = 'feterAnalyticsConsent';
    var banner = document.querySelector('[data-privacy-banner]');
    var menuButton = document.querySelector('.s-header__trigger');
    var experience = document.getElementById('tempoAtuacao');
    var whatsappForm = document.querySelector('[data-whatsapp-form]');
    var metricsEnabled = false;

    function setMenuState() {
        if (!menuButton) return;
        var overlay = document.querySelector('.js__bg-overlay');
        var isOpen = overlay && overlay.classList.contains('-is-open');
        menuButton.setAttribute('aria-expanded', String(isOpen));
        menuButton.setAttribute('aria-label', isOpen ? 'Fechar menu' : 'Abrir menu');
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

    function showBanner(moveFocus) {
        if (!banner) return;
        banner.hidden = false;
        if (moveFocus) {
            var firstButton = banner.querySelector('button');
            if (firstButton) firstButton.focus();
        }
    }

    function hideBanner() {
        if (banner) banner.hidden = true;
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

    if (menuButton) {
        menuButton.addEventListener('click', function () {
            window.setTimeout(setMenuState, 0);
        });
        document.querySelectorAll('.s-header__nav-menu .js__trigger').forEach(function (link) {
            link.addEventListener('click', function () {
                window.setTimeout(setMenuState, 0);
            });
        });
    }

    document.querySelectorAll('[data-privacy-settings]').forEach(function (button) {
        button.addEventListener('click', function () {
            showBanner(true);
        });
    });

    if (banner) {
        banner.querySelector('[data-privacy-accept]').addEventListener('click', function () {
            saveConsent('accepted');
            hideBanner();
            enableMetrics();
        });

        banner.querySelector('[data-privacy-decline]').addEventListener('click', function () {
            saveConsent('declined');
            hideBanner();
        });
    }

    var consent = readConsent();
    if (consent === 'accepted') {
        enableMetrics();
    } else if (consent !== 'declined') {
        showBanner(false);
    }
}());
