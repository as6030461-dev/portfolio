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

  // Three.js scene
  if (reduce || typeof THREE === "undefined") return;
  const canvas = document.body.appendChild(Object.assign(document.createElement("canvas"), { id: "bg3d" }));
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: !mobile });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(60, 1, .1, 200);
  cam.position.z = 14;

  const mat = (c, o = .8) => new THREE.MeshBasicMaterial({ color: c, wireframe: true, transparent: true, opacity: o });
  const knot = new THREE.Mesh(new THREE.TorusKnotGeometry(2.4, .65, mobile ? 90 : 160, 16), mat(0x38bdf8, .55));
  knot.position.set(5.5, 0, -2);
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(1.3, 1), mat(0xf472b6, .7));
  core.position.copy(knot.position);
  scene.add(knot, core);

  const shapes = [];
  const geos = [new THREE.OctahedronGeometry(.6), new THREE.BoxGeometry(.8, .8, .8), new THREE.TetrahedronGeometry(.7), new THREE.TorusGeometry(.5, .16, 8, 24)];
  const cols = [0x38bdf8, 0x8b5cf6, 0xf472b6];
  for (let i = 0; i < (mobile ? 10 : 22); i++) {
    const m = new THREE.Mesh(geos[i % 4], mat(cols[i % 3], .6));
    m.position.set((Math.random() - .5) * 34, (Math.random() - .5) * 60, -Math.random() * 14 - 2);
    m.userData = { s: .2 + Math.random() * .6, y: m.position.y };
    shapes.push(m); scene.add(m);
  }

  const N = mobile ? 500 : 1400, pos = new Float32Array(N * 3);
  for (let i = 0; i < N * 3; i += 3) { pos[i] = (Math.random() - .5) * 60; pos[i + 1] = (Math.random() - .5) * 90; pos[i + 2] = (Math.random() - .5) * 40 - 5; }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const stars = new THREE.Points(g, new THREE.PointsMaterial({ color: 0x9ec5ff, size: .07, transparent: true, opacity: .8 }));
  scene.add(stars);

  let mx = 0, my = 0;
  addEventListener("pointermove", e => { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; }, { passive: true });
  const resize = () => { renderer.setSize(innerWidth, innerHeight, false); cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix(); knot.position.x = core.position.x = innerWidth < 900 ? 0 : 5.5; };
  addEventListener("resize", resize); resize();

  const clock = new THREE.Clock();
  (function loop() {
    const t = clock.getElapsedTime(), sy = scrollY;
    knot.rotation.x = t * .25 + sy * .0008; knot.rotation.y = t * .35;
    core.rotation.y = -t * .6; core.scale.setScalar(1 + Math.sin(t * 2) * .08);
    knot.position.y = core.position.y = Math.sin(t * .8) * .4 - sy * .004;
    shapes.forEach((m, i) => { m.rotation.x += .004 * m.userData.s * 3; m.rotation.y += .006; m.position.y = m.userData.y + Math.sin(t * m.userData.s + i) * .6 + sy * .006 * m.userData.s; });
    stars.rotation.y = t * .01;
    cam.position.x += (mx * 2.2 - cam.position.x) * .04;
    cam.position.y += (-my * 1.5 - sy * .002 - cam.position.y) * .04;
    cam.lookAt(0, cam.position.y * .5, 0);
    renderer.render(scene, cam);
    requestAnimationFrame(loop);
  })();
})();
