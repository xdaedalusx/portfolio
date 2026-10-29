const menuButton = document.querySelector(".menu-toggle");
const nav = document.querySelector(".nav");

if (menuButton && nav) {
  menuButton.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("open");
    menuButton.setAttribute("aria-expanded", String(isOpen));
    menuButton.querySelector("span").textContent = isOpen ? "−" : "＋";
  });
  nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => {
    nav.classList.remove("open");
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.querySelector("span").textContent = "＋";
  }));
}


// Global featured carousel: each project gets a turn in the large presentation above the full collection.
(() => {
  const stage = document.querySelector('.featured-project-stage');
  const collection = document.querySelector('.project-grid');
  if (!stage || !collection) return;
  const cards = Array.from(collection.querySelectorAll(':scope > .project-card'));
  const media = stage.querySelector('.featured-project-media');
  const info = stage.querySelector('.featured-project-info');
  const link = stage.querySelector('.featured-project-link');
  const currentLabel = stage.querySelector('.featured-project-current');
  const totalLabel = stage.querySelector('.featured-project-total');
  const progress = stage.querySelector('.featured-project-progress');
  const prev = stage.querySelector('.featured-project-prev');
  const next = stage.querySelector('.featured-project-next');
  const projects = cards.map((card) => {
    const cover = card.querySelector('.project-cover');
    const img = cover && cover.querySelector('img');
    const projectInfo = card.querySelector('.project-info');
    return {
      href: card.getAttribute('href') || '#work',
      title: projectInfo?.querySelector('h3')?.innerText?.replace(/\s+/g, ' ').trim() || 'Project',
      infoHTML: projectInfo?.innerHTML || '',
      image: img?.getAttribute('src') || null,
      alt: img?.getAttribute('alt') || 'Project preview',
      fallbackHTML: !img && cover ? cover.innerHTML : ''
    };
  });
  if (!projects.length) return;
  let active = 0;
  let timer = null;
  totalLabel.textContent = String(projects.length).padStart(2, '0');
  const collectionCount = document.querySelector('.project-collection-count');
  if (collectionCount) collectionCount.textContent = String(projects.length).padStart(2, '0');

  const dots = projects.map((project, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'featured-project-dot';
    dot.setAttribute('aria-label', `Show featured project ${i + 1}: ${project.title}`);
    dot.addEventListener('click', () => { render(i); restart(); });
    progress.append(dot);
    return dot;
  });

  function render(index) {
    active = (index + projects.length) % projects.length;
    const project = projects[active];
    link.href = project.href;
    link.setAttribute('aria-label', `View ${project.title}`);
    info.innerHTML = project.infoHTML;
    media.replaceChildren();
    if (project.image) {
      const img = document.createElement('img');
      img.src = project.image;
      img.alt = project.alt;
      img.loading = 'eager';
      img.decoding = 'async';
      media.append(img);
    } else if (project.fallbackHTML) {
      media.innerHTML = project.fallbackHTML;
    }
    currentLabel.textContent = String(active + 1).padStart(2, '0');
    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === active);
      dot.setAttribute('aria-current', i === active ? 'true' : 'false');
    });
    stage.setAttribute('aria-label', `Featured project ${active + 1} of ${projects.length}: ${project.title}`);
  }
  function stop() { if (timer) clearInterval(timer); timer = null; }
  function restart() {
    stop();
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) timer = setInterval(() => render(active + 1), 7000);
  }
  prev.addEventListener('click', (event) => { event.preventDefault(); event.stopPropagation(); render(active - 1); restart(); });
  next.addEventListener('click', (event) => { event.preventDefault(); event.stopPropagation(); render(active + 1); restart(); });
  stage.addEventListener('mouseenter', stop);
  stage.addEventListener('mouseleave', restart);
  stage.addEventListener('focusin', stop);
  stage.addEventListener('focusout', (event) => { if (!stage.contains(event.relatedTarget)) restart(); });
  render(0);
  restart();
})();

// Project image carousels: full images stay visible; controls never add a title overlay.
document.querySelectorAll(".project-cover[data-carousel]").forEach((cover) => {
  const card = cover.closest(".project-card");
  const heroImage = cover.querySelector("img");
  if (!card || !heroImage) return;
  const galleryImages = Array.from(card.querySelectorAll(".project-gallery img"));
  const slides = [heroImage, ...galleryImages].map((img) => ({
    src: img.getAttribute("src"),
    alt: img.getAttribute("alt") || "Project image"
  })).filter((slide, index, all) => slide.src && all.findIndex((s) => s.src === slide.src) === index);
  if (slides.length < 2) return;

  let current = 0;
  let timer = null;
  const prev = document.createElement("button");
  prev.type = "button"; prev.className = "carousel-control prev";
  prev.setAttribute("aria-label", "Previous project image");
  prev.innerHTML = '<span aria-hidden="true">‹</span>';
  const next = document.createElement("button");
  next.type = "button"; next.className = "carousel-control next";
  next.setAttribute("aria-label", "Next project image");
  next.innerHTML = '<span aria-hidden="true">›</span>';
  const status = document.createElement("span");
  status.className = "carousel-status";
  status.setAttribute("aria-live", "polite");
  status.setAttribute("aria-atomic", "true");
  cover.append(prev, next, status);

  function showSlide(index) {
    current = (index + slides.length) % slides.length;
    const slide = slides[current];
    // Preload before swapping, with no opacity change, to avoid the old gray/dim effect.
    const preload = new Image();
    preload.onload = () => { heroImage.src = slide.src; heroImage.alt = slide.alt; };
    preload.onerror = () => { heroImage.src = slide.src; heroImage.alt = slide.alt; };
    preload.src = slide.src;
    status.textContent = `${String(current + 1).padStart(2, "0")} / ${String(slides.length).padStart(2, "0")}`;
    cover.setAttribute("aria-label", `${slide.alt}, image ${current + 1} of ${slides.length}`);
  }
  function stopTimer() { if (timer) window.clearInterval(timer); timer = null; }
  function startTimer() {
    stopTimer();
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) timer = window.setInterval(() => showSlide(current + 1), 5000);
  }
  function move(event, direction) { event.preventDefault(); event.stopPropagation(); showSlide(current + direction); startTimer(); }
  prev.addEventListener("click", (event) => move(event, -1));
  next.addEventListener("click", (event) => move(event, 1));
  [prev, next].forEach((button) => { button.addEventListener("focus", stopTimer); button.addEventListener("blur", startTimer); });
  cover.addEventListener("mouseenter", stopTimer);
  cover.addEventListener("mouseleave", startTimer);
  cover.addEventListener("focusin", stopTimer);
  cover.addEventListener("focusout", (event) => { if (!cover.contains(event.relatedTarget)) startTimer(); });
  showSlide(0); startTimer();
});
