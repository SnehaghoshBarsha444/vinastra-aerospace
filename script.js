/**
 * VINASTRA AEROSPACE — INTERACTIVE SCRIPTS & INTEGRATION
 * Specification: APHELION design system rebuild
 */

// Determine current route
const currentPath = window.location.pathname.replace(/\/$/, '') || '/home';
const routeName = window.location.pathname.split('/').filter(Boolean)[0] || 'home';
document.body.dataset.route = routeName;

// Populate Primary Navigation across sub-pages only
// On homepage, the nav is hardcoded with anchor links (#technology, #systems, etc.)
// so we must NOT overwrite it with page-based links.
const navItems = [
  ['Home', '/home/'],
  ['About', '/about/'],
  ['Innovation', '/innovation/'],
  ['Research', '/research/'],
  ['News', '/news/'],
  ['Investors', '/investors/'],
  ['Collaborate', '/collaborate/'],
  ['Contact', '/contact/']
];

if (routeName !== 'home') {
  document.querySelectorAll('.primary-nav').forEach((nav) => {
    const linksHtml = navItems.map(([label, href]) => {
      const isActive = currentPath === href.replace(/\/$/, '');
      const activeClass = isActive ? ' class="active-route" aria-current="page"' : '';
      return `<a href="${href}"${activeClass}>${label}</a>`;
    }).join('');
    nav.innerHTML = `${linksHtml}<div class="mobile-nav-auth"><a href="/login/" class="auth-btn auth-btn-login">Login</a><a href="/login/?mode=signup" class="auth-btn auth-btn-signup">Create Account</a></div>`;
  });
}

// Mobile Menu Toggle
const menuToggle = document.querySelector('.menu-toggle');
const primaryNav = document.querySelector('.primary-nav');

if (menuToggle && primaryNav) {
  menuToggle.addEventListener('click', () => {
    const isOpen = primaryNav.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
  });

  // Close menu when clicking any nav link
  primaryNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      primaryNav.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

// Dynamic Copyright Year
const copyrightYear = document.getElementById('copyright-year');
if (copyrightYear) {
  copyrightYear.textContent = new Date().getFullYear();
}

// Scroll Progress & Topbar Glassmorphism
const topbar = document.querySelector('#topbar');
const rootElement = document.documentElement;

const updateScrollTelemetry = () => {
  const scrollY = window.scrollY || window.pageYOffset;
  if (topbar) {
    topbar.classList.toggle('scrolled', scrollY > 30);
  }
  const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollableHeight > 0 ? Math.min(1, Math.max(0, scrollY / scrollableHeight)) : 0;
  rootElement.style.setProperty('--scroll-progress', progress.toFixed(4));
};

window.addEventListener('scroll', updateScrollTelemetry, { passive: true });
updateScrollTelemetry();

// Restrained Parallax for Desktop with Reduced-Motion Guard
const parallaxElements = [...document.querySelectorAll('[data-parallax]')];
let parallaxAnimationFrame = null;

const applyParallax = () => {
  parallaxAnimationFrame = null;
  if (typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || window.innerWidth < 860) {
    parallaxElements.forEach((el) => el.style.removeProperty('--parallax-y'));
    return;
  }
  const viewportCenter = window.innerHeight / 2;
  parallaxElements.forEach((el) => {
    const rect = el.getBoundingClientRect();
    const intensity = Number(el.dataset.parallax || 0.1);
    const offset = Math.max(-60, Math.min(60, (viewportCenter - (rect.top + rect.height / 2)) * intensity));
    el.style.setProperty('--parallax-y', `${offset.toFixed(1)}px`);
  });
};

const requestParallaxTick = () => {
  if (!parallaxAnimationFrame) {
    parallaxAnimationFrame = requestAnimationFrame(applyParallax);
  }
};

window.addEventListener('scroll', requestParallaxTick, { passive: true });
window.addEventListener('resize', requestParallaxTick);
requestParallaxTick();

// ASCS Interactive Architecture Subsystem Explorer
const ascsData = {
  planner: {
    num: '01 / ASCS SUBSYSTEM',
    title: 'Autonomous Mission Planner',
    desc: 'Autonomous task decomposition, dynamic timeline scheduling, multi-agent resource allocation, and real-time contingency replanning. Designed to maintain safe industrial operations during communication delays.',
    specs: [
      { label: 'Autonomy Level', val: 'Autonomous-first, ground-supervised' },
      { label: 'Latency Tolerance', val: 'Earth-Moon & deep-space resilient' }
    ]
  },
  twin: {
    num: '02 / ASCS SUBSYSTEM',
    title: 'Digital Twin Synchronization',
    desc: 'High-fidelity physics simulation and blueprint synchronization. Continuously cross-references real-time sensor and metrology feedback against CAD specifications to identify micro-tolerances and assembly deviations.',
    specs: [
      { label: 'Model Baseline', val: 'ASF-01 Modular Blueprint Specs' },
      { label: 'Deviation Check', val: 'Sub-millimeter closed loop' }
    ]
  },
  builders: {
    num: '03 / ASCS SUBSYSTEM',
    title: 'Robotic Manipulators & Fabricators',
    desc: 'Coordinated modular manipulator arms, mobile truss-crawlers, and end-effectors equipped for robotic welding, riveting, component insertion, and selective additive material deposition.',
    specs: [
      { label: 'Manipulator Kinematics', val: 'Multi-degree-of-freedom arms' },
      { label: 'Manufacturing Tools', val: 'Additive deposition & mechanical joining' }
    ]
  },
  robotics: {
    num: '03 / ASCS SUBSYSTEM',
    title: 'Robotic Manipulators & Fabricators',
    desc: 'Coordinated modular manipulator arms, mobile truss-crawlers, and end-effectors equipped for robotic welding, riveting, component insertion, and selective additive material deposition.',
    specs: [
      { label: 'Manipulator Kinematics', val: 'Multi-degree-of-freedom arms' },
      { label: 'Manufacturing Tools', val: 'Additive deposition & mechanical joining' }
    ]
  },
  vision: {
    num: '04 / ASCS SUBSYSTEM',
    title: 'Machine Vision & Metrology',
    desc: 'Multi-camera photogrammetry, structured-light 3D surface scanning, laser alignment gauges, and optical inspection drones providing independent verification of every structural joint and weld seam.',
    specs: [
      { label: 'Inspection Mode', val: 'Multi-spectral optical & LiDAR' },
      { label: 'Verification', val: 'Automated defect tagging' }
    ]
  },
  ground: {
    num: '05 / ASCS SUBSYSTEM',
    title: 'Ground Control Supervision',
    desc: 'Earth-based telemetry console allowing mission directors to monitor progress, upload high-level milestone mandates, review digital-twin divergence alerts, and authorise safety-critical overrides.',
    specs: [
      { label: 'Command Uplink', val: 'High-level executive supervision' },
      { label: 'Safety Mode', val: 'Failsafe autonomous hold state' }
    ]
  }
};

const subsystemButtons = document.querySelectorAll('[data-subsystem-key]');
const panelNum = document.querySelector('#ascs-panel-num') || document.querySelector('[data-subsystem-tag]');
const panelTitle = document.querySelector('#ascs-panel-title') || document.querySelector('[data-subsystem-title]');
const panelDesc = document.querySelector('#ascs-panel-desc') || document.querySelector('[data-subsystem-desc]');
const panelSpecs = document.querySelector('#ascs-panel-specs') || document.querySelector('[data-subsystem-specs]');
const panelWatermark = document.querySelector('#ascs-panel-watermark') || document.querySelector('[data-subsystem-index]');

if (subsystemButtons.length > 0 && panelTitle && panelDesc) {
  subsystemButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.subsystemKey;
      const data = ascsData[key];
      if (!data) return;

      subsystemButtons.forEach((b) => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');

      if (panelNum) panelNum.textContent = data.num;
      if (panelTitle) panelTitle.textContent = data.title;
      if (panelDesc) panelDesc.textContent = data.desc;
      if (panelWatermark) panelWatermark.textContent = data.num.slice(0, 2);

      if (panelSpecs && data.specs) {
        panelSpecs.innerHTML = data.specs.map((s) => `
          <div class="panel-spec-item">
            <strong>${s.label}</strong>
            <span>${s.val}</span>
          </div>
        `).join('');
      }
    });
  });
}

// ASCS Layer Card Interactive Highlight (new APHELION markup)
const layerCards = document.querySelectorAll('.ascs-layer-card[data-layer]');
if (layerCards.length > 0) {
  layerCards.forEach((card) => {
    card.addEventListener('click', () => {
      layerCards.forEach((c) => c.classList.remove('active'));
      card.classList.add('active');
    });
  });
}

// Space Factory Blueprint / Render Toggle
const factoryToggleBtns = document.querySelectorAll('[data-factory-view]');
const factoryImage = document.querySelector('#factory-main-image') || document.querySelector('[data-factory-image]');
const factoryStatusLabel = document.querySelector('#factory-view-status') || document.querySelector('[data-factory-label]');
const factoryCaption = document.querySelector('#factory-caption') || document.querySelector('[data-factory-caption]');

if (factoryToggleBtns.length > 0 && factoryImage) {
  factoryToggleBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const view = btn.dataset.factoryView;
      factoryToggleBtns.forEach((b) => b.classList.remove('action-primary', 'active'));
      factoryToggleBtns.forEach((b) => b.classList.add('action-line'));
      btn.classList.remove('action-line');
      btn.classList.add('action-primary', 'active');

      if (view === 'blueprint') {
        factoryImage.src = '/public/vinastra-space-factory-blueprint.webp';
        factoryImage.alt = 'Vinastra Autonomous Space Factory Concept Blueprint (ASF-01 Rev A)';
        if (factoryStatusLabel) factoryStatusLabel.textContent = 'ASF-01 REV A ARCHITECTURAL BLUEPRINT';
        if (factoryCaption) factoryCaption.textContent = 'ASF-01 preliminary blueprint draft illustrating module docking bays, solar wings, robotic gantries, and additive manufacturing chambers.';
      } else {
        factoryImage.src = '/public/vinastra-space-factory-render.webp';
        factoryImage.alt = 'Vinastra Autonomous Space Factory Concept 3D Rendering (ASF-01)';
        if (factoryStatusLabel) factoryStatusLabel.textContent = 'ASF-01 CINEMATIC CONCEPT RENDER';
        if (factoryCaption) factoryCaption.textContent = 'ASF-01 photorealistic conceptual 3D rendering depicting orbital docking modules, power collection, and deep-space manufacturing bays.';
      }
    });
  });
}

// ==========================================================================
// GSAP + SCROLLTRIGGER COORDINATED SCROLL EFFECTS (APHELION REBUILD)
// ==========================================================================
const initGSAPScrollEffects = () => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    document.querySelectorAll('.reveal, .bottleneck-card, .capability-card, .defensibility-card, .beachhead-card, .ascs-layer-card, .sequence-stage-card, .resource-stage-item, .objective-item, .roadmap-phase-card, .milestone-year-card, .alloc-item-card, .business-stage-box, .domain-pill-card, .collab-track-card').forEach((el) => {
      el.classList.add('visible');
    });
    return;
  }

  if (typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);

    // 1. Hero Coordinated Entrance Timeline
    const heroLeft = document.querySelector('.hero-left-column');
    if (heroLeft) {
      const heroTL = gsap.timeline({ defaults: { ease: 'power3.out' } });
      heroTL
        .from('.hero-eyebrow', { opacity: 0, y: 25, duration: 0.8, delay: 0.1 })
        .from('.hero-main-headline', { opacity: 0, y: 35, duration: 1.0 }, '-=0.6')
        .from('.hero-supporting-copy', { opacity: 0, y: 25, duration: 0.8 }, '-=0.6')
        .from('.hero-cta-group a', { opacity: 0, y: 20, stagger: 0.15, duration: 0.7 }, '-=0.5')
        .from('.hero-metrics-strip', { opacity: 0, y: 30, duration: 1.0, ease: 'power2.out' }, '-=0.8');
    }

    // 2. Parallax Synced with Scroll (Scrubbed)
    if (window.innerWidth >= 860) {
      document.querySelectorAll('[data-parallax]').forEach((el) => {
        const intensity = parseFloat(el.dataset.parallax || '0.12');
        const section = el.closest('section') || el.parentElement || el;
        gsap.to(el, {
          y: () => (window.innerHeight * intensity * 0.75),
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1.2
          }
        });
      });
    }

    // 3. Staggered Reveals for Section Eyebrows & Titles
    document.querySelectorAll('.tech-section .tech-container, .final-cta-section .cta-content-wrapper').forEach((container) => {
      const eyebrow = container.querySelector('.section-eyebrow');
      const title = container.querySelector('.section-title') || container.querySelector('.cta-headline');
      const subtitle = container.querySelector('.section-subtitle') || container.querySelector('.cta-supporting-text');
      const targets = [eyebrow, title, subtitle].filter(Boolean);
      if (targets.length > 0) {
        gsap.from(targets, {
          opacity: 0,
          y: 20,
          stagger: 0.1,
          duration: 0.6,
          ease: 'power2.out',
          clearProps: 'all',
          scrollTrigger: {
            trigger: container,
            start: 'top 95%',
            toggleActions: 'play none none none'
          }
        });
      }
    });

    // 4. Staggered Card Reveals for all APHELION grid sections (retaining full visibility)
    const cardGridSelectors = [
      '.bottleneck-grid',
      '.construction-sequence-grid',
      '.factory-capabilities-grid',
      '.resource-stages-grid',
      '.prototype-objectives-list',
      '.roadmap-phases-container',
      '.milestones-deck-grid',
      '.market-beachhead-grid',
      '.business-stages-grid',
      '.research-domains-grid',
      '.collaboration-tracks-list',
      '.defensibility-pillars-grid',
      '.allocation-breakdown-grid',
      '.console-telemetry-grid',
      '.ascs-subsystems-list',
      '.timeline-grid',
      '.specs-grid'
    ];

    cardGridSelectors.forEach((gridSelector) => {
      document.querySelectorAll(gridSelector).forEach((grid) => {
        const cards = Array.from(grid.children);
        if (cards.length > 0) {
          gsap.from(cards, {
            y: 20,
            stagger: 0.05,
            duration: 0.5,
            ease: 'power2.out',
            clearProps: 'transform',
            scrollTrigger: {
              trigger: grid,
              start: 'top 92%',
              toggleActions: 'play none none none'
            }
          });
        }
      });
    });

    // 5. Timeline-driven sequence: ASCS Technology Section
    const ascsSection = document.querySelector('#technology') || document.querySelector('#architecture') || document.querySelector('.ascs-architecture-section');
    if (ascsSection) {
      const archTL = gsap.timeline({
        scrollTrigger: {
          trigger: ascsSection,
          start: 'top 85%',
          toggleActions: 'play none none none'
        }
      });
      archTL
        .from('.ascs-architecture-wrapper', { y: 20, duration: 0.5, ease: 'power2.out', clearProps: 'transform' })
        .from('.ascs-video-side, .ascs-embed-side', { x: -20, duration: 0.5, ease: 'power2.out', clearProps: 'transform' }, '-=0.3')
        .from('.ascs-visual-side', { x: 20, duration: 0.5, ease: 'power2.out', clearProps: 'transform' }, '-=0.4')
        .from('.ascs-layers-grid .ascs-layer-card', { y: 15, stagger: 0.05, duration: 0.4, ease: 'power2.out', clearProps: 'transform' }, '-=0.2');
    }

    // 6. Mission Control Console entrance
    const missionSection = document.querySelector('#mission-control');
    if (missionSection) {
      const missionTL = gsap.timeline({
        scrollTrigger: {
          trigger: missionSection,
          start: 'top 75%',
          toggleActions: 'play none none none'
        }
      });
      missionTL
        .from('.console-header-bar', { opacity: 0, y: 15, duration: 0.5 })
        .from('.console-viewport', { opacity: 0, scale: 0.97, duration: 0.8 }, '-=0.3')
        .from('.console-sidebar .sidebar-data-block', { opacity: 0, x: 30, stagger: 0.1, duration: 0.5 }, '-=0.5');
    }

    // 7. Investment banner entrance
    const investSection = document.querySelector('#investors');
    if (investSection) {
      gsap.from('.investment-hero-banner', {
        opacity: 0,
        y: 30,
        duration: 0.8,
        scrollTrigger: {
          trigger: investSection,
          start: 'top 75%',
          toggleActions: 'play none none none'
        }
      });
      gsap.from('.allocation-bar-stack', {
        scaleX: 0,
        transformOrigin: 'left center',
        duration: 1.2,
        ease: 'power2.inOut',
        scrollTrigger: {
          trigger: '.allocation-bar-stack',
          start: 'top 85%',
          toggleActions: 'play none none none'
        }
      });
    }

    // 8. Final CTA section
    const ctaSection = document.querySelector('.final-cta-section');
    if (ctaSection) {
      gsap.from('.cta-actions-row a', {
        opacity: 0,
        y: 20,
        stagger: 0.15,
        duration: 0.7,
        scrollTrigger: {
          trigger: ctaSection,
          start: 'top 75%',
          toggleActions: 'play none none none'
        }
      });
    }

    // 9. Synchronized Scroll Progress Bar
    const scrollTracker = document.querySelector('.scroll-tracker');
    if (scrollTracker) {
      ScrollTrigger.create({
        start: 'top top',
        end: 'max',
        onUpdate: (self) => {
          rootElement.style.setProperty('--scroll-progress', self.progress.toFixed(4));
        }
      });
    }

    // Ensure all reveals mark visible for CSS transitions
    document.querySelectorAll('.reveal').forEach((el) => el.classList.add('visible'));
  } else {
    // Fallback: IntersectionObserver
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.reveal, .bottleneck-card, .capability-card, .defensibility-card, .beachhead-card, .ascs-layer-card, .sequence-stage-card, .resource-stage-item, .objective-item, .roadmap-phase-card, .milestone-year-card, .alloc-item-card').forEach((el) => {
      revealObserver.observe(el);
    });
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGSAPScrollEffects);
} else {
  initGSAPScrollEffects();
}

// Contact Form Handler connected to /api/contact
const contactForms = document.querySelectorAll('form[data-contact-form]');

contactForms.forEach((form) => {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector('button[type="submit"]');
    const feedbackEl = form.querySelector('[data-form-feedback]');

    // Honeypot spam check
    const honeypot = form.querySelector('input[name="website"]');
    if (honeypot && honeypot.value.trim().length > 0) {
      if (feedbackEl) {
        feedbackEl.className = 'form-feedback success';
        feedbackEl.textContent = 'Transmission received. Thank you.';
      }
      form.reset();
      return;
    }

    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = 'Transmitting… <span class="action-arrow">⟳</span>';
    }
    if (feedbackEl) {
      feedbackEl.className = 'form-feedback';
      feedbackEl.textContent = '';
    }

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with status ${res.status}`);
      }

      if (feedbackEl) {
        feedbackEl.className = 'form-feedback success';
        feedbackEl.textContent = 'Transmission confirmed. Your message has been safely recorded in our register.';
      }
      if (submitBtn) {
        submitBtn.innerHTML = 'Transmission Received <span class="action-arrow">✓</span>';
      }
      form.reset();
      setTimeout(() => {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = 'Transmit Enquiry <span class="action-arrow">↗</span>';
        }
      }, 5000);
    } catch (err) {
      console.error('Contact transmission error:', err);
      if (feedbackEl) {
        feedbackEl.className = 'form-feedback error';
        feedbackEl.textContent = `Transmission failed: ${err.message}. Alternatively, email us directly at thesparkofwisdom@gmail.com.`;
      }
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Retry Transmission <span class="action-arrow">↗</span>';
      }
    }
  });
});

// Live News Hydration from /api/news
const newsFeedContainers = document.querySelectorAll('[data-news-feed]');

const hydrateNewsFeed = async () => {
  if (newsFeedContainers.length === 0) return;
  try {
    const res = await fetch('/api/news');
    if (!res.ok) return;
    const stories = await res.json();
    if (!Array.isArray(stories) || stories.length === 0) return;

    newsFeedContainers.forEach((container) => {
      container.innerHTML = stories.map((story) => `
        <article class="news-card reveal visible">
          <div>
            <div class="news-meta">
              <span class="status-pill status-active"><i></i> ${story.date}</span>
              <span>${story.category}</span>
            </div>
            <h3 class="news-title">${story.title}</h3>
            <p class="news-desc">${story.summary}</p>
          </div>
          <a class="news-link" href="/news/">Read Statement <span class="action-arrow">↗</span></a>
        </article>
      `).join('');
    });
  } catch (err) {
    console.warn('News hydration notice: displaying static verified register entries.', err);
  }
};

window.addEventListener('DOMContentLoaded', hydrateNewsFeed);

// Continuous Video Looping for Satellite Element
const initSatelliteVideo = () => {
  const satVideo = document.querySelector('.ascs-satellite-video');
  if (!satVideo) return;

  // Ensure continuous replay when playback finishes
  satVideo.addEventListener('ended', () => {
    satVideo.currentTime = 0;
    satVideo.play().catch(() => {});
  });

  // Re-trigger playback if tab visibility returns or autoplay was deferred
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && satVideo.paused) {
      satVideo.play().catch(() => {});
    }
  });

  // Initial play reassurance
  if (satVideo.paused) {
    satVideo.play().catch(() => {});
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSatelliteVideo);
} else {
  initSatelliteVideo();
}
