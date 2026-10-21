const root = document.documentElement;
const hero = document.querySelector("[data-hero]");
const soundButton = document.querySelector("[data-sound]");
const workSection = document.querySelector("#work");
const aboutSection = document.querySelector("#about");
const contactSection = document.querySelector("#contact");
const cursor = document.querySelector(".project-cursor");
const transitionLayer = document.querySelector(".page-transition");
const webglWrapper = document.querySelector("[data-webgl]");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

let audioContext;
let ambientGain;
let ambientNodes = [];
let soundOn = false;
let colorStepIndex = -1;
let pointerX = 0;
let pointerY = 0;
let cursorX = 0;
let cursorY = 0;

let scene;
let camera;
let renderer;
let clock;
let loadedSphere;
let copy01;
let copy02;
let copy03;
let material01;
let material02;
let material03;
let material04;

window.addEventListener("load", () => root.classList.add("is-ready"));

function clearPageTransition() {
  transitionLayer.style.transition = "none";
  transitionLayer.classList.remove("is-active");
  transitionLayer.style.setProperty("--transition-x", "50%");
  transitionLayer.style.setProperty("--transition-y", "50%");
  requestAnimationFrame(() => { transitionLayer.style.transition = ""; });
}

window.addEventListener("pagehide", () => {
  transitionLayer.style.transition = "none";
  transitionLayer.classList.remove("is-active");
});
window.addEventListener("pageshow", () => {
  clearPageTransition();
  if (window.location.hash === "#work") {
    requestAnimationFrame(() => workSection.scrollIntoView({ behavior: "auto" }));
  }
});

function setWebGLFallback() {
  hero.classList.add("webgl-failed");
}

function initWebGLBackground() {
  const isLocalFile = window.location.protocol === "file:";
  if (!window.THREE || !webglWrapper || (!isLocalFile && !THREE.OBJLoader)) {
    setWebGLFallback();
    return;
  }

  try {
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  } catch (error) {
    setWebGLFallback();
    return;
  }

  renderer.setSize(window.innerWidth, window.innerHeight);
  webglWrapper.appendChild(renderer.domElement);

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 10000);
  camera.position.y = 0;
  camera.position.z = 150;
  clock = new THREE.Clock();

  material01 = new THREE.MeshLambertMaterial({ color: 0x8d83d8, transparent: true, opacity: 1 });
  material02 = new THREE.MeshLambertMaterial({ color: 0xedc879, transparent: true, opacity: 1 });
  material03 = new THREE.MeshLambertMaterial({ color: 0xe99a87, transparent: true, opacity: 1 });
  material04 = new THREE.MeshLambertMaterial({ color: 0x9aa9a5, transparent: true, opacity: 1 });

  function mountSphereObject(object) {
    object.traverse((child) => {
      if (child instanceof THREE.Mesh) child.material = material01;
    });

    copy01 = object.clone();
    copy02 = object.clone();
    copy03 = object.clone();

    copy01.traverse((child) => {
      if (child instanceof THREE.Mesh) child.material = material04;
    });
    copy02.traverse((child) => {
      if (child instanceof THREE.Mesh) child.material = material02;
    });
    copy03.traverse((child) => {
      if (child instanceof THREE.Mesh) child.material = material03;
    });

    loadedSphere = object;
    loadedSphere.scale.set(50, 50, 50);
    loadedSphere.position.set(-40, 20, 0);
    loadedSphere.rotation.z = -45;

    copy01.scale.set(50, 50, 50);
    copy01.position.set(-30, -30, 0);

    copy02.scale.set(50, 50, 50);
    copy02.position.set(40, 0, -20);
    copy02.rotation.z = 45;

    copy03.scale.set(50, 50, 50);
    copy03.position.set(0, 0, -10);
    copy03.rotation.x = -60;

    scene.add(loadedSphere, copy01, copy02, copy03);
    hero.classList.add("webgl-ready");
  }

  if (isLocalFile) {
    const geometry = new THREE.SphereGeometry(
      1,
      48,
      23,
      0,
      Math.PI * 2,
      Math.PI * 0.54,
      Math.PI * 0.46
    );
    const localObject = new THREE.Group();
    localObject.add(new THREE.Mesh(geometry, material01));
    mountSphereObject(localObject);
  } else {
    const loader = new THREE.OBJLoader(new THREE.LoadingManager());
    loader.load(
      "reference-assets/obj/half_sphere.obj",
      mountSphereObject,
      undefined,
      setWebGLFallback
    );
  }

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.68);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.42);
  directionalLight.position.set(40, 200, 200);
  scene.add(directionalLight);

  document.addEventListener("mousemove", onDocumentMouseMove, false);
  if (window.innerWidth > 540) window.addEventListener("resize", onWindowResize, false);
  animateWebGL();
}

function onWindowResize() {
  if (!camera || !renderer) return;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function resetHeroLens() {
  hero.classList.remove("is-lens-active");
  hero.style.setProperty("--lens-x", "50%");
  hero.style.setProperty("--lens-y", "46%");
}

function onDocumentMouseMove(event) {
  if (hero && window.innerWidth > 540 && !reducedMotion.matches) {
    const heroRect = hero.getBoundingClientRect();
    const withinHero = event.clientX >= heroRect.left &&
      event.clientX <= heroRect.right &&
      event.clientY >= Math.max(heroRect.top, 68) &&
      event.clientY <= heroRect.bottom;
    if (!withinHero) {
      resetHeroLens();
      return;
    }
    const lensX = event.clientX - heroRect.left;
    const lensY = event.clientY - heroRect.top;
    hero.style.setProperty("--lens-x", `${lensX.toFixed(2)}px`);
    hero.style.setProperty("--lens-y", `${lensY.toFixed(2)}px`);
    hero.classList.add("is-lens-active");
  }
}

hero.addEventListener("pointerenter", () => hero.classList.add("is-lens-active"));
hero.addEventListener("pointerleave", resetHeroLens);

function animateWebGL() {
  window.setTimeout(() => requestAnimationFrame(animateWebGL), 1000 / 25);
  renderWebGL();
}

function renderWebGL() {
  if (!renderer || !scene || !camera || !clock) return;
  const delta = clock.getDelta();

  if (loadedSphere) {
    loadedSphere.rotation.y -= 0.5 * delta;
    loadedSphere.rotation.z += 0.3 * delta;
  }
  if (copy01) copy01.rotation.z += 0.5 * delta;
  if (copy02) {
    copy02.rotation.y += 0.3 * delta;
    copy02.rotation.z -= 0.4 * delta;
  }
  if (copy03) {
    copy03.rotation.y += 0.5 * delta;
    copy03.rotation.z -= 0.2 * delta;
  }

  camera.position.x += (0 - camera.position.x) / 20;
  camera.position.y += (0 - camera.position.y) / 20;
  camera.lookAt(scene.position);
  renderer.render(scene, camera);
}

function applyNextWebGLColor() {
  if (!material01) return;
  const colorSteps = [
    [material01, "rgb(126, 174, 156)"],
    [material02, "rgb(161, 137, 210)"],
    [material03, "rgb(126, 174, 211)"],
    [material04, "rgb(194, 132, 121)"],
    [material03, "rgb(226, 201, 125)"],
    [material02, "rgb(132, 148, 202)"],
    [material01, "rgb(222, 157, 124)"],
    [material04, "rgb(161, 181, 135)"],
    [material03, "rgb(210, 139, 139)"],
    [material02, "rgb(115, 177, 205)"]
  ];
  colorStepIndex = (colorStepIndex + 1) % colorSteps.length;
  const [material, color] = colorSteps[colorStepIndex];
  material.color.set(color);
}

function initWorkHoverFx() {
  const holder = document.querySelector("[data-work-hover-fx]");
  const workItems = [...document.querySelectorAll(".work-item[data-hover-images]")];
  const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (!holder || !workItems.length || !canHover || !window.PIXI || !PIXI.filters?.DisplacementFilter) return;

  root.classList.add("work-hover-enabled");
  PIXI.utils.skipHello();
  PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.LINEAR;

  const renderer = PIXI.autoDetectRenderer(window.innerWidth, window.innerHeight, {
    transparent: true,
    antialias: true,
    roundPixels: false,
    resolution: Math.min(window.devicePixelRatio || 1, 2),
    autoResize: true
  });
  holder.appendChild(renderer.view);

  const stage = new PIXI.Container();
  const imageContainer = new PIXI.Container();
  const imageCrop = new PIXI.Container();
  const imageSprite = new PIXI.Sprite();
  const imageMask = new PIXI.Graphics();
  imageSprite.anchor.set(0.5);
  imageCrop.addChild(imageSprite);
  imageCrop.addChild(imageMask);
  imageCrop.mask = imageMask;
  imageContainer.addChild(imageCrop);
  imageContainer.alpha = 0;
  stage.addChild(imageContainer);

  const textOverlay = document.createElement("div");
  const textMask = document.createElement("div");
  textOverlay.className = "work-hover-text";
  textOverlay.setAttribute("aria-hidden", "true");
  textMask.className = "work-hover-text-mask";
  textOverlay.appendChild(textMask);
  holder.insertAdjacentElement("afterend", textOverlay);

  const displacementTexture = PIXI.Texture.fromImage("reference-assets/work-fx/displacement.jpg");
  displacementTexture.baseTexture.wrapMode = PIXI.WRAP_MODES.REPEAT;
  const displacementSprite = new PIXI.Sprite(displacementTexture);
  displacementSprite.width = window.innerWidth;
  displacementSprite.height = window.innerHeight;
  stage.addChild(displacementSprite);

  const displacementFilter = new PIXI.filters.DisplacementFilter(displacementSprite);
  imageContainer.filters = [displacementFilter];

  let activeItem = null;
  let activeTarget = null;
  let activeTextures = [];
  let activeImageIndex = -1;
  let hideTimer = 0;
  let pointerTargetX = window.innerWidth / 2;
  let pointerTargetY = window.innerHeight / 2;
  let easedMouseX = pointerTargetX;
  let easedMouseY = pointerTargetY;
  let imageX = pointerTargetX;
  let imageY = pointerTargetY;
  let settleX = 50;
  let settleY = -50;
  let visibleImageWidth = 0;
  let visibleImageHeight = 0;
  let activeTextClone = null;

  const textureCache = new Map();
  const getTexture = (src) => {
    if (!textureCache.has(src)) textureCache.set(src, PIXI.Texture.fromImage(src));
    return textureCache.get(src);
  };

  const resizeSprite = () => {
    const texture = imageSprite.texture;
    visibleImageHeight = window.innerHeight * 0.59;
    visibleImageWidth = visibleImageHeight * 1.28;
    imageMask.clear();
    imageMask.beginFill(0xffffff, 1);
    imageMask.drawRect(
      visibleImageWidth * -0.5,
      visibleImageHeight * -0.5,
      visibleImageWidth,
      visibleImageHeight
    );
    imageMask.endFill();
    if (!texture?.baseTexture?.hasLoaded || !texture.width || !texture.height) return;
    const naturalAspect = texture.width / texture.height;
    const frameAspect = visibleImageWidth / visibleImageHeight;
    if (naturalAspect >= frameAspect) {
      imageSprite.height = visibleImageHeight;
      imageSprite.width = visibleImageHeight * naturalAspect;
    } else {
      imageSprite.width = visibleImageWidth;
      imageSprite.height = visibleImageWidth / naturalAspect;
    }
  };

  const setActiveText = (target) => {
    textMask.replaceChildren();
    activeTextClone = target.cloneNode(true);
    activeTextClone.classList.add("work-hover-text-clone");
    activeTextClone.setAttribute("aria-hidden", "true");
    textMask.appendChild(activeTextClone);
  };

  const syncTextMask = () => {
    if (!activeTarget || !activeTextClone || !visibleImageWidth || !visibleImageHeight) return;
    const maskLeft = imageX - visibleImageWidth * 0.5;
    const maskTop = imageY - visibleImageHeight * 0.5;
    const targetRect = activeTarget.getBoundingClientRect();
    textMask.style.width = `${visibleImageWidth}px`;
    textMask.style.height = `${visibleImageHeight}px`;
    textMask.style.opacity = "1";
    textMask.style.transform = `translate3d(${maskLeft}px, ${maskTop}px, 0)`;
    activeTextClone.style.width = `${targetRect.width}px`;
    activeTextClone.style.transform = `translate3d(${targetRect.left - maskLeft}px, ${targetRect.top - maskTop}px, 0)`;
  };

  const showTexture = (index) => {
    if (!activeTextures.length || index === activeImageIndex) return;
    activeImageIndex = index;
    const texture = activeTextures[index];
    imageSprite.texture = texture;
    if (texture.baseTexture.hasLoaded) resizeSprite();
    else texture.baseTexture.once("loaded", resizeSprite);
  };

  const updateImageInterval = (clientX) => {
    if (!activeTarget || !activeTextures.length) return;
    const rect = activeTarget.getBoundingClientRect();
    const relativeX = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const interval = window.innerWidth * 0.098;
    const index = Math.floor(relativeX / interval) % activeTextures.length;
    showTexture(index);
  };

  const hideActive = () => {
    if (activeItem) activeItem.classList.remove("is-hovered");
    activeItem = null;
    activeTarget = null;
    activeTextures = [];
    activeImageIndex = -1;
    imageContainer.alpha = 0;
    textMask.style.opacity = "0";
    textMask.replaceChildren();
    activeTextClone = null;
    settleX = 50;
    settleY = -50;
  };

  workItems.forEach((item) => {
    const target = item.querySelector(".work-inner");
    const paths = item.dataset.hoverImages.split("|").filter(Boolean);
    const textures = paths.map(getTexture);
    if (!target || !textures.length) return;

    target.addEventListener("pointerenter", (event) => {
      window.clearTimeout(hideTimer);
      if (activeItem && activeItem !== item) activeItem.classList.remove("is-hovered");
      activeItem = item;
      activeTarget = target;
      activeTextures = textures;
      activeImageIndex = -1;
      pointerTargetX = event.clientX;
      pointerTargetY = event.clientY;
      imageX = event.clientX;
      imageY = event.clientY;
      imageContainer.position.set(imageX, imageY);
      imageContainer.alpha = 1;
      item.classList.add("is-hovered");
      setActiveText(target);
      updateImageInterval(event.clientX);
      resizeSprite();
      syncTextMask();
    });

    target.addEventListener("pointermove", (event) => {
      pointerTargetX = event.clientX;
      pointerTargetY = event.clientY;
      updateImageInterval(event.clientX);
    });

    target.addEventListener("pointerleave", () => {
      window.clearTimeout(hideTimer);
      hideTimer = window.setTimeout(hideActive, 60);
    });
  });

  document.addEventListener("pointermove", (event) => {
    pointerTargetX = event.clientX;
    pointerTargetY = event.clientY;
  }, { passive: true });

  window.addEventListener("scroll", hideActive, { passive: true });
  window.addEventListener("resize", () => {
    renderer.resize(window.innerWidth, window.innerHeight);
    displacementSprite.width = window.innerWidth;
    displacementSprite.height = window.innerHeight;
    resizeSprite();
    syncTextMask();
  });

  const renderWorkHover = () => {
    easedMouseX += (pointerTargetX - easedMouseX) * 0.16;
    easedMouseY += (pointerTargetY - easedMouseY) * 0.16;
    imageX += (pointerTargetX - imageX) * 0.22;
    imageY += (pointerTargetY - imageY) * 0.22;
    imageContainer.position.set(imageX, imageY);
    syncTextMask();

    settleX += (0 - settleX) * 0.045;
    settleY += (0 - settleY) * 0.045;
    displacementFilter.scale.x = 1 + (pointerTargetX - easedMouseX) + settleX;
    displacementFilter.scale.y = 1 + (pointerTargetY - easedMouseY) + settleY;

    renderer.render(stage);
    requestAnimationFrame(renderWorkHover);
  };
  renderWorkHover();
}

function initGroteskWorkHover() {
  const work = document.querySelector("#work");
  const holder = document.querySelector("[data-work-hover-fx]");
  const workItems = [...document.querySelectorAll(".work-item[data-hover-image]")];
  const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (!work || !holder || !workItems.length || !canHover) return;

  root.classList.add("work-hover-enabled");

  const preview = document.createElement("img");
  preview.className = "work-preview-image";
  preview.alt = "";
  preview.draggable = false;
  preview.setAttribute("aria-hidden", "true");
  holder.replaceChildren(preview);

  let activeItem = null;
  let hideTimer = 0;

  const placeScribble = (item) => {
    const inner = item.querySelector(".work-inner");
    const title = item.querySelector(".work-title-art");
    const scribble = item.querySelector(".work-scribble");
    if (!inner || !title || !scribble) return;
    const innerRect = inner.getBoundingClientRect();
    const titleRect = title.getBoundingClientRect();
    scribble.style.left = `${titleRect.left - innerRect.left - 16}px`;
    scribble.style.top = `${titleRect.top - innerRect.top - 11}px`;
    scribble.style.width = `${titleRect.width + 32}px`;
    scribble.style.height = `${titleRect.height + 22}px`;
  };

  const showItem = (item) => {
    window.clearTimeout(hideTimer);
    if (activeItem && activeItem !== item) activeItem.classList.remove("is-hovered");
    activeItem = item;
    work.style.backgroundColor = item.dataset.hoverColor || "";
    placeScribble(item);
    item.classList.add("is-hovered");
    const previewScale = Number.parseFloat(item.dataset.hoverScale || "1");
    preview.style.setProperty("--preview-scale", String(previewScale));
    preview.style.setProperty("--preview-enter-scale", String(previewScale * 0.94));

    const nextSrc = item.dataset.hoverImage;
    if (preview.getAttribute("src") !== nextSrc) {
      holder.classList.remove("is-visible");
      preview.src = nextSrc;
      requestAnimationFrame(() => requestAnimationFrame(() => holder.classList.add("is-visible")));
    } else {
      holder.classList.add("is-visible");
    }
  };

  const hideActive = () => {
    if (activeItem) activeItem.classList.remove("is-hovered");
    activeItem = null;
    holder.classList.remove("is-visible");
    work.style.backgroundColor = "";
  };

  workItems.forEach((item) => {
    const scribble = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    scribble.classList.add("work-scribble");
    scribble.setAttribute("viewBox", "0 0 100 44");
    scribble.setAttribute("preserveAspectRatio", "none");
    scribble.setAttribute("aria-hidden", "true");
    scribble.innerHTML = `
      <path pathLength="1" d="M2 23 C10 1 82 -3 98 20 C88 44 16 47 2 23" />
      <path pathLength="1" d="M1 26 C18 6 86 3 99 24 C78 42 12 43 1 26" />`;
    item.querySelector(".work-inner")?.appendChild(scribble);

    const preload = new Image();
    preload.src = item.dataset.hoverImage;

    item.addEventListener("pointerenter", () => showItem(item));
    item.addEventListener("pointerleave", () => {
      window.clearTimeout(hideTimer);
      hideTimer = window.setTimeout(hideActive, 90);
    });
    item.addEventListener("focus", () => showItem(item));
    item.addEventListener("blur", hideActive);
  });

  window.addEventListener("resize", () => {
    if (activeItem) placeScribble(activeItem);
  });
  window.addEventListener("scroll", hideActive, { passive: true });
}

function ensureAudio() {
  if (audioContext) return;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  audioContext = new AudioContext();
  ambientGain = audioContext.createGain();
  ambientGain.gain.value = 0;
  ambientGain.connect(audioContext.destination);

  [55, 82.5].forEach((frequency, index) => {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = index ? "triangle" : "sine";
    oscillator.frequency.value = frequency;
    gain.gain.value = index ? 0.018 : 0.026;
    oscillator.connect(gain).connect(ambientGain);
    oscillator.start();
    ambientNodes.push(oscillator, gain);
  });
}

function setSound(nextValue) {
  ensureAudio();
  if (!audioContext || !ambientGain) return;
  if (audioContext.state === "suspended") audioContext.resume();
  soundOn = nextValue;
  const now = audioContext.currentTime;
  ambientGain.gain.cancelScheduledValues(now);
  ambientGain.gain.setValueAtTime(ambientGain.gain.value, now);
  ambientGain.gain.linearRampToValueAtTime(soundOn ? 0.44 : 0, now + 0.55);
  soundButton.classList.toggle("is-on", soundOn);
  soundButton.setAttribute("aria-pressed", String(soundOn));
  soundButton.setAttribute("aria-label", soundOn ? "关闭声音" : "打开声音");
}

function playNote() {
  ensureAudio();
  if (!audioContext || !soundOn) return;
  const frequencies = [164.81, 196, 220, 261.63, 293.66];
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const now = audioContext.currentTime;
  oscillator.type = "sine";
  oscillator.frequency.value = frequencies[Math.max(colorStepIndex, 0) % frequencies.length];
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.055, now + 0.025);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
  oscillator.connect(gain).connect(audioContext.destination);
  oscillator.start(now);
  oscillator.stop(now + 0.52);
}

hero.addEventListener("click", (event) => {
  if (event.target.closest("button")) return;
  if (!soundOn) setSound(true);
  applyNextWebGLColor();
  playNote();
});

soundButton.addEventListener("click", (event) => {
  event.stopPropagation();
  setSound(!soundOn);
  if (!soundOn) return;
  playNote();
});

document.querySelector("[data-scroll-work]").addEventListener("click", () => {
  workSection.scrollIntoView({ behavior: "smooth" });
});

document.querySelector("[data-scroll-home]").addEventListener("click", () => {
  hero.scrollIntoView({ behavior: "smooth" });
});

document.querySelectorAll("[data-scroll-about]").forEach((button) => {
  button.addEventListener("click", () => aboutSection.scrollIntoView({ behavior: "smooth" }));
});

document.querySelector("[data-scroll-contact]").addEventListener("click", () => {
  contactSection.scrollIntoView({ behavior: "smooth" });
});

const navSections = [
  ["top", hero, document.querySelector("[data-scroll-home]")],
  ["work", workSection, document.querySelector("[data-scroll-work]")],
  ["about", aboutSection, document.querySelector("[data-scroll-about]")],
  ["contact", contactSection, document.querySelector("[data-scroll-contact]")]
];
let activeNavId = "";
let navScrollFrame = 0;

function setActiveNav(id) {
  if (id === activeNavId) return;
  activeNavId = id;
  navSections.forEach(([sectionId, , button]) => {
    const isActive = sectionId === id;
    if (isActive) button.setAttribute("aria-current", "location");
    else button.removeAttribute("aria-current");
  });
}

function updateActiveNav() {
  navScrollFrame = 0;
  const nav = document.querySelector(".nav");
  const navOffset = (nav?.offsetHeight || 0) + 2;
  const viewportReadingLine = Math.max(navOffset, window.innerHeight * 0.35);
  const marker = window.scrollY + viewportReadingLine;
  let currentId = "top";

  navSections.forEach(([sectionId, section]) => {
    if (marker >= section.offsetTop) currentId = sectionId;
  });

  const pageBottom = window.scrollY + window.innerHeight;
  if (pageBottom >= document.documentElement.scrollHeight - 2) currentId = "contact";
  setActiveNav(currentId);
}

function requestActiveNavUpdate() {
  if (navScrollFrame) return;
  navScrollFrame = requestAnimationFrame(updateActiveNav);
}

window.addEventListener("scroll", requestActiveNavUpdate, { passive: true });
window.addEventListener("resize", requestActiveNavUpdate);
window.addEventListener("pageshow", requestActiveNavUpdate);
updateActiveNav();

const workObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add("is-visible");
      else if (entry.boundingClientRect.top > window.innerHeight) entry.target.classList.remove("is-visible");
    });
  },
  { threshold: 0.2, rootMargin: "0px 0px -7%" }
);
document.querySelectorAll(".work-item").forEach((item) => workObserver.observe(item));

const heroObserver = new IntersectionObserver(
  ([entry]) => {
    if (!entry.isIntersecting && soundOn) setSound(false);
  },
  { threshold: 0.05 }
);
heroObserver.observe(hero);

const aboutObserver = new IntersectionObserver(
  ([entry]) => root.classList.toggle("is-about-view", entry.isIntersecting && entry.intersectionRatio >= 0.5),
  { threshold: [0, 0.5, 1] }
);
aboutObserver.observe(aboutSection);

const contactObserver = new IntersectionObserver(
  ([entry]) => contactSection.classList.toggle("is-visible", entry.isIntersecting),
  { threshold: 0.15 }
);
contactObserver.observe(contactSection);

document.addEventListener("pointermove", (event) => {
  pointerX = event.pageX;
  pointerY = event.pageY;
});

function animateCursor() {
  cursorX += (pointerX - cursorX) * 0.16;
  cursorY += (pointerY - cursorY) * 0.16;
  cursor.style.left = `${cursorX}px`;
  cursor.style.top = `${cursorY}px`;
  requestAnimationFrame(animateCursor);
}
animateCursor();

document.querySelectorAll("[data-project]").forEach((project) => {
  project.addEventListener("pointerenter", () => cursor.classList.add("is-visible"));
  project.addEventListener("pointerleave", () => cursor.classList.remove("is-visible"));
  project.addEventListener("click", (event) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    cursor.classList.remove("is-visible");
    if (window.location.hash !== "#work") {
      window.history.replaceState(window.history.state, "", `${window.location.pathname}${window.location.search}#work`);
    }
    transitionLayer.style.setProperty("--transition-x", `${event.clientX}px`);
    transitionLayer.style.setProperty("--transition-y", `${event.clientY}px`);
    transitionLayer.classList.add("is-active");
    window.setTimeout(() => { window.location.href = project.href; }, 600);
  });
});

initGroteskWorkHover();
initWebGLBackground();
