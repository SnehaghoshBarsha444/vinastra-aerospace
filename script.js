<<<<<<< HEAD
const loader = document.querySelector('#loader');
const loaderMessage = document.querySelector('#loader-message');
const messages = ['INITIALIZING SYSTEM', 'ESTABLISHING ORBITAL LINK', 'SYSTEM READY'];
let messageIndex = 0;

const messageTimer = loaderMessage ? setInterval(() => {
  messageIndex += 1;
  loaderMessage.textContent = messages[messageIndex];
  if (messageIndex === messages.length - 1) clearInterval(messageTimer);
}, 430) : null;

window.addEventListener('load', () => {
  if (loader) {
    const delay = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 80 : 650;
    setTimeout(() => loader.classList.add('loaded'), delay);
  }
});

const routeName = window.location.pathname.split('/').filter(Boolean)[0] || 'home';
document.body.dataset.route = routeName;
document.querySelector('main')?.setAttribute('data-route', routeName);

// Keep the otherwise static multi-page site discoverable with a route-specific
// description and canonical URL. Page copy remains source-qualified.
const routeMetadata = {
  about: 'About VINASTRA Aerospace, an early-stage Indian SpaceTech and DeepTech company developing the proposed ASCS platform.',
  innovation: 'Explore the proposed Autonomous Space Construction System: mission planning, digital twins, robotic builders, machine vision, and ground control.',
  research: 'VINASTRA Aerospace planned research and development pathway, from concept and simulation to a proposed ground-based ASCS demonstrator.',
  news: 'VINASTRA Aerospace public development register. Updates distinguish current work from planned objectives and demonstrated results.',
  collaborate: 'Collaboration opportunities with VINASTRA Aerospace for research, robotics, simulation, manufacturing, and space technology development.',
  investors: 'VINASTRA Aerospace proposed investor brief for ASCS Prototype-1 and the long-term autonomous space factory concept.',
  contact: 'Contact VINASTRA Aerospace for ASCS research, prototype partnerships, proposed investment, and technology collaboration.'
};
if (routeMetadata[routeName]) {
  let description = document.querySelector('meta[name="description"]');
  if (!description) {
    description = document.createElement('meta');
    description.name = 'description';
    document.head.append(description);
  }
  description.content = routeMetadata[routeName];
  let canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.rel = 'canonical';
    document.head.append(canonical);
  }
  canonical.href = `${window.location.origin}/${routeName}/`;
}

const topbar = document.querySelector('#topbar');
const root = document.documentElement;
const updateScrollTelemetry = () => {
  if (topbar) topbar.classList.toggle('scrolled', window.scrollY > 30);
  const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
  root.style.setProperty('--scroll-progress', scrollableHeight > 0 ? window.scrollY / scrollableHeight : 0);
};
window.addEventListener('scroll', updateScrollTelemetry, { passive: true });
updateScrollTelemetry();

// Slower-moving artwork gives the major technical sections visible depth without
// moving layout or blocking scroll. Small screens and reduced-motion modes stay static.
const parallaxLayers = [...document.querySelectorAll('[data-parallax]')];
let parallaxFrame = null;
const updateParallax = () => {
  parallaxFrame = null;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || window.innerWidth < 801) {
    parallaxLayers.forEach((layer) => layer.style.removeProperty('--parallax-y'));
    return;
  }
  const viewportCenter = window.innerHeight / 2;
  parallaxLayers.forEach((layer) => {
    const rect = layer.getBoundingClientRect();
    const intensity = Number(layer.dataset.parallax || 0.1);
    const offset = Math.max(-72, Math.min(72, (viewportCenter - (rect.top + rect.height / 2)) * intensity));
    layer.style.setProperty('--parallax-y', `${offset.toFixed(1)}px`);
  });
};
const requestParallax = () => { if (!parallaxFrame) parallaxFrame = requestAnimationFrame(updateParallax); };
window.addEventListener('scroll', requestParallax, { passive: true });
window.addEventListener('resize', requestParallax);
requestParallax();

const heroVisual = document.querySelector('.hero-visual');
window.addEventListener('pointermove', (event) => {
  if (!heroVisual || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const x = (event.clientX / window.innerWidth - 0.5) * 2;
  const y = (event.clientY / window.innerHeight - 0.5) * 2;
  heroVisual.style.setProperty('--pointer-x', x.toFixed(3));
  heroVisual.style.setProperty('--pointer-y', y.toFixed(3));
}, { passive: true });

// The supplied blueprint and concept render use the same composition. The reveal
// stays aligned with their geometry instead of trying to falsely morph flat artwork.
const factoryStage = document.querySelector('[data-factory-stage]');
const factoryProgress = document.querySelector('[data-progress]');
const factoryCopy = document.querySelector('[data-factory-copy]');
let factoryFrame = null;
const updateFactoryReveal = () => {
  factoryFrame = null;
  if (!factoryStage || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const bounds = factoryStage.parentElement.getBoundingClientRect();
  const distance = Math.max(1, factoryStage.parentElement.offsetHeight - window.innerHeight);
  const progress = Math.min(1, Math.max(0, -bounds.top / distance));
  // Keep the opening frame as the blueprint, then begin the colour pass after
  // a brief visual hold. The lower copy enters in the same scroll direction.
  const reveal = Math.round(Math.min(1, Math.max(0, (progress - 0.14) / 0.86)) * 100);
  factoryStage.style.setProperty('--factory-reveal', reveal);
  if (factoryCopy) {
    const copyProgress = Math.min(1, Math.max(0, (progress - 0.07) / 0.22));
    factoryCopy.style.setProperty('--hero-copy-progress', copyProgress.toFixed(3));
    factoryCopy.style.setProperty('--hero-copy-events', copyProgress > 0.9 ? 'auto' : 'none');
  }
  if (factoryProgress) factoryProgress.textContent = String(reveal).padStart(2, '0');
};
const requestFactoryReveal = () => { if (!factoryFrame) factoryFrame = requestAnimationFrame(updateFactoryReveal); };
window.addEventListener('scroll', requestFactoryReveal, { passive: true });
window.addEventListener('resize', requestFactoryReveal);
updateFactoryReveal();

const componentData = {
  planner: ['01', 'AI Mission Planner', 'Task sequencing, replanning and anomaly response form the proposed autonomous planning layer.'],
  twin: ['02', 'Digital Twin', 'A blueprint and simulation layer could compare planned progress with the constructed module.'],
  builders: ['03', 'Robotic Builders', 'Arms, mobile robots, 3D printing and joining tools are proposed for construction and assembly tasks.'],
  vision: ['04', 'Machine Vision', 'Vision, sensors and metrology are intended to support inspection, alignment and quality checks.'],
  ground: ['05', 'Ground Control', 'Earth-based operators would issue supervisory commands and recovery actions when needed.'],
  oversight: ['06', 'Human Supervision', 'ASCS is autonomous-first, human-supervised and designed to be remotely recoverable in concept.']
};
const explorer = document.querySelector('[data-explorer]');
if (explorer) {
  const index = explorer.querySelector('[data-component-index]');
  const title = explorer.querySelector('[data-component-title]');
  const description = explorer.querySelector('[data-component-description]');
  const selectComponent = (key) => {
    const item = componentData[key];
    if (!item) return;
    explorer.querySelectorAll('.component-marker').forEach((marker) => marker.classList.toggle('active', marker.dataset.component === key));
    [index.textContent, title.textContent, description.textContent] = item;
  };
  explorer.querySelectorAll('.component-marker').forEach((marker) => marker.addEventListener('click', () => selectComponent(marker.dataset.component)));
  explorer.querySelector('[data-panel-close]')?.addEventListener('click', () => {
    explorer.querySelectorAll('.component-marker').forEach((marker) => marker.classList.remove('active'));
    index.textContent = '01'; title.textContent = 'Factory overview'; description.textContent = 'Select any illustrated marker to learn how that conceptual subsystem relates to the wider factory.';
  });
}

=======
/**
 * VINASTRA AEROSPACE — INTERACTIVE SCRIPTS & INTEGRATION
 * Specification: design.md, skill.md, agents.md
 */

// Determine current route
const currentPath = window.location.pathname.replace(/\/$/, '') || '/home';
const routeName = window.location.pathname.split('/').filter(Boolean)[0] || 'home';
document.body.dataset.route = routeName;

// Populate Primary Navigation across all pages
>>>>>>> 5e6f757 (Cinematic redesign, added graceful port fallback, updated script, added tests, converted missing asset, updated documentation)
const navItems = [
  ['Home', '/home/'],
  ['About', '/about/'],
  ['Innovation', '/innovation/'],
<<<<<<< HEAD
  ['Research & Development', '/research/'],
  ['News & Updates', '/news/'],
  ['Investors', '/investors/'],
  ['Collaborations', '/collaborate/'],
  ['Contact', '/contact/']
];
document.querySelectorAll('.primary-nav').forEach((navigation) => {
  const currentPath = window.location.pathname.replace(/\/$/, '') || '/home';
  navigation.innerHTML = navItems.map(([label, href]) => {
    const active = currentPath === href.replace(/\/$/, '') ? ' class="active-route"' : '';
    return `<a${active}${active ? ' aria-current="page"' : ''} href="${href}">${label}</a>`;
  }).join('');
});

const menuToggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.primary-nav');
if (menuToggle && nav) {
  menuToggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', isOpen);
  });
  nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
    nav.classList.remove('open');
    menuToggle.setAttribute('aria-expanded', 'false');
  }));
}

if (!document.querySelector('.dossier-footer') && !document.querySelector('.site-footer')) {
  const footer = document.createElement('footer');
  footer.className = 'site-footer';
  footer.innerHTML = '<span>VINASTRA AEROSPACE / EARLY-STAGE R&amp;D</span><span>CONCEPTS ARE LABELLED THROUGHOUT</span><a href="/contact/">Start a conversation <b>↗</b></a>';
  document.querySelector('main')?.insertAdjacentElement('afterend', footer);
}

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));
document.querySelectorAll('.route-item').forEach((element) => observer.observe(element));

const contactForm = document.querySelector('form[data-contact-form]');
if (contactForm) contactForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const button = event.currentTarget.querySelector('button');
  const status = event.currentTarget.querySelector('[data-form-status]');
  button.disabled = true;
  button.textContent = 'Transmitting…';
  if (status) status.textContent = '';
  try {
    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget)))
    });
    if (!response.ok) throw new Error('Transmission rejected');
    button.textContent = 'Transmission received';
    if (status) status.textContent = 'Thank you. Your enquiry has been recorded.';
    event.currentTarget.reset();
  } catch (error) {
    console.error(error);
    button.disabled = false;
    button.textContent = 'Retry transmission';
    if (status) status.textContent = 'Transmission failed. Please try again.';
  }
});

const newsFeed = document.querySelector('[data-news-feed]');
const hydrateNews = async () => {
  if (!newsFeed) return;
  try {
    const response = await fetch('/api/news');
    const stories = await response.json();
    newsFeed.innerHTML = stories.map((story) => `<article><div><small>${story.date} / ${story.category}</small><h3>${story.title}</h3><p>${story.summary}</p></div><span>↗</span></article>`).join('');
  } catch (error) {
    console.error(error);
  }
};
window.addEventListener('load', hydrateNews);
=======
  ['Research', '/research/'],
  ['News', '/news/'],
  ['Investors', '/investors/'],
  ['Collaborate', '/collaborate/'],
  ['Contact', '/contact/']
];

document.querySelectorAll('.primary-nav').forEach((nav) => {
  nav.innerHTML = navItems.map(([label, href]) => {
    const isHome = (currentPath === '' || currentPath === '/home' || currentPath === '/') && (href === '/home/' || href === '/');
    const isActive = isHome || currentPath === href.replace(/\/$/, '');
    const activeClass = isActive ? ' class="active-route" aria-current="page"' : '';
    return `<a href="${href}"${activeClass}>${label}</a>`;
  }).join('');
});

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

// Scroll-Triggered Reveal Elements (IntersectionObserver)
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal, .dossier-card, .bottleneck-card, .pillar-card, .news-card').forEach((el) => {
  revealObserver.observe(el);
});

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

>>>>>>> 5e6f757 (Cinematic redesign, added graceful port fallback, updated script, added tests, converted missing asset, updated documentation)
