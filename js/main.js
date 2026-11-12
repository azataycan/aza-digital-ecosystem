/* =====================================================================
   AZA DIGITAL ECOSYSTEM — скрипты
   Интро · звёздное небо · цифровые горы · живые макеты проектов ·
   окно «Подробнее» с WhatsApp · сообщение в WhatsApp
   ===================================================================== */
(() => {
    'use strict';

    /* ---------- Настройки: номер WhatsApp ---------- */
    const WA_NUMBER = '996507668866';                 // +996 507 66 88 66
    const waLink = (text) => 'https://wa.me/' + WA_NUMBER + (text ? '?text=' + encodeURIComponent(text) : '');

    /* ---------- Утилиты ---------- */
    const root = document.documentElement;
    const $ = (s, el = document) => el.querySelector(s);
    const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
    const lerp = (a, b, t) => a + (b - a) * t;
    const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
    const onReady = [];

    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    if (!location.hash) window.scrollTo(0, 0);

    /* Ссылки WhatsApp с готовым текстом */
    $$('[data-wa]').forEach((a) => { a.href = waLink(a.dataset.wa); });

    const year = $('#year');
    if (year) year.textContent = new Date().getFullYear();

    /* =================================================================
       1. ИНТРО — эмблема рисуется, затем створки расходятся
       ================================================================= */
    const intro = $('#intro');
    const introBar = $('#introBar');
    let opened = false;

    function openSite() {
        if (opened) return;
        opened = true;
        clearTimeout(window.__azaFailsafe);
        if (introBar) introBar.style.setProperty('--p', 1);
        root.classList.remove('is-loading');
        root.classList.add('is-ready');
        if (intro) {
            intro.classList.add('intro--open');
            setTimeout(() => intro.remove(), reduceMotion ? 60 : 1500);
        }
        onReady.forEach((fn) => fn());
        if (location.hash) {
            const target = document.getElementById(location.hash.slice(1));
            if (target) setTimeout(() => target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' }), 400);
        }
    }

    if (intro) {
        const started = performance.now();
        const MIN_TIME = reduceMotion ? 250 : 2500;
        let ready = false;

        const progress = (now) => {
            if (opened) return;
            const k = Math.min(1, (now - started) / MIN_TIME);
            if (introBar) introBar.style.setProperty('--p', (ready ? k : Math.min(k, 0.9)).toFixed(3));
            requestAnimationFrame(progress);
        };
        requestAnimationFrame(progress);

        const fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready.catch(() => {}) : Promise.resolve();
        const pageLoaded = new Promise((r) => (document.readyState === 'complete' ? r() : window.addEventListener('load', r, { once: true })));
        const cap = new Promise((r) => setTimeout(r, 4500));

        Promise.race([Promise.all([fontsReady, pageLoaded]), cap]).then(() => {
            ready = true;
            setTimeout(openSite, Math.max(0, MIN_TIME - (performance.now() - started)));
        });

        intro.addEventListener('click', openSite);
        document.addEventListener('keydown', (e) => {
            if (!opened && ['Escape', 'Enter', ' '].includes(e.key)) openSite();
        });
    } else {
        openSite();
    }

    /* =================================================================
       2. ШАПКА: фон при прокрутке, прогресс, активный пункт, меню
       ================================================================= */
    const header = $('#header');
    const progressBar = $('#progress');
    const heroInner = $('.hero__inner');
    let scrollQueued = false;

    function onScroll() {
        if (scrollQueued) return;
        scrollQueued = true;
        requestAnimationFrame(() => {
            scrollQueued = false;
            const y = window.scrollY;
            if (!menuOpen) header.classList.toggle('is-scrolled', y > 24);
            const max = document.documentElement.scrollHeight - window.innerHeight;
            progressBar.style.setProperty('--progress', max > 0 ? (y / max).toFixed(4) : 0);
            if (heroInner && !reduceMotion && y < window.innerHeight * 1.3) {
                heroInner.style.transform = 'translate3d(0,' + (y * 0.28).toFixed(1) + 'px,0)';
                heroInner.style.opacity = clamp(1 - y / (window.innerHeight * 0.85), 0, 1).toFixed(3);
            }
        });
    }
    window.addEventListener('scroll', onScroll, { passive: true });

    const navLinks = $$('.nav__link');
    const spyTargets = ['top', 'projects', 'ecosystem', 'founder', 'contact'].map((id) => document.getElementById(id)).filter(Boolean);
    const spy = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
            if (!e.isIntersecting) return;
            navLinks.forEach((l) => l.classList.toggle('is-active', l.getAttribute('href') === '#' + e.target.id));
        });
    }, { rootMargin: '-45% 0px -50% 0px' });
    spyTargets.forEach((s) => spy.observe(s));

    const burger = $('#burger');
    const menu = $('#menu');
    let menuOpen = false;

    function setMenu(open) {
        menuOpen = open;
        burger.classList.toggle('is-open', open);
        burger.setAttribute('aria-expanded', String(open));
        burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
        if (open) {
            menu.hidden = false;
            header.classList.add('is-scrolled');
            document.body.style.overflow = 'hidden';
            requestAnimationFrame(() => requestAnimationFrame(() => menu.classList.add('is-open')));
        } else {
            menu.classList.remove('is-open');
            document.body.style.overflow = '';
            setTimeout(() => { if (!menuOpen) menu.hidden = true; }, 380);
            onScroll();
        }
    }
    burger.addEventListener('click', () => setMenu(!menuOpen));
    $$('a', menu).forEach((a) => a.addEventListener('click', () => setMenu(false)));
    window.addEventListener('resize', () => { if (menuOpen && window.innerWidth > 960) setMenu(false); });

    /* =================================================================
       3. ФОН: звёздное небо с созвездиями и падающими звёздами
       ================================================================= */
    const frameTasks = [];
    let rafId = 0;
    function frame(t) {
        if (!document.hidden) frameTasks.forEach((fn) => fn(t));
        rafId = requestAnimationFrame(frame);
    }

    const pointer = { x: -9999, y: -9999, active: false, nx: 0, ny: 0 };
    window.addEventListener('pointermove', (e) => {
        if (e.pointerType !== 'mouse') return;
        pointer.x = e.clientX;
        pointer.y = e.clientY;
        pointer.nx = e.clientX / window.innerWidth - 0.5;
        pointer.ny = e.clientY / window.innerHeight - 0.5;
        pointer.active = true;
    }, { passive: true });
    document.addEventListener('pointerleave', () => { pointer.active = false; });

    (function sky() {
        const canvas = $('#sky');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let w = 0, h = 0, stars = [], nodes = [];
        let shoot = null, nextShoot = 2600;

        function build() {
            const count = Math.round(clamp((w * h) / 5600, 60, 230));
            stars = Array.from({ length: count }, () => ({
                x: Math.random() * w,
                y: Math.random() * h,
                r: Math.random() < 0.08 ? Math.random() * 0.9 + 1.15 : Math.random() * 0.85 + 0.25,
                a: Math.random() * 0.5 + 0.32,
                tw: Math.random() * 1.6 + 0.5,
                ph: Math.random() * Math.PI * 2,
                d: Math.random() * 0.7 + 0.2,
                gold: Math.random() < 0.1,
                px: 0, py: 0,
            }));
            nodes = stars.filter((s, i) => i % 4 === 0);
        }

        function resize() {
            const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
            const nw = window.innerWidth, nh = window.innerHeight;
            const rebuild = Math.abs(nw - w) > 2 || stars.length === 0;
            w = nw; h = nh;
            canvas.width = Math.round(w * dpr);
            canvas.height = Math.round(h * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            if (rebuild) build();
            if (reduceMotion) draw(0);
        }

        function draw(t) {
            ctx.clearRect(0, 0, w, h);
            const sy = window.scrollY;
            for (const s of stars) {
                s.px = s.x;
                s.py = (((s.y - sy * s.d * 0.12) % h) + h) % h;
            }

            const R = Math.min(150, w * 0.16);
            ctx.lineWidth = 0.6;
            for (let i = 0; i < nodes.length; i++) {
                const a = nodes[i];
                for (let j = i + 1; j < nodes.length; j++) {
                    const b = nodes[j];
                    const dx = a.px - b.px, dy = a.py - b.py;
                    const d2 = dx * dx + dy * dy;
                    if (d2 > R * R) continue;
                    const k = 1 - Math.sqrt(d2) / R;
                    let alpha = k * 0.14;
                    if (pointer.active) {
                        const mx = (a.px + b.px) / 2 - pointer.x, my = (a.py + b.py) / 2 - pointer.y;
                        const pd = Math.sqrt(mx * mx + my * my);
                        if (pd < 220) alpha += (1 - pd / 220) * 0.42 * k;
                    }
                    ctx.strokeStyle = 'rgba(77,238,220,' + alpha.toFixed(3) + ')';
                    ctx.beginPath();
                    ctx.moveTo(a.px, a.py);
                    ctx.lineTo(b.px, b.py);
                    ctx.stroke();
                }
            }

            for (const s of stars) {
                const tw = reduceMotion ? 1 : 0.62 + 0.38 * Math.sin(t * 0.001 * s.tw + s.ph);
                ctx.globalAlpha = s.a * tw;
                ctx.fillStyle = s.gold ? '#B9FF55' : '#C8FFF5';
                if (s.r > 1.1) {
                    ctx.beginPath();
                    ctx.arc(s.px, s.py, s.r, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.globalAlpha *= 0.22;
                    ctx.beginPath();
                    ctx.arc(s.px, s.py, s.r * 3.2, 0, Math.PI * 2);
                    ctx.fill();
                } else {
                    ctx.fillRect(s.px - s.r, s.py - s.r, s.r * 2, s.r * 2);
                }
            }
            ctx.globalAlpha = 1;

            if (reduceMotion) return;
            if (!shoot && t > nextShoot) {
                shoot = { x: w * (0.35 + Math.random() * 0.65), y: h * Math.random() * 0.4, vx: -(5 + Math.random() * 3), vy: 2.2 + Math.random() * 1.6, life: 0 };
            }
            if (shoot) {
                shoot.life++;
                shoot.x += shoot.vx;
                shoot.y += shoot.vy;
                const tx = shoot.x - shoot.vx * 16, ty = shoot.y - shoot.vy * 16;
                const fade = Math.max(0, 1 - shoot.life / 60);
                const g = ctx.createLinearGradient(shoot.x, shoot.y, tx, ty);
                g.addColorStop(0, 'rgba(211,255,245,' + fade.toFixed(3) + ')');
                g.addColorStop(1, 'rgba(211,255,245,0)');
                ctx.strokeStyle = g;
                ctx.lineWidth = 1.6;
                ctx.beginPath();
                ctx.moveTo(shoot.x, shoot.y);
                ctx.lineTo(tx, ty);
                ctx.stroke();
                if (shoot.life > 60) { shoot = null; nextShoot = t + 5000 + Math.random() * 7000; }
            }
        }

        resize();
        window.addEventListener('resize', debounce(resize, 150));
        const coarse = !finePointer;
        let skip = false;
        if (reduceMotion) window.addEventListener('scroll', () => draw(0), { passive: true });
        else frameTasks.push((t) => {
            if (coarse) { skip = !skip; if (skip) return; }   // на телефонах ~30 кадров/с — бережём батарею
            draw(t);
        });
    })();

    /* =================================================================
       4. РЕАЛЬНЫЕ ГОРЫ АЛА-ТОО И ЖИВОЙ ЗЕЛЁНЫЙ РАССВЕТ
       Фото является основным пейзажем; Canvas добавляет только свет, искры и параллакс.
       ================================================================= */
    (function terrain() {
        const canvas = $('#terrain');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const heroEl = $('.hero');
        const actions = $('.hero__actions');
        let w = 0, h = 0, last = 0, visible = true, textBottom = 0;
        let motes = [];

        function resize() {
            const r = canvas.getBoundingClientRect();
            const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
            w = r.width;
            h = r.height;
            canvas.width = Math.round(w * dpr);
            canvas.height = Math.round(h * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            textBottom = actions && heroEl
                ? actions.getBoundingClientRect().bottom - heroEl.getBoundingClientRect().top
                : h * 0.58;
            const count = w < 700 ? 13 : 24;
            motes = Array.from({ length: count }, (_, i) => ({
                x: ((i * 73.17) % 100) / 100,
                y: 0.15 + (((i * 37.91) % 70) / 100),
                r: 1 + ((i * 11) % 18) / 10,
                phase: i * 1.71,
                speed: 0.000018 + ((i * 7) % 9) * 0.000003
            }));
            draw(performance.now(), true);
        }

        function draw(t, still) {
            if (!w || !h) return;
            ctx.clearRect(0, 0, w, h);
            const small = w < 700;
            const parallax = finePointer && pointer.active ? pointer.nx * 16 : Math.sin(t * 0.00013) * 8;
            const sunX = w * (small ? 0.77 : 0.79) + parallax;
            const sunY = Math.min(h * 0.82, Math.max(textBottom + 72, h * 0.58));
            const radius = Math.min(w, h) * (small ? 0.34 : 0.30);
            const pulse = still || reduceMotion ? 1 : 0.96 + Math.sin(t * 0.00055) * 0.045;

            // Large soft lime/cyan bloom — it reads as a glowing sun behind the real peaks.
            let glow = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, radius * 1.8);
            glow.addColorStop(0, 'rgba(182,255,70,0.24)');
            glow.addColorStop(0.22, 'rgba(73,255,160,0.16)');
            glow.addColorStop(0.52, 'rgba(0,216,240,0.08)');
            glow.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = glow;
            ctx.fillRect(0, 0, w, h);

            const sunR = Math.min(w, h) * (small ? 0.045 : 0.038) * pulse;
            const sun = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunR * 3.4);
            sun.addColorStop(0, 'rgba(255,255,235,0.92)');
            sun.addColorStop(0.18, 'rgba(198,255,74,0.82)');
            sun.addColorStop(0.42, 'rgba(111,255,91,0.28)');
            sun.addColorStop(1, 'rgba(0,216,240,0)');
            ctx.fillStyle = sun;
            ctx.beginPath();
            ctx.arc(sunX, sunY, sunR * 3.4, 0, Math.PI * 2);
            ctx.fill();

            // A subtle lens flare, not a geometric mountain overlay.
            ctx.save();
            ctx.globalAlpha = 0.16 + (pulse - 0.95) * 1.4;
            ctx.strokeStyle = 'rgba(192,255,118,0.9)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.ellipse(sunX, sunY, sunR * 3.1, sunR * 0.68, -0.20, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();

            // Few slow luminous particles float over the photograph.
            motes.forEach((m) => {
                const drift = still || reduceMotion ? 0 : Math.sin(t * m.speed + m.phase) * 11;
                const x = m.x * w + drift + parallax * 0.25;
                const y = m.y * h + (still || reduceMotion ? 0 : Math.cos(t * m.speed * 1.3 + m.phase) * 7);
                const alpha = 0.16 + (Math.sin(t * m.speed * 2 + m.phase) + 1) * 0.11;
                ctx.fillStyle = 'rgba(195,255,204,' + alpha.toFixed(3) + ')';
                ctx.beginPath();
                ctx.arc(x, y, m.r, 0, Math.PI * 2);
                ctx.fill();
            });
        }

        const io = new IntersectionObserver((entries) => { visible = entries[0].isIntersecting; }, { threshold: 0 });
        io.observe(canvas);
        resize();
        window.addEventListener('resize', debounce(resize, 150));
        if (!reduceMotion) frameTasks.push((t) => { if (visible) draw(t); else last = 0; });
    })();

    if (frameTasks.length) rafId = requestAnimationFrame(frame);

    /* =================================================================
       5. Появление блоков при прокрутке
       ================================================================= */
    const revealObs = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
            if (e.isIntersecting) {
                e.target.classList.add('in');
                revealObs.unobserve(e.target);
            }
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    onReady.push(() => $$('.rv').forEach((el) => revealObs.observe(el)));

    /* =================================================================
       6. ЖИВЫЕ МАКЕТЫ ПРОЕКТОВ — пошаговые сценарии работы
       data-steps — число шагов, data-ms — длительность каждого шага
       data-on="1 2"   — элемент виден на этих шагах
       data-from="3"   — элемент виден начиная с шага
       data-vals / data-texts / data-w / data-h — значения по шагам
       data-tap / data-fly — «касание пальцем» и полёт товара в корзину
       ================================================================= */
    const fmtNumber = (n, fmt) => {
        const s = Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
        if (fmt === 'som') return s + ' с';
        if (fmt === 'pct') return s + '%';
        return s;
    };
    const bump = (el) => { el.classList.remove('is-bump'); void el.offsetWidth; el.classList.add('is-bump'); };
    const parseMap = (str) => {
        const m = new Map();
        str.split(';').forEach((part) => {
            const i = part.indexOf(':');
            if (i > 0) m.set(Number(part.slice(0, i)), part.slice(i + 1).trim());
        });
        return m;
    };

    function setNumber(v, to, quiet) {
        if (v.cur === to) return;
        const from = v.cur === null ? to : v.cur;
        v.cur = to;
        if (quiet || from === to) { v.el.textContent = fmtNumber(to, v.fmt); return; }
        const start = performance.now();
        const dur = 750;
        const tick = (now) => {
            if (v.cur !== to) return;
            const p = Math.min(1, (now - start) / dur);
            const e = 1 - Math.pow(1 - p, 3);
            v.el.textContent = fmtNumber(from + (to - from) * e, v.fmt);
            if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        bump(v.el);
    }

    class Demo {
        constructor(el) {
            this.el = el;
            this.n = Number(el.dataset.steps) || 1;
            this.ms = (el.dataset.ms || '1800').split(',').map(Number);
            this.cycle = el.hasAttribute('data-cycle');
            this.step = 0;
            this.timer = 0;
            this.screen = $('.phone__screen', el);
            const pick = (list, s) => list[Math.min(s, list.length - 1)];
            this.pick = pick;
            this.on = $$('[data-on]', el).map((x) => [x, x.dataset.on.trim().split(/\s+/).map(Number)]);
            this.from = $$('[data-from]', el).map((x) => [x, Number(x.dataset.from)]);
            this.vals = $$('[data-vals]', el).map((x) => ({ el: x, list: x.dataset.vals.split(',').map(Number), fmt: x.dataset.fmt || '', cur: null }));
            this.texts = $$('[data-texts]', el).map((x) => [x, x.dataset.texts.split('|')]);
            this.ws = $$('[data-w]', el).map((x) => [x, x.dataset.w.split(',')]);
            this.hs = $$('[data-h]', el).map((x) => [x, x.dataset.h.split(',')]);
            this.taps = $$('[data-tap]', el).map((x) => [x, parseMap(x.dataset.tap)]);
            this.flies = $$('[data-fly]', el).map((x) => [x, parseMap(x.dataset.fly)]);
            this.set(reduceMotion ? this.n - 1 : 0, true);
        }

        point(sel) {
            const target = $(sel, this.el);
            if (!target || !this.screen) return null;
            const sr = this.screen.getBoundingClientRect();
            const tr = target.getBoundingClientRect();
            if (!sr.width) return null;
            const k = this.screen.offsetWidth / sr.width;
            return { x: (tr.left + tr.width / 2 - sr.left) * k, y: (tr.top + tr.height / 2 - sr.top) * k };
        }

        set(s, instant) {
            const el = this.el;
            const quiet = instant || (s === 0 && !this.cycle);
            this.step = s;
            el.dataset.step = s;
            for (let i = 1; i < this.n; i++) el.classList.toggle('s' + i, s >= i);
            this.on.forEach(([x, list]) => x.classList.toggle('is-on', list.includes(s)));
            this.from.forEach(([x, f]) => x.classList.toggle('is-on', s >= f));
            this.vals.forEach((v) => setNumber(v, this.pick(v.list, s), quiet));
            this.texts.forEach(([x, list]) => {
                const t = this.pick(list, s);
                if (x.textContent !== t) { x.textContent = t; if (!quiet) bump(x); }
            });
            this.ws.forEach(([x, list]) => x.style.setProperty('--w', this.pick(list, s) + '%'));
            this.hs.forEach(([x, list]) => x.style.setProperty('--h', this.pick(list, s) + '%'));

            this.taps.forEach(([x, map]) => {
                const sel = map.get(s);
                if (!sel) { x.classList.remove('is-on', 'is-press'); return; }
                requestAnimationFrame(() => {
                    const p = this.point(sel);
                    if (!p) return;
                    x.style.setProperty('--x', p.x.toFixed(1) + 'px');
                    x.style.setProperty('--y', p.y.toFixed(1) + 'px');
                    x.classList.add('is-on');
                    if (!instant) { x.classList.remove('is-press'); void x.offsetWidth; x.classList.add('is-press'); }
                });
            });

            if (!instant) {
                this.flies.forEach(([x, map]) => {
                    const spec = map.get(s);
                    if (!spec || !x.animate) return;
                    const [fromSel, toSel] = spec.split('=>');
                    requestAnimationFrame(() => {
                        const a = this.point(fromSel.trim());
                        const b = this.point(toSel.trim());
                        if (!a || !b) return;
                        x.animate([
                            { transform: 'translate(' + a.x + 'px,' + a.y + 'px) scale(1)', opacity: 1 },
                            { transform: 'translate(' + ((a.x + b.x) / 2) + 'px,' + (Math.min(a.y, b.y) - 50) + 'px) scale(.85)', opacity: 1, offset: 0.55 },
                            { transform: 'translate(' + b.x + 'px,' + b.y + 'px) scale(.3)', opacity: 0 },
                        ], { duration: 850, delay: 380, easing: 'cubic-bezier(.5,0,.3,1)', fill: 'both' });
                    });
                });
            }
        }

        play() {
            if (this.timer || reduceMotion) return;
            this.schedule();
        }

        schedule() {
            const ms = this.ms[this.step] || this.ms[this.ms.length - 1];
            this.timer = setTimeout(() => {
                this.set((this.step + 1) % this.n);
                this.schedule();
            }, ms);
        }

        pause() {
            clearTimeout(this.timer);
            this.timer = 0;
        }
    }

    const demos = $$('.demo').map((el) => {
        const d = new Demo(el);
        el.__demo = d;
        return d;
    });
    const demoObs = new IntersectionObserver((entries) => {
        entries.forEach((e) => (e.isIntersecting ? e.target.__demo.play() : e.target.__demo.pause()));
    }, { threshold: 0.35 });
    onReady.push(() => demos.forEach((d) => demoObs.observe(d.el)));

    /* Наклон макета за курсором и «магнитные» кнопки (только мышь) */
    if (finePointer && !reduceMotion) {
        $$('.project__stage').forEach((stage) => {
            const device = $('.win, .phone', stage);
            if (!device) return;
            stage.addEventListener('pointermove', (e) => {
                const r = stage.getBoundingClientRect();
                const px = (e.clientX - r.left) / r.width - 0.5;
                const py = (e.clientY - r.top) / r.height - 0.5;
                device.style.setProperty('--ry', (px * 9).toFixed(2) + 'deg');
                device.style.setProperty('--rx', (-py * 7).toFixed(2) + 'deg');
                device.style.setProperty('--lift', '-6px');
            });
            stage.addEventListener('pointerleave', () => {
                device.style.setProperty('--ry', '0deg');
                device.style.setProperty('--rx', '0deg');
                device.style.setProperty('--lift', '0px');
            });
        });
        $$('[data-magnetic]').forEach((btn) => {
            btn.addEventListener('pointermove', (e) => {
                const r = btn.getBoundingClientRect();
                const x = e.clientX - r.left - r.width / 2;
                const y = e.clientY - r.top - r.height / 2;
                btn.style.transform = 'translate(' + (x * 0.16).toFixed(1) + 'px,' + (y * 0.22).toFixed(1) + 'px)';
            });
            btn.addEventListener('pointerleave', () => { btn.style.transform = ''; });
        });
    }

    if (reduceMotion) $$('svg').forEach((s) => { if (s.pauseAnimations) s.pauseAnimations(); });

    /* =================================================================
       7. ОКНО «ПОДРОБНЕЕ» — WhatsApp основателя
       ================================================================= */
    const modal = $('#modal');
    const dialog = $('.modal__dialog', modal);
    let lastFocus = null;

    function openModal(card, trigger) {
        const name = $('.project__name', card).textContent.trim();
        const kind = $('.project__kind', card).textContent.trim();
        const tag = $('.tag', card);
        const mTag = $('#mTag');
        $('#mTitle').textContent = name;
        $('#mKind').textContent = kind;
        mTag.textContent = tag.textContent.trim();
        mTag.className = tag.className;
        $('#mText').textContent = $('.project__text', card).textContent.trim();
        $('#mIcon').setAttribute('href', '#' + (card.dataset.icon || 'i-spark'));
        dialog.style.setProperty('--tone', getComputedStyle(card).getPropertyValue('--tone').trim());

        const message = 'Здравствуйте, Азамат! Меня интересует проект ' + name + ' — ' + kind + '.';
        $('#mWa').href = waLink(message);
        $('#mNum').href = waLink(message);

        lastFocus = trigger;
        modal.hidden = false;
        const tr = trigger.getBoundingClientRect();
        const dr = dialog.getBoundingClientRect();
        dialog.style.setProperty('--ox', (tr.left + tr.width / 2 - dr.left).toFixed(0) + 'px');
        dialog.style.setProperty('--oy', (tr.top + tr.height / 2 - dr.top).toFixed(0) + 'px');
        document.body.style.overflow = 'hidden';
        requestAnimationFrame(() => requestAnimationFrame(() => modal.classList.add('is-open')));
        setTimeout(() => $('#mWa').focus({ preventScroll: true }), 80);
    }

    function closeModal() {
        if (modal.hidden) return;
        modal.classList.remove('is-open');
        document.body.style.overflow = '';
        setTimeout(() => { if (!modal.classList.contains('is-open')) modal.hidden = true; }, 480);
        if (lastFocus) lastFocus.focus({ preventScroll: true });
    }

    $$('[data-more]').forEach((btn) => btn.addEventListener('click', () => openModal(btn.closest('.project'), btn)));
    $$('[data-close]', modal).forEach((el) => el.addEventListener('click', closeModal));
    document.addEventListener('keydown', (e) => {
        if (menuOpen && e.key === 'Escape') { setMenu(false); return; }
        if (modal.hidden) return;
        if (e.key === 'Escape') { closeModal(); return; }
        if (e.key === 'Tab') {
            const items = $$('a[href], button:not([disabled])', dialog);
            const first = items[0], lastItem = items[items.length - 1];
            if (e.shiftKey && document.activeElement === first) { e.preventDefault(); lastItem.focus(); }
            else if (!e.shiftKey && document.activeElement === lastItem) { e.preventDefault(); first.focus(); }
        }
    });

    /* =================================================================
       8. Копирование номера и уведомление
       ================================================================= */
    const toastEl = $('#toast');
    let toastTimer = 0;
    function toast(text) {
        toastEl.textContent = text;
        toastEl.classList.add('is-on');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toastEl.classList.remove('is-on'), 2600);
    }

    $$('[data-copy]').forEach((btn) => btn.addEventListener('click', async () => {
        const text = btn.dataset.copy;
        let ok = false;
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
                ok = true;
            }
        } catch (err) { ok = false; }
        if (!ok) {
            try {
                const ta = document.createElement('textarea');
                ta.value = text;
                ta.setAttribute('readonly', '');
                ta.style.cssText = 'position:fixed;left:-9999px;opacity:0';
                document.body.appendChild(ta);
                ta.select();
                ok = document.execCommand('copy');
                ta.remove();
            } catch (err) { ok = false; }
        }
        toast(ok ? 'Номер скопирован: ' + text : 'Номер WhatsApp: ' + text);
    }));

    /* =================================================================
       9. Сообщение в WhatsApp — собираем текст из формы
       ================================================================= */
    const form = $('#composer');
    if (form) {
        const send = $('#composerSend');
        const note = $('#composerNote');
        const nameIn = $('[name="name"]', form);
        const topicIn = $('[name="topic"]', form);
        const msgIn = $('[name="message"]', form);
        const defaultNote = note.textContent;

        const build = () => {
            const lines = ['Здравствуйте, Азамат!'];
            const name = nameIn.value.trim();
            const msg = msgIn.value.trim();
            if (name) lines.push('Меня зовут ' + name + '.');
            lines.push('Тема: ' + topicIn.value);
            if (msg) lines.push(msg);
            return lines.join('\n');
        };
        const update = () => { send.href = waLink(build()); };
        const validate = () => {
            const missing = [nameIn, msgIn].filter((f) => !f.value.trim());
            missing.forEach((f) => f.closest('.field').classList.add('is-invalid'));
            if (missing.length) {
                note.textContent = 'Укажите имя и сообщение — они попадут в текст для WhatsApp.';
                note.classList.add('is-error');
                missing[0].focus();
                return false;
            }
            return true;
        };

        form.addEventListener('input', (e) => {
            update();
            const field = e.target.closest('.field');
            if (field) field.classList.remove('is-invalid');
            if (!$('.field.is-invalid', form)) {
                note.classList.remove('is-error');
                note.textContent = defaultNote;
            }
        });
        form.addEventListener('change', update);
        send.addEventListener('click', (e) => { if (!validate()) e.preventDefault(); else update(); });
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            if (validate()) { update(); send.click(); }
        });
        update();
    }

    onScroll();
})();
