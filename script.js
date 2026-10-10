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
  if (loader) setTimeout(() => {
    loader.classList.add('loaded');
    if (document.body.dataset.redirectAfterLoad) window.location.assign(document.body.dataset.redirectAfterLoad);
  }, 1250);
});

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
  solar: ['01', 'Solar power arrays', 'Scalable collection surfaces support the illustrated factory’s power needs and manufacturing operations.'],
  control: ['02', 'Avionics & AI control', 'A conceptual control layer coordinates sensing, navigation and autonomous operations across the platform.'],
  processing: ['03', 'Resource processing', 'Illustrated processing modules explore how raw material could be sorted, refined and prepared for use.'],
  robotics: ['04', 'Robotic assembly', 'Robotic manipulators are shown performing inspection, handling and external assembly activities.'],
  manufacturing: ['05', 'Manufacturing bay', 'The central bay represents additive manufacturing and fabrication concepts designed for orbital conditions.'],
  docking: ['06', 'Docking hub', 'A multi-port hub conceptually supports transfer, servicing and the movement of materials between vehicles.']
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

const contactForm = document.querySelector('form');
if (contactForm) contactForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const button = event.currentTarget.querySelector('button');
  button.disabled = true;
  try {
    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget)))
    });
    if (!response.ok) throw new Error('Transmission rejected');
    button.innerHTML = 'Transmission received <span>✓</span>';
    event.currentTarget.reset();
  } catch (error) {
    console.error(error);
    button.disabled = false;
    button.innerHTML = 'Retry transmission <span>↻</span>';
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
