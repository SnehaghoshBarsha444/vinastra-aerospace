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

const topbar = document.querySelector('#topbar');
const root = document.documentElement;
const updateScrollTelemetry = () => {
  if (topbar) topbar.classList.toggle('scrolled', window.scrollY > 30);
  const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
  root.style.setProperty('--scroll-progress', scrollableHeight > 0 ? window.scrollY / scrollableHeight : 0);
};
window.addEventListener('scroll', updateScrollTelemetry, { passive: true });
updateScrollTelemetry();

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

const navItems = [
  ['Home', '/home/'],
  ['About', '/about/'],
  ['Innovation', '/innovation/'],
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
