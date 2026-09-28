/* 3D background (Three.js) + tilt, reveal, cursor glow, scroll bar. Does not touch chatbot logic in script.js */
(function () {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mobile = innerWidth < 768;

  // scroll progress + cursor glow
  const bar = document.body.appendChild(Object.assign(document.createElement("div"), { id: "scrollBar" }));
  const glow = document.body.appendChild(Object.assign(document.createElement("div"), { id: "cursorGlow" }));
  addEventListener("scroll", () => {
    const h = document.documentElement;
    bar.style.width = (h.scrollTop / (h.scrollHeight - h.clientHeight || 1)) * 100 + "%";
  }, { passive: true });
  addEventListener("pointermove", e => { glow.style.transform = `translate(${e.clientX}px,${e.clientY}px)`; }, { passive: true });

  // Interactive controls: small magnetic pull and click feedback.
  if (!reduce && matchMedia("(pointer: fine)").matches) {
    document.querySelectorAll(".btn").forEach(button => {
      button.addEventListener("pointermove", e => {
        const r = button.getBoundingClientRect();
        const x = ((e.clientX - r.left) / r.width - .5) * 8;
        const y = ((e.clientY - r.top) / r.height - .5) * 8;
        button.style.setProperty("--mag-x", `${x}px`);
        button.style.setProperty("--mag-y", `${y}px`);
      });
      button.addEventListener("pointerleave", () => {
        button.style.setProperty("--mag-x", "0px");
        button.style.setProperty("--mag-y", "0px");
      });
    });
  }

  document.querySelectorAll(".btn").forEach(button => {
    button.addEventListener("click", e => {
      const r = button.getBoundingClientRect();
      const ripple = document.createElement("span");
      ripple.className = "click-ripple";
      ripple.style.left = `${e.clientX - r.left}px`;
      ripple.style.top = `${e.clientY - r.top}px`;
      button.appendChild(ripple);
      ripple.addEventListener("animationend", () => ripple.remove(), { once: true });
    });
  });

  // Keep the navigation feeling connected to the section currently in view.
  const sections = [...document.querySelectorAll("section[id]")];
  const sectionLinks = [...document.querySelectorAll(".nav-menu a")];
  if (sections.length && sectionLinks.length && "IntersectionObserver" in window) {
    const activeObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        sectionLinks.forEach(link => link.classList.toggle("current", link.hash === `#${entry.target.id}`));
      });
    }, { rootMargin: "-35% 0px -55%", threshold: 0 });
    sections.forEach(section => activeObserver.observe(section));
  }

  // 3D tilt on cards
  document.querySelectorAll(".skill-card,.project-card,.education-card").forEach(el => {
    el.addEventListener("pointermove", e => {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--ry", ((e.clientX - r.left) / r.width - .5) * 16 + "deg");
      el.style.setProperty("--rx", (.5 - (e.clientY - r.top) / r.height) * 16 + "deg");
    });
    el.addEventListener("pointerleave", () => { el.style.setProperty("--rx", "0deg"); el.style.setProperty("--ry", "0deg"); });
  });

  // 3D reveal on scroll
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: .12 });
  document.querySelectorAll(".section-title,.section h2,.skill-card,.project-card,.education-card,.about-text,.contact-buttons")
    .forEach((el, i) => { el.classList.add("reveal3d"); el.style.transitionDelay = (i % 4) * 80 + "ms"; io.observe(el); });
})();
