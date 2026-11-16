/* ==========================================================================
   LUMINA | CUCINA SENSORIALE - MOTORE INTERATTIVO (js/main.js)
   Architettura: Preload RAM, Mobile Drawer, Carta a Tab, Booking Smart & Orbis Telemetry
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

    /* ==========================================================================
       0. ORBIS PRIVACY-FIRST ANALYTICS ENGINE (Zero Cookie • Zero IP • GDPR-Free)
       ========================================================================== */
    const ORBIS_ANALYTICS = (() => {
        const ENDPOINT = 'https://smith-anchor-untoasted.ngrok-free.dev/api/v1/analytics/hit';
        const SITE_ID = document.body.getAttribute('data-orbis-site') || 'lumina-cucina';
        const DWELL_MS = 2000; // Soglia minima di permanenza visiva (2 secondi)
        const trackedSessionKeys = new Set();

        function sendPulse(eventType, targetId, label = '') {
            if (!SITE_ID || !targetId) return;
            const params = new URLSearchParams({
                site_id: SITE_ID,
                event_type: eventType,
                target_id: targetId
            });
            if (label) params.set('label', label);

            const url = `${ENDPOINT}?${params.toString()}`;
            try {
                fetch(url, {
                    method: 'POST',
                    keepalive: true,
                    headers: { 'ngrok-skip-browser-warning': 'true' }
                }).catch(() => {});
            } catch (_) {
                if (navigator.sendBeacon) navigator.sendBeacon(url);
            }
        }

        function trackPageView(pageName) {
            const cleanPage = (pageName || window.location.pathname.split('/').pop() || 'index.html').trim();
            const dedupKey = `orbis_pv_${SITE_ID}_${cleanPage}`;
            if (sessionStorage.getItem(dedupKey)) return;
            sessionStorage.setItem(dedupKey, '1');
            sendPulse('page_view', cleanPage);
        }

        function observeScrollSections() {
            const sections = document.querySelectorAll('section[id], [data-orbis-section]');
            if (!sections.length || !('IntersectionObserver' in window)) return;

            const activeTimers = new Map();
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    const secId = entry.target.getAttribute('data-orbis-section') || entry.target.id;
                    if (!secId) return;

                    if (entry.isIntersecting) {
                        if (trackedSessionKeys.has(`sec_${secId}`) || activeTimers.has(secId)) return;
                        const timerId = setTimeout(() => {
                            trackedSessionKeys.add(`sec_${secId}`);
                            activeTimers.delete(secId);
                            sendPulse('section_view', secId);
                        }, DWELL_MS);
                        activeTimers.set(secId, timerId);
                    } else if (activeTimers.has(secId)) {
                        clearTimeout(activeTimers.get(secId));
                        activeTimers.delete(secId);
                    }
                });
            }, { threshold: 0.35 });

            sections.forEach(sec => observer.observe(sec));
        }

        function bindClickTracking() {
            document.addEventListener('click', (e) => {
                const virtualPageEl = e.target.closest('[data-orbis-page]');
                if (virtualPageEl) {
                    trackPageView(virtualPageEl.getAttribute('data-orbis-page'));
                }

                const trackEl = e.target.closest('[data-orbis-track]');
                if (trackEl) {
                    const trackId = trackEl.getAttribute('data-orbis-track');
                    const trackLabel = trackEl.getAttribute('data-orbis-label') || trackEl.textContent.trim().slice(0, 60);
                    sendPulse('track_click', trackId, trackLabel);
                }
            });
        }

        return {
            init() {
                trackPageView();
                observeScrollSections();
                bindClickTracking();
            },
            trackCustom(trackId, label) {
                sendPulse('track_click', trackId, label);
            }
        };
    })();

    ORBIS_ANALYTICS.init();

    /* ==========================================================================
       1. PRECARICAMENTO SILENZIOSO IMMAGINI IN RAM
       ========================================================================== */
    const immaginiPreload = [
        'img/sfondo-hero.jpg',
        'img/filosofia.jpg',
        'img/piatto1.jpg',
        'img/piatto2.jpg',
        'img/piatto3.jpg'
    ];

    immaginiPreload.forEach(src => {
        const img = new Image();
        img.src = src;
    });

    /* ==========================================================================
       2. GESTIONE NAVBAR ALLO SCROLL
       ========================================================================== */
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 40) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }, { passive: true });

    /* ==========================================================================
       3. HAMBURGER MENU & MOBILE DRAWER
       ========================================================================== */
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const mobileDrawer = document.getElementById('mobile-drawer');
    const mobileLinks = document.querySelectorAll('.mobile-link');

    function toggleMobileMenu() {
        const isOpen = mobileDrawer.classList.toggle('open');
        hamburgerBtn.classList.toggle('active', isOpen);
        document.body.classList.toggle('no-scroll', isOpen);
    }

    function closeMobileMenu() {
        mobileDrawer.classList.remove('open');
        hamburgerBtn.classList.remove('active');
        document.body.classList.remove('no-scroll');
    }

    if (hamburgerBtn && mobileDrawer) {
        hamburgerBtn.addEventListener('click', toggleMobileMenu);
        mobileLinks.forEach(link => {
            link.addEventListener('click', closeMobileMenu);
        });
    }

    /* ==========================================================================
       4. GESTIONE FINESTRE MODALI (Menu & Prenotazione)
       ========================================================================== */
    const modalMenu = document.getElementById('modal-menu');
    const modalPrenota = document.getElementById('modal-prenota');
    const menuTriggers = document.querySelectorAll('.open-menu-trigger');
    const bookingTriggers = document.querySelectorAll('.open-booking-trigger');
    const closeButtons = document.querySelectorAll('.modal-close');
    const allModals = [modalMenu, modalPrenota];

    function openModal(modal) {
        closeAllModals();
        closeMobileMenu();
        if (modal) {
            modal.classList.add('open');
            modal.setAttribute('aria-hidden', 'false');
            document.body.classList.add('no-scroll');
        }
    }

    function closeAllModals() {
        allModals.forEach(m => {
            if (m) {
                m.classList.remove('open');
                m.setAttribute('aria-hidden', 'true');
            }
        });
        document.body.classList.remove('no-scroll');
    }

    menuTriggers.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            openModal(modalMenu);
        });
    });

    bookingTriggers.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            openModal(modalPrenota);
        });
    });

    closeButtons.forEach(btn => {
        btn.addEventListener('click', closeAllModals);
    });

    allModals.forEach(modal => {
        if (!modal) return;
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeAllModals();
        });
    });

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeAllModals();
    });

    /* ==========================================================================
       5. DATABASE E RENDERIZZAZIONE DELLA CARTA (TAB A SCHEDE)
       ========================================================================== */
    const cartaMenuData = {
        degustazione: [
            {
                categoria: "I Percorsi dello Chef",
                voci: [
                    {
                        titolo: "Armonie dei Sensi (5 Portate)",
                        desc: "Un viaggio calibrato tra terra e mare con ingredienti spontanei del litorale e dell'agro romano.",
                        prezzo: "€ 110",
                        nota: "Abbinamento 4 calici selezionati: +€ 55"
                    },
                    {
                        titolo: "Metamorfosi Contemporanea (7 Portate)",
                        desc: "Esperienza gastronomica a mano libera dello Chef: tecniche moderne applicate alle ricette storiche laziali.",
                        prezzo: "€ 145",
                        nota: "Abbinamento 6 grandi riserve: +€ 80"
                    }
                ]
            }
        ],
        antipasti: [
            {
                categoria: "Dall'Orto e dalla Terra",
                voci: [
                    {
                        titolo: "Tartare di Fassona Piemontese",
                        desc: "Battuta al coltello, tuorlo d'uovo marinato alle erbe, tartufo nero estivo e cialda croccante al Parmigiano 36 mesi.",
                        prezzo: "€ 24"
                    },
                    {
                        titolo: "Carciofo alla Giudia Reinterpretato",
                        desc: "Petali dorati ultra-croccanti, cuore morbido cotto a bassa temperatura, emulsione alla mentuccia selvatica e pecorino romano.",
                        prezzo: "€ 20"
                    },
                    {
                        titolo: "Capasanta Scottata & Topinambur",
                        desc: "Capesante dell'Adriatico con vellutata di topinambur alla vaniglia, polvere di caffè arabica e chips di radici.",
                        prezzo: "€ 26"
                    }
                ]
            }
        ],
        primi: [
            {
                categoria: "I Primi della Tradizione e d'Autore",
                voci: [
                    {
                        titolo: "Risotto Zafferano e Oro 24K",
                        desc: "Riso Carnaroli riserva all'onda, pistilli di zafferano puro, riduzione di midollo affumicato e foglia d'oro edibile.",
                        prezzo: "€ 32"
                    },
                    {
                        titolo: "Bottoni di Pasta Ripieni di Coda",
                        desc: "Pasta fresca all'uovo tirata a mano, ripieno di coda alla vaccinara brasata 14 ore e riduzione al cacao amaro e sedano croccante.",
                        prezzo: "€ 26"
                    },
                    {
                        titolo: "Tagliolini al Burro d'Alpeggio e Tartufo Bianco",
                        desc: "Pasta all'uovo 30 tuorli mantecata con burro montato di malga e scaglie fresche di tartufo bianco pregiato.",
                        prezzo: "€ 38"
                    }
                ]
            }
        ],
        secondi: [
            {
                categoria: "Carni Selezionate e Pescato del Giorno",
                voci: [
                    {
                        titolo: "Filetto di Manzo Dry Aged",
                        desc: "Frollatura 45 giorni su brace di quercia, riduzione al cesanese del piglio, purea di sedano rapa e scalogno confit.",
                        prezzo: "€ 36"
                    },
                    {
                        titolo: "Trancio di Ricciola Pescata all'Amo",
                        desc: "Cottura a pelle croccante, brodetto ristretto di scoglio al timo limonato, salicornia e gocce di pomodoro datterino confit.",
                        prezzo: "€ 34"
                    },
                    {
                        titolo: "Piccione Reale in Due Cotture",
                        desc: "Petto rosato al carbone, coscetta laccata al mosto cotto d'uva, terrina di fegato grasso e composta di fichi neri.",
                        prezzo: "€ 40"
                    }
                ]
            }
        ],
        dessert: [
            {
                categoria: "La Pasticceria di Lumina",
                voci: [
                    {
                        titolo: "Sfera di Cioccolato Fondente 72%",
                        desc: "Cuore cremoso di lamponi selvatici, crumble al pistacchio di Bronte DOP e cascata al tavolo di caramello salato caldo.",
                        prezzo: "€ 16"
                    },
                    {
                        titolo: "Tiramisù Sensoriale Scomposto",
                        desc: "Savoiardo soffice imbevuto all'espresso arabica miscela Lumina, spuma calda di mascarpone biologico e caviale al caffè.",
                        prezzo: "€ 14"
                    },
                    {
                        titolo: "Millefoglie Caramellata & Crema Chantilly",
                        desc: "Sfoglia croccante caramellata al burro di Bretagna, crema diplomatica alla vaniglia Bourbon del Madagascar e fragoline di bosco.",
                        prezzo: "€ 15"
                    }
                ]
            }
        ],
        cantina: [
            {
                categoria: "Selezione della Nostra Cantina (450+ Etichette)",
                voci: [
                    {
                        titolo: "Franciacorta Satèn Brut Millesimato DOCG",
                        desc: "Chardonnay in purezza, perlage setoso, sentori di crosta di pane e pesca bianca. Lombardia.",
                        prezzo: "€ 65"
                    },
                    {
                        titolo: "Champagne Grand Cru Blanc de Blancs",
                        desc: "Maison d'élite, freschezza minerale, note di agrumi canditi e gesso. Côte des Blancs, Francia.",
                        prezzo: "€ 125"
                    },
                    {
                        titolo: "Barolo Riserva DOCG 2016",
                        desc: "Nebbiolo 100%, tannini aristocratici, bouquet complesso di viola, goudron e spezie scure. Piemonte.",
                        prezzo: "€ 140"
                    },
                    {
                        titolo: "Brunello di Montalcino DOCG 2017",
                        desc: "Sangiovese grosso, affinamento 36 mesi in botte grande, corpo strutturato ed elegante armonia. Toscana.",
                        prezzo: "€ 110"
                    }
                ]
            }
        ]
    };

    const tabsContainer = document.getElementById('menu-tabs-content');
    const tabButtons = document.querySelectorAll('.tab-btn');

    function renderCategory(catKey) {
        if (!tabsContainer) return;
        const categoryGroups = cartaMenuData[catKey] || [];
        
        let html = '';
        categoryGroups.forEach(group => {
            html += `
                <div class="menu-course-category">
                    <h4>${group.categoria}</h4>
                    <div>
            `;
            group.voci.forEach(item => {
                html += `
                    <div class="menu-item-row">
                        <div style="flex: 1;">
                            <div class="menu-item-title">${item.titolo}</div>
                            <div class="menu-item-desc">${item.desc}</div>
                            ${item.nota ? `<div style="font-size: 0.75rem; color: var(--accent-gold); margin-top: 4px;">${item.nota}</div>` : ''}
                        </div>
                        <div class="menu-item-price">${item.prezzo}</div>
                    </div>
                `;
            });
            html += `
                    </div>
                </div>
            `;
        });

        tabsContainer.innerHTML = html;
    }

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            tabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const targetCategory = btn.getAttribute('data-tab');
            ORBIS_ANALYTICS.trackCustom(`carta-tab-${targetCategory}`, `Carta: Tab ${btn.textContent.trim()}`);
            renderCategory(targetCategory);
        });
    });

    // Renderizzazione iniziale
    renderCategory('degustazione');

    /* ==========================================================================
       6. SIMULATORE DOWNLOAD CARTA UFFICIALE (PDF)
       ========================================================================== */
    const downloadPdfBtn = document.getElementById('btn-download-pdf');
    if (downloadPdfBtn) {
        downloadPdfBtn.addEventListener('click', () => {
            const originalText = downloadPdfBtn.innerHTML;
            downloadPdfBtn.innerHTML = '<span>⏳</span> Generazione Carta PDF in corso...';
            downloadPdfBtn.style.pointerEvents = 'none';

            setTimeout(() => {
                const pdfContent = `
============================================================
              LUMINA | CUCINA SENSORIALE ROMA              
                 CARTA GASTRONOMICA UFFICIALE              
============================================================

Piazza del Colosseo, 1 - 00184 Roma (RM)
Tel: +39 06 1234 5678 | info@luminacucina.it

I PERCORSI DEGUSTAZIONE:
- Armonie dei Sensi (5 portate): € 110
- Metamorfosi Contemporanea (7 portate): € 145

I NOSTRI CLASSICI:
- Tartare di Fassona Piemontese: € 24
- Risotto Zafferano puro e Foglia d'Oro 24k: € 32
- Sfera di Cioccolato Fondente 72%: € 16

Dalla Cantina: oltre 450 referenze nazionali e internazionali.
Tutti i prezzi sono espressi in Euro, IVA inclusa.
============================================================
                Progettato da The Orbis Project
============================================================
                `;

                const blob = new Blob([pdfContent], { type: 'text/plain;charset=utf-8' });
                const downloadUrl = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = downloadUrl;
                a.download = 'Carta-Ufficiale-Lumina-Roma.txt';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(downloadUrl);

                downloadPdfBtn.innerHTML = '<span>✅</span> Carta Scaricata!';
                setTimeout(() => {
                    downloadPdfBtn.innerHTML = originalText;
                    downloadPdfBtn.style.pointerEvents = 'auto';
                }, 2500);
            }, 1000);
        });
    }

    /* ==========================================================================
       7. GESTIONE FORM PRENOTAZIONE TAVOLO SMART & WHATSAPP
       ========================================================================== */
    const bookingForm = document.getElementById('booking-form');
    const bookingConfirmation = document.getElementById('booking-confirmation');
    const dateInput = document.getElementById('book-date');

    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.min = today;
        dateInput.value = today;
    }

    if (bookingForm && bookingConfirmation) {
        bookingForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const date = document.getElementById('book-date').value;
            const time = document.getElementById('book-time').value;
            const guests = document.getElementById('book-guests').value;
            const name = document.getElementById('book-name').value;
            const phone = document.getElementById('book-phone').value;
            const occasion = document.getElementById('book-occasion').value;
            const notes = document.getElementById('book-notes').value || 'Nessuna nota specifica';

            const voucherId = 'LUM-' + Math.floor(100000 + Math.random() * 900000);

            const msgWhatsApp = `Gentile Lumina, vorrei confermare la prenotazione del tavolo:%0A` +
                                `• Voucher: ${voucherId}%0A` +
                                `• Ospite: ${name}%0A` +
                                `• Telefono: ${phone}%0A` +
                                `• Data: ${date} alle ore ${time}%0A` +
                                `• Persone: ${guests}%0A` +
                                `• Occasione: ${occasion}%0A` +
                                `• Note / Allergie: ${notes}`;

            bookingForm.classList.add('hidden');
            bookingConfirmation.classList.remove('hidden');

            bookingConfirmation.innerHTML = `
                <div style="font-size: 3.5rem; margin-bottom: 10px;">✨</div>
                <h3 style="color: var(--accent-gold); font-size: 1.8rem; margin-bottom: 8px;">Tavolo Riservato con Successo</h3>
                <p style="color: var(--text-secondary); font-size: 0.9rem;">La tua richiesta è stata registrata presso il nostro maître di sala.</p>

                <div class="voucher-card">
                    <h4>Voucher #${voucherId}</h4>
                    <p><strong>Intestatario:</strong> ${name}</p>
                    <p><strong>Data & Orario:</strong> ${date} &bull; Ore ${time}</p>
                    <p><strong>Ospiti:</strong> ${guests}</p>
                    <p><strong>Occasione:</strong> ${occasion}</p>
                    ${notes !== 'Nessuna nota specifica' ? `<p><strong>Note:</strong> ${notes}</p>` : ''}
                </div>

                <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 20px;">
                    <a href="https://wa.me/390612345678?text=${msgWhatsApp}" target="_blank" rel="noopener noreferrer" class="btn-primary" data-orbis-track="conversion-lumina-whatsapp" data-orbis-label="Conversione Lumina: Invio WhatsApp" style="background-color: #25D366; border-color: #25D366; color: white;">
                        💬 Invia Dettagli su WhatsApp
                    </a>
                    <button id="btn-reset-booking" class="btn-ghost" style="padding: 10px;">
                        Effettua un'altra prenotazione
                    </button>
                </div>
            `;

            const resetBtn = document.getElementById('btn-reset-booking');
            if (resetBtn) {
                resetBtn.addEventListener('click', () => {
                    bookingForm.reset();
                    if (dateInput) {
                        const todayStr = new Date().toISOString().split('T')[0];
                        dateInput.value = todayStr;
                    }
                    bookingConfirmation.classList.add('hidden');
                    bookingForm.classList.remove('hidden');
                });
            }
        });
    }

});