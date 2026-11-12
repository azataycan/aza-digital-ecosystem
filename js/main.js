/* ============================================
   AZA Digital Ecosystem — скрипты
   Меню, прокрутка, анимации, счётчики, форма
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

    /* ---------- Текущий год в подвале ---------- */
    document.getElementById('year').textContent = new Date().getFullYear();

    /* ---------- Шапка при прокрутке ---------- */
    const header = document.getElementById('header');
    const onScroll = () => {
        header.classList.toggle('header--scrolled', window.scrollY > 20);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    /* ---------- Мобильное меню ---------- */
    const burger = document.getElementById('burger');
    const nav = document.getElementById('nav');

    burger.addEventListener('click', () => {
        const isOpen = nav.classList.toggle('nav--open');
        burger.classList.toggle('burger--open', isOpen);
        burger.setAttribute('aria-expanded', isOpen);
    });

    // Закрываем меню при клике на ссылку
    nav.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            nav.classList.remove('nav--open');
            burger.classList.remove('burger--open');
            burger.setAttribute('aria-expanded', 'false');
        });
    });

    /* ---------- Появление блоков при прокрутке ---------- */
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('reveal--visible');
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12 });

    document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

    /* ---------- Анимированные счётчики ---------- */
    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;

            const el = entry.target;
            const target = +el.dataset.count;
            const suffix = el.dataset.suffix || '';
            const duration = 1600;
            const start = performance.now();

            const tick = (now) => {
                const progress = Math.min((now - start) / duration, 1);
                // Плавное замедление к концу
                const eased = 1 - Math.pow(1 - progress, 3);
                el.textContent = Math.round(target * eased) + suffix;
                if (progress < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
            counterObserver.unobserve(el);
        });
    }, { threshold: 0.6 });

    document.querySelectorAll('.stat__value').forEach(el => counterObserver.observe(el));

    /* ---------- Форма обратной связи ---------- */
    const form = document.getElementById('contactForm');
    const status = document.getElementById('formStatus');

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const name = form.name.value.trim();
        const email = form.email.value.trim();
        const message = form.message.value.trim();
        const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        // Сброс ошибок
        [form.name, form.email, form.message].forEach(f => f.classList.remove('error'));

        if (!name || !emailRe.test(email) || !message) {
            if (!name) form.name.classList.add('error');
            if (!emailRe.test(email)) form.email.classList.add('error');
            if (!message) form.message.classList.add('error');
            status.textContent = 'Пожалуйста, заполните все поля корректно.';
            status.className = 'form__status form__status--err';
            return;
        }

        // Здесь подключите реальную отправку (fetch на ваш API или сервис форм)
        status.textContent = 'Спасибо, ' + name + '! Ваше сообщение отправлено.';
        status.className = 'form__status form__status--ok';
        form.reset();
    });

    /* ---------- Модальные окна проектов (для презентации) ---------- */
    const projectsData = {
        'aza-pay': {
            title: 'AZA Pay',
            category: 'Финтех',
            description: 'Платформа цифровых платежей: мгновенные переводы, виртуальные и физические карты, оплата услуг, split-платежи и аналитика расходов. Единый кошелёк работает во всех сервисах экосистемы.',
            tech: ['React Native', 'Node.js', 'PostgreSQL', 'PCI DSS'],
            results: [
                'Запуск MVP за 6 месяцев',
                '1M+ зарегистрированных пользователей',
                '500K+ транзакций ежемесячно'
            ]
        },
        'aza-market': {
            title: 'AZA Market',
            category: 'E-commerce',
            description: 'Маркетплейс с фокусом на локальные бренды: персональные рекомендации, интеграция с AZA Pay и AZA Delivery, кабинет продавца с аналитикой.',
            tech: ['Next.js', 'Python', 'Elasticsearch', 'Docker'],
            results: [
                '2 000+ продавцов на платформе',
                'Средняя доставка — 2 дня по стране',
                'Рост конверсии на 34% после редизайна'
            ]
        },
        'aza-delivery': {
            title: 'AZA Delivery',
            category: 'Логистика',
            description: 'Сервис экспресс-доставки с собственным курьерским пулом и алгоритмами маршрутизации в реальном времени.',
            tech: ['Flutter', 'Go', 'Redis', 'Google Maps API'],
            results: [
                'Доставка за 60 минут в 3 городах',
                '12K+ заказов в день',
                'Рейтинг курьеров 4.8 из 5'
            ]
        },
        'aza-cloud': {
            title: 'AZA Cloud',
            category: 'B2B / Облака',
            description: 'Облачная платформа для бизнеса: виртуальные серверы, объектное хранилище, Kubernetes и биллинг с почасовой оплатой.',
            tech: ['Kubernetes', 'Terraform', 'Prometheus', 'Ceph'],
            results: [
                '99.9% доступности за 12 месяцев',
                '150+ корпоративных клиентов',
                'Данные размещены в локальных ЦОД'
            ]
        },
        'aza-academy': {
            title: 'AZA Academy',
            category: 'EdTech',
            description: 'Образовательная платформа: интерактивные курсы цифровых профессий, тренажёры с проверкой кода и корпоративное обучение.',
            tech: ['Vue.js', 'Django', 'WebSocket', 'PostgreSQL'],
            results: [
                '40+ курсов и 120K учеников',
                'Выпускники трудоустроены на 78%',
                'Партнёрство с 30+ компаниями'
            ]
        },
        'aza-gov': {
            title: 'AZA Gov',
            category: 'GovTech',
            description: 'Цифровые госуслуги: подача заявлений, цифровые документы и запись к специалистам — без визитов и очередей.',
            tech: ['React', 'Java Spring', 'OpenAPI', 'ЭЦП'],
            results: [
                '30+ услуг переведено в онлайн',
                'Время оформления сокращено с 3 дней до 15 минут',
                'Интеграция с государственными реестрами'
            ]
        }
    };

    const modal = document.getElementById('projectModal');

    const openModal = (key) => {
        const p = projectsData[key];
        if (!p) return;
        document.getElementById('modalCategory').textContent = p.category;
        document.getElementById('modalTitle').textContent = p.title;
        document.getElementById('modalDescription').textContent = p.description;

        document.getElementById('modalTech').innerHTML =
            p.tech.map(t => '<span>' + t + '</span>').join('');

        document.getElementById('modalResults').innerHTML =
            p.results.map(r => '<li>' + r + '</li>').join('');

        modal.classList.add('modal--open');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    };

    const closeModal = () => {
        modal.classList.remove('modal--open');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    };

    document.querySelectorAll('[data-project]').forEach(btn => {
        btn.addEventListener('click', () => openModal(btn.dataset.project));
    });

    modal.querySelectorAll('[data-modal-close]').forEach(el => {
        el.addEventListener('click', closeModal);
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('modal--open')) closeModal();
    });

});
