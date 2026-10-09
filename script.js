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
  topbar.classList.toggle('scrolled', window.scrollY > 30);
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