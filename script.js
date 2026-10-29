const menuButton = document.querySelector(".menu-toggle");
const nav = document.querySelector(".nav");

if (menuButton && nav) {
  menuButton.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("open");
    menuButton.setAttribute("aria-expanded", String(isOpen));
    menuButton.querySelector("span").textContent = isOpen ? "−" : "＋";
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("open");
      menuButton.setAttribute("aria-expanded", "false");
      menuButton.querySelector("span").textContent = "＋";
    });
  });
}


// Each project's spotlight frame cycles through the original images already listed in its gallery.
// Controls are keyboard-accessible, and the carousel pauses while a user interacts with it.
document.querySelectorAll(".project-cover[data-carousel]").forEach((cover) => {
  const card = cover.closest(".project-card");
  const heroImage = cover.querySelector("img");
  if (!card || !heroImage) return;

  const galleryImages = Array.from(card.querySelectorAll(".project-gallery img"));
  const slides = [heroImage, ...galleryImages].map((img) => ({
    src: img.getAttribute("src"),
    alt: img.getAttribute("alt") || "Project image",
    caption: img.closest("figure")?.querySelector("figcaption")?.textContent?.trim() || img.getAttribute("alt") || "Project image",
  })).filter((slide, index, all) => slide.src && all.findIndex((candidate) => candidate.src === slide.src) === index);

  if (slides.length < 2) return;

  let current = 0;
  let timer = null;
  const originalLabel = cover.querySelector(".visual-label")?.textContent?.trim() || "PROJECT IMAGES";
  const label = cover.querySelector(".visual-label");
  const prev = document.createElement("button");
  prev.type = "button";
  prev.className = "carousel-control prev";
  prev.setAttribute("aria-label", "Previous project image");
  prev.innerHTML = "<span aria-hidden=\"true\">‹</span>";
  const next = document.createElement("button");
  next.type = "button";
  next.className = "carousel-control next";
  next.setAttribute("aria-label", "Next project image");
  next.innerHTML = "<span aria-hidden=\"true\">›</span>";
  const status = document.createElement("span");
  status.className = "carousel-status";
  status.setAttribute("aria-live", "polite");
  status.setAttribute("aria-atomic", "true");
  cover.append(prev, next, status);

  function showSlide(index) {
    current = (index + slides.length) % slides.length;
    const slide = slides[current];
    // Keep the current image fully visible while the next slide loads.
    // Dimming the image before preload can leave it faded if a remote image stalls.
    const preload = new Image();
    preload.onload = () => {
      heroImage.src = slide.src;
      heroImage.alt = slide.alt;
      heroImage.style.opacity = "1";
    };
    preload.onerror = () => {
      // If a slide cannot load, preserve the current image instead of fading it.
      heroImage.style.opacity = "1";
    };
    preload.src = slide.src;
    if (label) label.textContent = `${originalLabel} / ${slide.caption}`;
    status.textContent = `${String(current + 1).padStart(2, "0")} / ${String(slides.length).padStart(2, "0")}`;
    cover.setAttribute("aria-label", `${slide.caption}, image ${current + 1} of ${slides.length}`);
  }

  function stopTimer() {
    if (timer) window.clearInterval(timer);
    timer = null;
  }
  function startTimer() {
    stopTimer();
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      timer = window.setInterval(() => showSlide(current + 1), 5000);
    }
  }
  function move(event, direction) {
    event.preventDefault();
    event.stopPropagation();
    showSlide(current + direction);
    startTimer();
  }
  prev.addEventListener("click", (event) => move(event, -1));
  next.addEventListener("click", (event) => move(event, 1));
  [prev, next].forEach((button) => {
    button.addEventListener("focus", stopTimer);
    button.addEventListener("blur", startTimer);
  });
  cover.addEventListener("mouseenter", stopTimer);
  cover.addEventListener("mouseleave", startTimer);
  cover.addEventListener("focusin", stopTimer);
  cover.addEventListener("focusout", (event) => {
    if (!cover.contains(event.relatedTarget)) startTimer();
  });
  showSlide(0);
  startTimer();
});
