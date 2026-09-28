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

  // Three.js scene: every object is FIXED in place, it only rotates/pulses (no scroll or mouse movement)
  if (reduce || typeof THREE === "undefined") return;
  const canvas = document.body.appendChild(Object.assign(document.createElement("canvas"), { id: "bg3d" }));
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: !mobile });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(50, 1, .1, 200);
  cam.position.set(0, 0, 16);

  const hero = new THREE.Group();          // the main 3D piece, locked to one spot
  scene.add(hero);
  const wire = (c, o) => new THREE.MeshBasicMaterial({ color: c, wireframe: true, transparent: true, opacity: o });

  // glowing fresnel orb in the centre
  const orb = new THREE.Mesh(new THREE.SphereGeometry(1.5, 48, 48), new THREE.ShaderMaterial({
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
    uniforms: { t: { value: 0 } },
    vertexShader: "varying vec3 n;varying vec3 v;void main(){n=normalize(normalMatrix*normal);vec4 p=modelViewMatrix*vec4(position,1.);v=-p.xyz;gl_Position=projectionMatrix*p;}",
    fragmentShader: "uniform float t;varying vec3 n;varying vec3 v;void main(){float f=pow(1.-abs(dot(normalize(n),normalize(v))),2.2);vec3 a=vec3(.22,.74,.97);vec3 b=vec3(.96,.45,.71);gl_FragColor=vec4(mix(a,b,.5+.5*sin(t)),1.)*(f*1.6+.18);}"
  }));
  hero.add(orb);

  const knot = new THREE.Mesh(new THREE.TorusKnotGeometry(2.6, .5, mobile ? 100 : 200, 20, 2, 3), wire(0x38bdf8, .5));
  const knot2 = new THREE.Mesh(new THREE.TorusKnotGeometry(2.6, .52, mobile ? 100 : 200, 20, 2, 3), wire(0xf472b6, .18));
  hero.add(knot, knot2);

  const rings = [0x8b5cf6, 0x38bdf8, 0xf472b6].map((c, i) => {
    const r = new THREE.Mesh(new THREE.TorusGeometry(3.6 + i * .55, .018, 8, 140), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: .75 }));
    r.rotation.set(i * 1.05, i * .6, 0); hero.add(r); return r;
  });

  // small glowing satellites orbiting inside the piece
  const sats = [];
  for (let i = 0; i < 6; i++) {
    const m = new THREE.Mesh(new THREE.OctahedronGeometry(.16), new THREE.MeshBasicMaterial({ color: [0x38bdf8, 0x8b5cf6, 0xf472b6][i % 3] }));
    m.userData = { r: 3.6 + (i % 3) * .55, s: .6 + i * .12, o: i * 1.05, tilt: (i % 3) * 1.05 };
    sats.push(m); hero.add(m);
  }

  // static, softly twinkling star field (does not move)
  const N = mobile ? 400 : 1200, pos = new Float32Array(N * 3);
  for (let i = 0; i < N * 3; i += 3) { pos[i] = (Math.random() - .5) * 50; pos[i + 1] = (Math.random() - .5) * 30; pos[i + 2] = -Math.random() * 25; }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const stars = new THREE.Points(g, new THREE.PointsMaterial({ color: 0x9ec5ff, size: .06, transparent: true, opacity: .7 }));
  scene.add(stars);

  const place = () => {
    renderer.setSize(innerWidth, innerHeight, false);
    cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix();
    const wide = innerWidth >= 900;
    hero.position.set(wide ? 6.2 : 0, wide ? 0 : 3.2, -2);   // fixed spot: right side on desktop, top on mobile
    hero.scale.setScalar(wide ? 1 : .7);
    canvas.style.opacity = wide ? 1 : .55;
  };
  addEventListener("resize", place); place();

  const clock = new THREE.Clock();
  (function loop() {
    const t = clock.getElapsedTime();
    knot.rotation.set(t * .18, t * .28, 0);
    knot2.rotation.set(t * .18 + .05, t * .28 + .05, 0);
    orb.material.uniforms.t.value = t * .8;
    orb.scale.setScalar(1 + Math.sin(t * 1.6) * .06);
    rings.forEach((r, i) => { r.rotation.z = t * (.25 + i * .12) * (i % 2 ? -1 : 1); });
    sats.forEach(m => {
      const a = t * m.userData.s + m.userData.o;
      m.position.set(Math.cos(a) * m.userData.r, Math.sin(a) * m.userData.r * Math.cos(m.userData.tilt), Math.sin(a) * m.userData.r * Math.sin(m.userData.tilt));
      m.rotation.set(a, a, 0);
    });
    stars.material.opacity = .55 + Math.sin(t * 1.2) * .15;
    renderer.render(scene, cam);
    requestAnimationFrame(loop);
  })();
})();
