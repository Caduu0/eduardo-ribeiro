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
        const toggleScrollBtn = function() {
            if (window.pageYOffset > 100) {
                scrollToTopBtn.style.display = 'block';
            } else {
                scrollToTopBtn.style.display = 'none';
            }
        };
        window.addEventListener('scroll', toggleScrollBtn);
        toggleScrollBtn();

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

    const PROJECT_DEFS = {
        empreenderrh: {
            image: 'img/projects/empreenderrh.png',
            github: 'https://github.com/Caduu0/empreenderrh',
            demo: null,
            i18nPrefix: 'projects.empreenderrh'
        },
        'login-eduardo': {
            image: 'img/projects/loginpage.png',
            github: 'https://github.com/Caduu0/login-eduardo',
            demo: null,
            i18nPrefix: 'projects.loginEduardo'
        },
        projetoandroid: {
            image: 'img/projects/projetoandroid.png',
            github: 'https://github.com/Caduu0/projetoandroid',
            demo: 'https://caduu0.github.io/projetoandroid/',
            i18nPrefix: 'projects.projetoandroid'
        }
    };

    const projectModal = document.getElementById('project-modal');
    let projectModalOpenId = null;
    let modalFocusBeforeOpen = null;
    let carouselIndex = 0;
    let carouselImages = [];

    function syncProjectModalChrome() {
        if (!projectModal) return;
        const closeBtn = projectModal.querySelector('.project-modal__close');
        if (closeBtn) {
            closeBtn.setAttribute('aria-label', t('ui.projectModal.closeLabel', 'Fechar'));
        }
    }

    function setCarouselTransform() {
        if (!projectModal) return;
        const track = projectModal.querySelector('[data-carousel-track]');
        const dots = projectModal.querySelectorAll('.project-modal__carousel-dot');
        if (track) {
            track.style.transform = `translateX(-${carouselIndex * 100}%)`;
        }
        dots.forEach((dot, i) => {
            dot.setAttribute('aria-current', i === carouselIndex ? 'true' : 'false');
        });
    }

    function buildProjectCarousel(images) {
        if (!projectModal) return;
        const track = projectModal.querySelector('[data-carousel-track]');
        const dotsWrap = projectModal.querySelector('[data-carousel-dots]');
        if (!track || !dotsWrap) return;

        carouselImages = images.slice();
        carouselIndex = 0;
        track.innerHTML = '';
        dotsWrap.innerHTML = '';

        const list = carouselImages.length ? carouselImages : [''];

        list.forEach((src) => {
            const slide = document.createElement('div');
            slide.className = 'project-modal__carousel-slide';
            if (src) {
                const img = document.createElement('img');
                img.src = src;
                img.alt = '';
                img.decoding = 'async';
                slide.appendChild(img);
            }
            track.appendChild(slide);
        });

        if (list.length > 1) {
            dotsWrap.hidden = false;
            list.forEach((_, i) => {
                const dot = document.createElement('button');
                dot.type = 'button';
                dot.className = 'project-modal__carousel-dot';
                dot.addEventListener('click', () => {
                    carouselIndex = i;
                    setCarouselTransform();
                });
                dotsWrap.appendChild(dot);
            });
        } else {
            dotsWrap.hidden = true;
        }

        setCarouselTransform();
    }

    function fillProjectModal(id) {
        const def = PROJECT_DEFS[id];
        if (!def || !projectModal) return;

        const prefix = def.i18nPrefix;
        const hero = projectModal.querySelector('[data-hero-bg]');
        if (hero) {
            const safe = def.image.replace(/\\/g, '/').replace(/"/g, '\\"');
            hero.style.setProperty('--pm-hero-image', `url("${safe}")`);
        }

        const setText = (field, key, fb) => {
            const el = projectModal.querySelector(`[data-field="${field}"]`);
            if (el) el.textContent = t(key, fb);
        };

        setText('kicker', `${prefix}.kicker`, '');
        setText('heroTitle', `${prefix}.heroTitle`, '');
        setText('heroLead', `${prefix}.heroLead`, '');
        setText('detailTitle', `${prefix}.detailTitle`, '');
        setText('description', `${prefix}.description`, '');

        const tagsUl = projectModal.querySelector('[data-field="tags"]');
        if (tagsUl) {
            tagsUl.setAttribute('aria-label', t('ui.projectModal.tagsLabel', 'Tecnologias'));
            tagsUl.innerHTML = '';
            const rawTags = t(`${prefix}.tags`, '');
            rawTags.split('|').map(s => s.trim()).filter(Boolean).forEach(text => {
                const li = document.createElement('li');
                li.textContent = text;
                tagsUl.appendChild(li);
            });
        }

        const hasDemo = Boolean(def.demo && String(def.demo).trim());
        const openDemoLabel = t('ui.projectModal.openDemo', 'Abrir projeto');
        const viewRepoLabel = t('ui.projectModal.viewRepo', 'GitHub');

        const ctaDemo = projectModal.querySelector('[data-field="ctaDemo"]');
        const ctaGithub = projectModal.querySelector('[data-field="ctaGithub"]');
        const linkDemo = projectModal.querySelector('[data-field="linkDemo"]');
        const linkGithub = projectModal.querySelector('[data-field="linkGithub"]');

        if (ctaDemo && ctaGithub && linkDemo && linkGithub) {
            ctaGithub.href = def.github;
            linkGithub.href = def.github;
            linkGithub.textContent = viewRepoLabel;
            ctaGithub.textContent = viewRepoLabel;

            ctaGithub.classList.toggle('project-modal__btn--primary', !hasDemo);
            ctaGithub.classList.toggle('project-modal__btn--ghost', hasDemo);
            linkGithub.classList.remove('project-modal__btn--primary');
            linkGithub.classList.add('project-modal__btn--link');

            if (hasDemo) {
                ctaDemo.hidden = false;
                ctaDemo.href = def.demo;
                ctaDemo.textContent = openDemoLabel;
                ctaDemo.classList.add('project-modal__btn--primary');
                ctaDemo.classList.remove('project-modal__btn--ghost');

                linkDemo.hidden = false;
                linkDemo.href = def.demo;
                linkDemo.textContent = openDemoLabel;
                linkDemo.classList.add('project-modal__btn--link');
            } else {
                ctaDemo.hidden = true;
                ctaDemo.removeAttribute('href');
                ctaDemo.textContent = '';

                linkDemo.hidden = true;
                linkDemo.removeAttribute('href');
                linkDemo.textContent = '';
            }
        }

        buildProjectCarousel([def.image]);
        syncProjectModalChrome();
    }

    function openProjectModal(id) {
        if (!projectModal || !PROJECT_DEFS[id]) return;
        modalFocusBeforeOpen = document.activeElement;
        projectModalOpenId = id;
        fillProjectModal(id);
        projectModal.hidden = false;
        projectModal.setAttribute('data-state', 'open');
        document.body.style.overflow = 'hidden';

        const closeBtn = projectModal.querySelector('.project-modal__close');
        if (closeBtn) closeBtn.focus();
    }

    function closeProjectModal() {
        if (!projectModal || !projectModalOpenId) return;
        projectModal.hidden = true;
        projectModal.setAttribute('data-state', 'closed');
        projectModalOpenId = null;
        document.body.style.overflow = '';
        if (modalFocusBeforeOpen && typeof modalFocusBeforeOpen.focus === 'function') {
            modalFocusBeforeOpen.focus();
        }
        modalFocusBeforeOpen = null;
    }

    function onProjectModalKeydown(e) {
        if (e.key === 'Escape' && projectModalOpenId) {
            e.preventDefault();
            closeProjectModal();
        }
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

        document.documentElement.lang = lang === 'pt' ? 'pt-BR' : (lang === 'es' ? 'es' : 'en');
        updateFlagOnButton(lang);
        updateThemeButtonLabel(lang);

        syncProjectModalChrome();
        if (projectModalOpenId) {
            fillProjectModal(projectModalOpenId);
        }
    }

    const langToggle = document.getElementById('lang-toggle');
    function resolveInitialLanguage() {
        const saved = safeGet('lang');
        if (saved === 'pt' || saved === 'en' || saved === 'es') return saved;

        const browserLang = (navigator.language || navigator.userLanguage || '').toLowerCase();
        if (browserLang.startsWith('pt')) return 'pt';
        if (browserLang.startsWith('en')) return 'en';
        if (browserLang.startsWith('es')) return 'es';

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
        
        let flag = '🇧🇷';
        let nextKey = 'ui.lang.switchToEnglish';
        let fallback = 'Mudar para inglês';
        
        if (lang === 'pt') {
            flag = '🇧🇷';
            nextKey = 'ui.lang.switchToEnglish';
            fallback = 'Mudar para inglês';
        } else if (lang === 'en') {
            flag = '🇺🇸';
            nextKey = 'ui.lang.switchToSpanish';
            fallback = 'Switch to Spanish';
        } else if (lang === 'es') {
            flag = '🇪🇸';
            nextKey = 'ui.lang.switchToPortuguese';
            fallback = 'Cambiar a portugués';
        }

        if (span) span.textContent = flag;
        else langToggle.textContent = flag;
        
        const label = t(nextKey, fallback);
        langToggle.title = label;
        langToggle.setAttribute('aria-label', label);
    }

    updateFlagOnButton(currentLang);
    updateThemeButtonLabel(currentLang);

    async function handleLanguageToggle(event) {
        if (event) event.preventDefault();
            let next = 'pt';
            if (currentLang === 'pt') next = 'en';
            else if (currentLang === 'en') next = 'es';
            else if (currentLang === 'es') next = 'pt';
            
            currentLang = next;
            safeSet('lang', next);
            updateFlagOnButton(next);
            await applyLanguage(next);
    }

    if (langToggle) {
        langToggle.addEventListener('click', handleLanguageToggle);
        langToggle.addEventListener('touchend', handleLanguageToggle, { passive: false });
    }

    if (projectModal) {
        syncProjectModalChrome();

        document.querySelectorAll('.project-tile[data-project]').forEach(tile => {
            tile.addEventListener('click', () => {
                const id = tile.getAttribute('data-project');
                if (id) openProjectModal(id);
            });
        });

        const backdrop = projectModal.querySelector('.project-modal__backdrop');
        if (backdrop) {
            backdrop.addEventListener('click', () => closeProjectModal());
        }

        const closeBtn = projectModal.querySelector('.project-modal__close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => closeProjectModal());
        }

        document.addEventListener('keydown', onProjectModalKeydown);
    }

});