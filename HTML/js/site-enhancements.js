(function () {
    'use strict';

    var consentKey = 'feterAnalyticsConsent';
    var banner = document.querySelector('[data-privacy-banner]');
    var menuButton = document.querySelector('.s-header__trigger');
    var experience = document.getElementById('tempoAtuacao');

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
