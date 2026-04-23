document.addEventListener('DOMContentLoaded', function() {
    const currentYearElement = document.getElementById('current-year');
    if (currentYearElement) {
        currentYearElement.textContent = new Date().getFullYear();
    }

    document.querySelectorAll('nav a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    const scrollToTopBtn = document.getElementById('scroll-to-top');
    if (scrollToTopBtn) {
        window.addEventListener('scroll', function() {
            if (window.pageYOffset > 100) {
                scrollToTopBtn.style.display = 'block';
            } else {
                scrollToTopBtn.style.display = 'none';
            }
        });

        scrollToTopBtn.addEventListener('click', function() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    const sections = document.querySelectorAll('section');

    const observerOptions = {
        threshold: 0.1
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    sections.forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(20px)';
        section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(section);
    });

    const themeToggle = document.getElementById('theme-toggle');
    const sunIcon = document.getElementById('sun-icon');
    const moonIcon = document.getElementById('moon-icon');
    const html = document.documentElement;

    const storedTheme = localStorage.getItem('theme');
    const initialTheme = storedTheme === 'dark' || storedTheme === 'light' ? storedTheme : 'light';
    html.setAttribute('data-theme', initialTheme);

    if (themeToggle && sunIcon && moonIcon) {
        if (initialTheme === 'dark') {
            sunIcon.classList.add('hidden');
            moonIcon.classList.remove('hidden');
        } else {
            moonIcon.classList.add('hidden');
            sunIcon.classList.remove('hidden');
        }

        themeToggle.addEventListener('click', () => {
            const current = html.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
            const next = current === 'light' ? 'dark' : 'light';

            html.setAttribute('data-theme', next);
            localStorage.setItem('theme', next);

            if (next === 'dark') {
                sunIcon.classList.add('hidden');
                moonIcon.classList.remove('hidden');
            } else {
                moonIcon.classList.add('hidden');
                sunIcon.classList.remove('hidden');
            }

            updateThemeButtonLabel(currentLang);
        });
    }

    const i18nCache = Object.create(null);
    let currentDictionary = null;
    let languageRequestId = 0;

    function interpolate(template, vars) {
        if (typeof template !== 'string') return template;
        return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, name) => {
            const v = vars && Object.prototype.hasOwnProperty.call(vars, name) ? vars[name] : undefined;
            return v == null ? '' : String(v);
        });
    }

    function safeGet(key) {
        try {
            return localStorage.getItem(key);
        } catch {
            return null;
        }
    }

    function safeSet(key, value) {
        try {
            localStorage.setItem(key, value);
        } catch {
        }
    }

    function t(key, fallback) {
        if (currentDictionary && typeof currentDictionary[key] === 'string') {
            return currentDictionary[key];
        }
        return fallback;
    }

    function showFileProtocolNotice() {
        if (document.getElementById('i18n-file-warning')) return;

        const warning = document.createElement('div');
        warning.id = 'i18n-file-warning';
        warning.setAttribute('role', 'alert');
        warning.style.position = 'fixed';
        warning.style.left = '16px';
        warning.style.right = '16px';
        warning.style.bottom = '16px';
        warning.style.padding = '12px 14px';
        warning.style.borderRadius = '8px';
        warning.style.background = '#fff3cd';
        warning.style.color = '#664d03';
        warning.style.border = '1px solid #ffecb5';
        warning.style.boxShadow = '0 4px 10px rgba(0, 0, 0, 0.12)';
        warning.style.zIndex = '9999';
        warning.style.fontSize = '14px';
        warning.style.lineHeight = '1.4';
        warning.textContent = 'Idioma não carregado em file://. Abra o projeto com Live Server (http://localhost) para usar as traduções JSON.';

        document.body.appendChild(warning);
    }

    function getBasePath() {
        const scriptEl = document.querySelector('script[src$="script.js"]');
        return scriptEl ? scriptEl.getAttribute('src').replace('script.js', '') : '';
    }

    async function loadDictionary(lang) {
        if (i18nCache[lang]) return i18nCache[lang];

        if (location.protocol === 'file:') {
            console.warn('i18n: para carregar lang/*.json via fetch, abra o site com um servidor (ex.: Live Server), não via file://');
        }

        const basePath = getBasePath();
        const res = await fetch(`${basePath}lang/${lang}.json`, { cache: 'no-cache' });
        if (!res.ok) throw new Error(`Falha ao carregar lang/${lang}.json (${res.status})`);
        const dict = await res.json();
        i18nCache[lang] = dict;
        return dict;
    }

    async function applyLanguage(lang) {
        const requestId = ++languageRequestId;
        let dict;
        try {
            dict = await loadDictionary(lang);
        } catch (err) {
            console.error('Erro ao aplicar idioma:', err);
            if (location.protocol === 'file:') showFileProtocolNotice();
            return;
        }

        if (requestId !== languageRequestId) return;

        currentDictionary = dict;
        const vars = { year: new Date().getFullYear() };

        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const raw = dict ? dict[key] : undefined;
            if (typeof raw === 'string') {
                el.textContent = interpolate(raw, vars);
            }
        });

        document.documentElement.lang = lang === 'pt' ? 'pt-BR' : 'en';
        updateFlagOnButton(lang);
        updateThemeButtonLabel(lang);
    }

    const langToggle = document.getElementById('lang-toggle');
    function resolveInitialLanguage() {
        const saved = safeGet('lang');
        if (saved === 'pt' || saved === 'en') return saved;

        const browserLang = (navigator.language || navigator.userLanguage || '').toLowerCase();
        if (browserLang.startsWith('pt')) return 'pt';
        if (browserLang.startsWith('en')) return 'en';

        return 'pt';
    }

    let currentLang = resolveInitialLanguage();
    applyLanguage(currentLang);

    function updateThemeButtonLabel(lang) {
        if (!themeToggle) return;
        const currentTheme = html.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
        const nextKey = currentTheme === 'dark' ? 'ui.theme.switchToLight' : 'ui.theme.switchToDark';
        const fallback = lang === 'pt'
            ? (currentTheme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro')
            : (currentTheme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
        const label = t(nextKey, fallback);
        themeToggle.title = label;
        themeToggle.setAttribute('aria-label', label);
    }

    function updateFlagOnButton(lang) {
        if (!langToggle) return;
        const span = langToggle.querySelector('.flag-text');
        const flag = lang === 'pt' ? '🇧🇷' : '🇺🇸';
        if (span) span.textContent = flag;
        else langToggle.textContent = flag;
        const nextKey = lang === 'pt' ? 'ui.lang.switchToEnglish' : 'ui.lang.switchToPortuguese';
        const fallback = lang === 'pt' ? 'Mudar para inglês' : 'Switch to Portuguese';
        const label = t(nextKey, fallback);
        langToggle.title = label;
        langToggle.setAttribute('aria-label', label);
    }

    updateFlagOnButton(currentLang);
    updateThemeButtonLabel(currentLang);

    async function handleLanguageToggle(event) {
        if (event) event.preventDefault();
            const next = currentLang === 'pt' ? 'en' : 'pt';
            currentLang = next;
            safeSet('lang', next);
            updateFlagOnButton(next);
            await applyLanguage(next);
    }

    if (langToggle) {
        langToggle.addEventListener('click', handleLanguageToggle);
        langToggle.addEventListener('touchend', handleLanguageToggle, { passive: false });
    }

});