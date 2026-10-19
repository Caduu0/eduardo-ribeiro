document.addEventListener('DOMContentLoaded', function () {
    const html = document.documentElement;
    const reduceMotion = Boolean(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

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

    const currentYearElement = document.getElementById('current-year');
    if (currentYearElement) {
        currentYearElement.textContent = new Date().getFullYear();
    }

    /* ---------- navegação por âncoras ---------- */
    document.querySelectorAll('nav a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const hash = this.getAttribute('href');
            const target = document.querySelector(hash);
            if (!target) return;
            e.preventDefault();
            target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
            if (window.history && history.pushState) history.pushState(null, '', hash);
            target.setAttribute('tabindex', '-1');
            target.focus({ preventScroll: true });
        });
    });

    /* ---------- botão voltar ao topo ---------- */
    const scrollToTopBtn = document.getElementById('scroll-to-top');
    if (scrollToTopBtn) {
        const toggleScrollBtn = function () {
            scrollToTopBtn.style.display = window.pageYOffset > 100 ? 'block' : 'none';
        };
        window.addEventListener('scroll', toggleScrollBtn, { passive: true });
        toggleScrollBtn();

        scrollToTopBtn.addEventListener('click', function () {
            window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
        });
    }

    /* ---------- revelar seções ao rolar ---------- */
    const revealEls = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver(function (entries, obs) {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.05, rootMargin: '0px 0px -5% 0px' });
        revealEls.forEach(el => observer.observe(el));
    } else {
        revealEls.forEach(el => el.classList.add('is-visible'));
    }

    /* ---------- tema ---------- */
    const themeToggle = document.getElementById('theme-toggle');
    const sunIcon = document.getElementById('sun-icon');
    const moonIcon = document.getElementById('moon-icon');

    const storedTheme = safeGet('theme');
    const prefersDark = Boolean(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    const initialTheme = storedTheme === 'dark' || storedTheme === 'light'
        ? storedTheme
        : (prefersDark ? 'dark' : 'light');
    html.setAttribute('data-theme', initialTheme);

    function syncThemeIcons(theme) {
        if (!sunIcon || !moonIcon) return;
        sunIcon.classList.toggle('hidden', theme === 'dark');
        moonIcon.classList.toggle('hidden', theme !== 'dark');
    }

    if (themeToggle) {
        syncThemeIcons(initialTheme);
        themeToggle.addEventListener('click', () => {
            const current = html.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
            const next = current === 'light' ? 'dark' : 'light';
            html.setAttribute('data-theme', next);
            safeSet('theme', next);
            syncThemeIcons(next);
            updateThemeButtonLabel(currentLang);
        });
    }

    /* ---------- i18n ---------- */
    const i18nCache = Object.create(null);
    let currentDictionary = null;
    let languageRequestId = 0;

    function revealPage() {
        html.classList.remove('i18n-pending');
    }

    function interpolate(template, vars) {
        if (typeof template !== 'string') return template;
        return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, name) => {
            const v = vars && Object.prototype.hasOwnProperty.call(vars, name) ? vars[name] : undefined;
            return v == null ? '' : String(v);
        });
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
        warning.textContent = 'Idioma não carregado em file://. Abra o projeto com Live Server (http://localhost) para usar as traduções JSON.';
        document.body.appendChild(warning);
    }

    function getBasePath() {
        const scriptEl = document.querySelector('script[src$="script.js"]');
        return scriptEl ? scriptEl.getAttribute('src').replace('script.js', '') : '';
    }

    async function loadDictionary(lang) {
        if (i18nCache[lang]) return i18nCache[lang];
        const basePath = getBasePath();
        const res = await fetch(`${basePath}lang/${lang}.json`, { cache: 'no-cache' });
        if (!res.ok) throw new Error(`Falha ao carregar lang/${lang}.json (${res.status})`);
        const dict = await res.json();
        i18nCache[lang] = dict;
        return dict;
    }

    /* ---------- projetos ---------- */
    const PROJECT_DEFS = {
        /* Modpacks (CurseForge) */
        allthosetech: {
            image: 'img/projects/all-those-tech.webp?v=2',
            demo: 'https://www.curseforge.com/minecraft/modpacks/all-those-tech',
            demoLabel: 'ui.projectModal.viewCurseforge',
            i18nPrefix: 'projects.allThoseTech'
        },
        arcana: {
            image: 'img/projects/arcana.webp?v=2',
            demo: 'https://www.curseforge.com/minecraft/modpacks/arcana-by-caduu',
            demoLabel: 'ui.projectModal.viewCurseforge',
            i18nPrefix: 'projects.arcana'
        },
        minecolonies: {
            image: 'img/projects/minecolonies.webp?v=2',
            demo: 'https://www.curseforge.com/minecraft/modpacks/minecolonies-order-and-chaos',
            demoLabel: 'ui.projectModal.viewCurseforge',
            i18nPrefix: 'projects.minecolonies'
        },
        allthosetweaks: {
            image: 'img/projects/all-those-tweaks.webp?v=2',
            demo: 'https://www.curseforge.com/minecraft/mc-mods/all-those-tweaks',
            demoLabel: 'ui.projectModal.viewCurseforge',
            i18nPrefix: 'projects.allThoseTweaks'
        },
        todolist: {
            image: 'img/projects/todolist.webp',
            github: 'https://github.com/Caduu0/CaduList',
            demo: 'https://imgur.com/a/aFEokhN',
            i18nPrefix: 'projects.todolist'
        },
        empreenderrh: {
            image: 'img/projects/empreenderrh.webp',
            github: 'https://github.com/Caduu0/empreenderrh',
            demo: 'https://imgur.com/a/77umusW',
            i18nPrefix: 'projects.empreenderrh'
        },
        'login-eduardo': {
            image: 'img/projects/loginpage.webp',
            github: 'https://github.com/Caduu0/login-eduardo',
            demo: 'https://imgur.com/a/g72197i',
            i18nPrefix: 'projects.loginEduardo'
        },
        projetoandroid: {
            image: 'img/projects/projetoandroid.webp',
            github: 'https://github.com/Caduu0/projetoandroid',
            demo: 'https://caduu0.github.io/projetoandroid/',
            i18nPrefix: 'projects.projetoandroid'
        }
    };

    /* ---------- clientes ---------- */
    const CLIENT_DEFS = {
        'asa-sports': { name: 'Asa Sports', url: 'https://asasports.com.br/', platform: 'shopify', visitKey: 'clients.modal.visitSports', extraUrl: 'https://asauniformes.com.br/', info: true },
        'bine-baby': { name: 'Bine Baby', url: 'https://www.binebaby.com.br/', platform: 'magazord', info: false },
        'body-action': { name: 'Body Action', url: 'https://www.bodyaction.com.br/', platform: 'shopify', info: true },
        'bordados-vitoria': { name: 'Bordados Vitória', url: 'https://lojavirtual.bordadosvitoria.com.br/', platform: 'magazord', info: false },
        'camaleoa-plus-size': { name: 'Camaleoa Plus Size', url: 'https://camaleoaplussize.com.br/', platform: 'shopify', info: false },
        'cunhados-truck': { name: 'Cunhados Truck Center', url: 'https://www.cunhadostruckcenter.com.br/', platform: 'magazord', info: true },
        'ewerline': { name: 'Ewerline', url: 'https://www.ewerline.com.br/', platform: 'magazord', info: false },
        'extreme-nutrition': { name: 'Extreme Nutrition', url: 'https://www.extremenutrition.com.br/', platform: 'magazord', info: true },
        'ferla': { name: 'Ferla', url: 'https://useferla.com.br/', platform: 'shopify', info: false },
        'gimara': { name: 'Gimara', url: 'https://www.gimara.com.br/', platform: 'magazord', info: true },
        'ilha-da-beleza': { name: 'Ilha da Beleza', url: 'https://ilhadabeleza.com.br/', platform: 'shopify', info: true },
        'mega-nutrition': { name: 'Mega Nutrition', url: 'https://meganutrition.com.br/', platform: 'shopify', info: false },
        'qooqi': { name: 'Qooqi Decor', url: 'https://www.qooqi.com.br/', platform: 'magazord', info: true },
        'thotal-basic': { name: 'Thotal Basic', url: 'https://www.thotalbasic.com.br/', platform: 'magazord', info: false },
        'richee-store': { name: 'Richée Store', bn: 'Richée', url: 'https://richeestore.com.br/', platform: 'shopify', info: false },
        'vice-brand': { name: 'Vice Brand', bn: 'Vice', url: 'https://vicebrand.com.br/', platform: 'shopify', info: false },
        'vivar-kids': { name: 'Vivar Kids', url: 'https://www.vivarkids.com.br/', platform: 'magazord', info: false }
    };

    const PLATFORM_NAMES = { shopify: 'Shopify', magazord: 'Magazord' };

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

    function buildProjectCarousel(images, altText) {
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
                img.alt = altText || '';
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
                dot.setAttribute('aria-label', `${t('ui.projectModal.slide', 'Imagem')} ${i + 1}`);
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
        const hasGithub = Boolean(def.github && String(def.github).trim());
        const demoLabel = t(def.demoLabel || 'ui.projectModal.openDemo', 'Abrir projeto');
        const repoLabel = t('ui.projectModal.viewRepo', 'GitHub');

        const ctaDemo = projectModal.querySelector('[data-field="ctaDemo"]');
        const ctaGithub = projectModal.querySelector('[data-field="ctaGithub"]');
        const linkDemo = projectModal.querySelector('[data-field="linkDemo"]');
        const linkGithub = projectModal.querySelector('[data-field="linkGithub"]');
        const heroCta = projectModal.querySelector('.project-modal__hero-cta');
        const linksSection = projectModal.querySelector('[data-section="links"]');

        function setLink(el, show, href, label) {
            if (!el) return;
            el.hidden = !show;
            if (show) {
                el.href = href;
                el.textContent = label;
            } else {
                el.removeAttribute('href');
                el.textContent = '';
            }
        }

        setLink(ctaDemo, hasDemo, def.demo, demoLabel);
        setLink(linkDemo, hasDemo, def.demo, demoLabel);
        setLink(ctaGithub, hasGithub, def.github, repoLabel);
        setLink(linkGithub, hasGithub, def.github, repoLabel);

        if (ctaDemo) {
            ctaDemo.classList.add('project-modal__btn--primary');
            ctaDemo.classList.remove('project-modal__btn--ghost');
        }
        if (ctaGithub) {
            ctaGithub.classList.toggle('project-modal__btn--primary', !hasDemo);
            ctaGithub.classList.toggle('project-modal__btn--ghost', hasDemo);
        }

        const hasAnyLink = hasDemo || hasGithub;
        if (heroCta) heroCta.hidden = !hasAnyLink;
        if (linksSection) linksSection.hidden = !hasAnyLink;

        buildProjectCarousel([def.image], t(`${prefix}.heroTitle`, ''));
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
        if (!projectModalOpenId) return;
        if (e.key === 'Escape') {
            e.preventDefault();
            closeProjectModal();
            return;
        }
        if (e.key === 'Tab') {
            const focusables = Array.from(projectModal.querySelectorAll('a[href], button:not([disabled])'))
                .filter(el => !el.hidden && el.offsetParent !== null);
            if (!focusables.length) return;
            const first = focusables[0];
            const last = focusables[focusables.length - 1];
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            } else if (!projectModal.contains(document.activeElement)) {
                e.preventDefault();
                first.focus();
            }
        }
    }

    /* ---------- modal de cliente ---------- */
    const clientModal = document.getElementById('client-modal');
    let clientModalOpenId = null;
    let clientFocusBeforeOpen = null;

    let bannerFontsLoaded = false;
    function loadBannerFonts() {
        if (bannerFontsLoaded) return;
        bannerFontsLoaded = true;
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://fonts.googleapis.com/css2?family=Archivo:wght@800&family=Barlow+Condensed:ital,wght@1,800&family=Bricolage+Grotesque:wght@500;800&family=Cormorant+Garamond:ital,wght@1,500&family=Fredoka:wght@600&family=Jost:wght@300;400&family=Montserrat:wght@800&family=Outfit:wght@500;600&family=Pinyon+Script&family=Playfair+Display:ital,wght@1,600&family=Poppins:ital,wght@1,800&family=Rethink+Sans:wght@800&display=swap';
        document.head.appendChild(link);
    }

    function fillClientModal(id) {
        const def = CLIENT_DEFS[id];
        if (!def || !clientModal) return;
        const f = name => clientModal.querySelector(`[data-field="${name}"]`);
        const key = `clients.${id}`;

        f('name').textContent = def.name;
        const logo = f('logo');
        logo.src = `img/clients/${id}.webp`;

        const segment = t(`${key}.segment`, '');
        loadBannerFonts();
        const banner = f('banner');
        banner.className = `cb cb--${id}`;
        f('bannerName').textContent = def.bn || def.name;
        f('bannerTag').textContent = segment;
        f('segment').textContent = '';
        f('segment').hidden = true;
        f('desc').textContent = def.info ? t(`${key}.desc`, '') : t('clients.generic.desc', '');

        const platRow = f('platformRow');
        platRow.hidden = !def.platform;
        f('platform').textContent = def.platform ? PLATFORM_NAMES[def.platform] : '';

        const visit = f('visit');
        if (def.url) {
            visit.href = def.url;
            visit.textContent = t(def.visitKey || 'clients.modal.visit', 'Abrir loja') + ' \u2197';
            visit.hidden = false;
        } else {
            visit.hidden = true;
            visit.removeAttribute('href');
        }

        const visit2 = f('visit2');
        if (def.extraUrl) {
            visit2.href = def.extraUrl;
            visit2.textContent = t('clients.modal.visitUniformes', 'Abrir Asa Uniformes') + ' \u2197';
            visit2.hidden = false;
        } else {
            visit2.hidden = true;
            visit2.removeAttribute('href');
        }

        const closeBtn = clientModal.querySelector('.client-modal__close');
        if (closeBtn) closeBtn.setAttribute('aria-label', t('ui.projectModal.closeLabel', 'Fechar'));
    }

    function openClientModal(id) {
        if (!clientModal || !CLIENT_DEFS[id]) return;
        clientFocusBeforeOpen = document.activeElement;
        clientModalOpenId = id;
        fillClientModal(id);
        clientModal.hidden = false;
        clientModal.setAttribute('data-state', 'open');
        document.body.style.overflow = 'hidden';
        const closeBtn = clientModal.querySelector('.client-modal__close');
        if (closeBtn) closeBtn.focus();
    }

    function closeClientModal() {
        if (!clientModal || !clientModalOpenId) return;
        clientModal.hidden = true;
        clientModal.setAttribute('data-state', 'closed');
        clientModalOpenId = null;
        document.body.style.overflow = '';
        if (clientFocusBeforeOpen && typeof clientFocusBeforeOpen.focus === 'function') clientFocusBeforeOpen.focus();
        clientFocusBeforeOpen = null;
    }

    function onClientModalKeydown(e) {
        if (!clientModalOpenId) return;
        if (e.key === 'Escape') {
            e.preventDefault();
            closeClientModal();
            return;
        }
        if (e.key === 'Tab') {
            const focusables = Array.from(clientModal.querySelectorAll('a[href], button:not([disabled])'))
                .filter(el => !el.hidden && el.offsetParent !== null);
            if (!focusables.length) return;
            const first = focusables[0];
            const last = focusables[focusables.length - 1];
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if ((!e.shiftKey && document.activeElement === last) || !clientModal.contains(document.activeElement)) {
                e.preventDefault();
                first.focus();
            }
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
            revealPage();
            return;
        }

        if (requestId !== languageRequestId) return;

        currentDictionary = dict;
        const vars = { year: new Date().getFullYear() };

        document.querySelectorAll('[data-i18n]').forEach(el => {
            const raw = dict[el.getAttribute('data-i18n')];
            if (typeof raw === 'string') el.textContent = interpolate(raw, vars);
        });

        [['data-i18n-aria', 'aria-label'], ['data-i18n-alt', 'alt'], ['data-i18n-title', 'title'], ['data-i18n-content', 'content']]
            .forEach(([dataAttr, attr]) => {
                document.querySelectorAll(`[${dataAttr}]`).forEach(el => {
                    const raw = dict[el.getAttribute(dataAttr)];
                    if (typeof raw === 'string') el.setAttribute(attr, interpolate(raw, vars));
                });
            });

        html.lang = lang === 'pt' ? 'pt-BR' : (lang === 'es' ? 'es' : 'en');
        updateFlagOnButton(lang);
        updateThemeButtonLabel(lang);

        syncProjectModalChrome();
        if (projectModalOpenId) {
            fillProjectModal(projectModalOpenId);
        }
        if (clientModalOpenId) {
            fillClientModal(clientModalOpenId);
        }
        revealPage();
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

        if (lang === 'en') {
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
    applyLanguage(currentLang);

    async function handleLanguageToggle(event) {
        if (event) event.preventDefault();
        const order = { pt: 'en', en: 'es', es: 'pt' };
        const next = order[currentLang] || 'pt';
        currentLang = next;
        safeSet('lang', next);
        updateFlagOnButton(next);
        await applyLanguage(next);
    }

    if (langToggle) {
        langToggle.addEventListener('click', handleLanguageToggle);
    }

    /* ---------- imprimir currículo ---------- */
    const printBtn = document.getElementById('print-btn');
    if (printBtn) {
        printBtn.addEventListener('click', () => window.print());
    }

    /* ---------- modal de projeto ---------- */
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

        document.querySelectorAll('.client-logo[data-client]').forEach(btn => {
            btn.addEventListener('click', () => openClientModal(btn.dataset.client));
            btn.addEventListener('pointerenter', loadBannerFonts, { once: true });
        });
        if (clientModal) {
            const cb = clientModal.querySelector('.client-modal__backdrop');
            if (cb) cb.addEventListener('click', () => closeClientModal());
            const cx = clientModal.querySelector('.client-modal__close');
            if (cx) cx.addEventListener('click', () => closeClientModal());
            document.addEventListener('keydown', onClientModalKeydown);
        }
    }
});
