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
       4. ЦИФРОВЫЕ ГОРЫ (Тянь-Шань) и рассвет на главном экране
       ================================================================= */
    function makeNoise(seed) {
        const perm = new Uint8Array(512);
        const p = Array.from({ length: 256 }, (_, i) => i);
        let s = seed;
        const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
        for (let i = 255; i > 0; i--) {
            const j = Math.floor(rnd() * (i + 1));
            [p[i], p[j]] = [p[j], p[i]];
        }
        for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
        const grad = (hsh, x, y) => {
            switch (hsh & 3) {
                case 0: return x + y;
                case 1: return -x + y;
                case 2: return x - y;
                default: return -x - y;
            }
        };
        const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
        return (x, y) => {
            const xi = Math.floor(x), yi = Math.floor(y);
            const X = xi & 255, Y = yi & 255;
            x -= xi; y -= yi;
            const u = fade(x), v = fade(y);
            const a = perm[X] + Y, b = perm[X + 1] + Y;
            return lerp(
                lerp(grad(perm[a], x, y), grad(perm[b], x - 1, y), u),
                lerp(grad(perm[a + 1], x, y - 1), grad(perm[b + 1], x - 1, y - 1), u),
                v
            );
        };
    }

    (function terrain() {
        const canvas = $('#terrain');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const noise = makeNoise(20020526);
        const SPAN = 10, Z0 = 2.2, DZ = 0.85;
        const cam = { x: 0, y: 0 };
        const heroEl = $('.hero');
        const actions = $('.hero__actions');
        let w = 0, h = 0, cols = 48, rows = 30, travel = 0, last = 0, visible = true;
        let textBottom = 0, leftAmp = 0.45;
        let pts = new Float32Array(0), prev = new Float32Array(0);

        function height(x, z) {
            const rel = x - 1.6;
            const side = Math.min(1, Math.abs(rel) / SPAN);
            const valley = 0.1 + Math.pow(side, 1.3) * (rel < 0 ? leftAmp : 1.2);
            let n = 0, amp = 1, f = 0.16, sum = 0;
            for (let o = 0; o < 4; o++) {
                const v = 1 - Math.abs(noise(x * f + 7.3, z * f));
                n += v * v * amp;
                sum += amp;
                amp *= 0.5;
                f *= 2.05;
            }
            return (n / sum) * valley * 4.3;
        }

        function resize() {
            const r = canvas.getBoundingClientRect();
            const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
            w = r.width; h = r.height;
            canvas.width = Math.round(w * dpr);
            canvas.height = Math.round(h * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            const small = w < 700;
            cols = small ? 30 : 48;
            rows = small ? 24 : 30;
            leftAmp = w < 900 ? 0.8 : 0.42;
            textBottom = actions && heroEl ? actions.offsetTop + actions.offsetHeight + (actions.offsetParent === heroEl ? 0 : actions.offsetParent.offsetTop) : h * 0.6;
            pts = new Float32Array(cols * 2);
            prev = new Float32Array(cols * 2);
            draw(performance.now(), true);
        }

        function draw(t, still) {
            if (!w || !h) return;
            const dt = last ? Math.min(64, t - last) : 16;
            last = t;
            if (!still && !reduceMotion) travel += dt * 0.00055;

            const small = w < 700;
            const targetX = finePointer && pointer.active ? pointer.nx * 1.6 : Math.sin(t * 0.00022) * 0.9;
            const targetY = finePointer && pointer.active ? pointer.ny * -0.35 : 0;
            cam.x = lerp(cam.x, targetX, 0.035);
            cam.y = lerp(cam.y, targetY, 0.035);

            const horizon = w < 900
                ? Math.max(textBottom + 34, h * 0.6)
                : clamp(textBottom - 40, h * 0.58, h * 0.74);
            const focal = Math.max(w, h * 1.1) * 0.62;
            const camY = 1.75 + cam.y;
            ctx.clearRect(0, 0, w, h);

            // Солнце на горизонте
            const sunX = w * (small ? 0.68 : 0.72) - cam.x * 18;
            const sunY = horizon + 6;
            const big = Math.max(w, h);
            let g = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, big * 0.6);
            g.addColorStop(0, 'rgba(67,255,190,0.38)');
            g.addColorStop(0.16, 'rgba(0,216,240,0.22)');
            g.addColorStop(0.45, 'rgba(32,150,130,0.08)');
            g.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, w, h);
            const sr = Math.min(w, h) * (small ? 0.075 : 0.06);
            g = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sr);
            g.addColorStop(0, 'rgba(235,255,250,1)');
            g.addColorStop(0.55, 'rgba(178,255,92,0.92)');
            g.addColorStop(1, 'rgba(0,216,240,0)');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(sunX, sunY, sr, 0, Math.PI * 2);
            ctx.fill();

            // Ряды гор — от дальних к ближним
            const off = travel % DZ;
            const base = travel - off;
            let hasPrev = false;
            for (let i = rows - 1; i >= 0; i--) {
                const z = Z0 + i * DZ - off;
                const wz = base + Z0 + i * DZ;
                const depth = i / (rows - 1);
                let minY = Infinity;
                for (let k = 0; k < cols; k++) {
                    const x = -SPAN + (2 * SPAN * k) / (cols - 1);
                    const y = height(x, wz);
                    pts[k * 2] = w / 2 + ((x - cam.x) * focal) / z;
                    const py = horizon + ((camY - y) * focal) / z;
                    pts[k * 2 + 1] = py;
                    if (py < minY) minY = py;
                }
                const near = 1 - depth;
                const warm = Math.pow(depth, 1.3) * 0.9;
                const cr = Math.round(lerp(38, 155, warm));
                const cg = Math.round(lerp(232, 255, warm));
                const cb = Math.round(lerp(242, 92, warm));
                const edge = depth > 0.92 ? (1 - depth) / 0.08 : 1;

                if (minY < h + 40) {
                    if (hasPrev) {
                        ctx.strokeStyle = 'rgba(' + cr + ',' + cg + ',' + cb + ',' + ((0.05 + 0.3 * Math.pow(near, 1.2)) * edge).toFixed(3) + ')';
                        ctx.lineWidth = 0.6;
                        ctx.beginPath();
                        for (let k = 0; k < cols; k++) {
                            ctx.moveTo(pts[k * 2], pts[k * 2 + 1]);
                            ctx.lineTo(prev[k * 2], prev[k * 2 + 1]);
                        }
                        ctx.stroke();
                    }
                    ctx.beginPath();
                    ctx.moveTo(pts[0], pts[1]);
                    for (let k = 1; k < cols; k++) ctx.lineTo(pts[k * 2], pts[k * 2 + 1]);
                    ctx.lineTo(pts[(cols - 1) * 2], h + 20);
                    ctx.lineTo(pts[0], h + 20);
                    ctx.closePath();
                    ctx.fillStyle = 'rgb(3,14,19)';
                    ctx.fill();

                    ctx.beginPath();
                    ctx.moveTo(pts[0], pts[1]);
                    for (let k = 1; k < cols; k++) ctx.lineTo(pts[k * 2], pts[k * 2 + 1]);
                    ctx.strokeStyle = 'rgba(' + cr + ',' + cg + ',' + cb + ',' + ((0.14 + 0.6 * Math.pow(near, 0.8)) * edge).toFixed(3) + ')';
                    ctx.lineWidth = 0.7 + near * 1.1;
                    ctx.stroke();
                }
                prev.set(pts);
                hasPrev = true;
            }
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
