const projectBack = document.querySelector("[data-project-back]");
const projectImages = [...document.querySelectorAll(".project-story img")];
const projectSequence = [
  ["project-posting.html", "project-ai-service.html?v=20261020-2", "AI智能客服"],
  ["project-ai-service.html", "project-metrics.html?v=20261020-2", "数据产品 度量衡"],
  ["project-metrics.html", "project-crspy-meeting.html?v=20261020-2", "CRSPY AI会议"],
  ["project-crspy-meeting.html", "project-aigc.html?v=20261020-2", "AIGC和其他"],
  ["project-aigc.html", "project-posting.html?v=20261020-2", "发文体验重构"]
];

const currentProject = projectSequence.find(([file]) => window.location.pathname.endsWith(`/${file}`));
if (currentProject) {
  const [, nextHref, nextTitle] = currentProject;
  const nextProject = document.createElement("a");
  nextProject.className = "project-next";
  nextProject.href = nextHref;
  nextProject.innerHTML = `
    <span class="project-next-inner">
      <span class="project-next-label">NEXT PROJECT</span>
      <strong class="project-next-title">${nextTitle}</strong>
      <span class="project-next-arrow" aria-hidden="true">↗</span>
    </span>`;
  document.body.appendChild(nextProject);
}

if (projectImages.length) {
  const progress = document.createElement("div");
  progress.className = "project-progress";
  progress.setAttribute("aria-hidden", "true");
  progress.innerHTML = '<span class="project-progress-track"><i></i></span><em>01 / 01</em>';
  document.body.appendChild(progress);

  const count = progress.querySelector("em");
  const formatPage = (value) => String(value).padStart(2, "0");
  const updateProgress = () => {
    const scrollable = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const ratio = Math.min(1, Math.max(0, window.scrollY / scrollable));
    progress.style.setProperty("--project-progress", ratio.toFixed(4));
    const readingLine = window.scrollY + window.innerHeight * .38;
    let current = 0;
    projectImages.forEach((image, index) => {
      if (image.offsetTop <= readingLine) current = index;
    });
    count.textContent = `${formatPage(current + 1)} / ${formatPage(projectImages.length)}`;
  };

  let progressFrame = 0;
  const requestProgressUpdate = () => {
    if (progressFrame) return;
    progressFrame = requestAnimationFrame(() => {
      progressFrame = 0;
      updateProgress();
    });
  };
  window.addEventListener("scroll", requestProgressUpdate, { passive: true });
  window.addEventListener("resize", requestProgressUpdate);
  window.addEventListener("load", updateProgress);
  updateProgress();
}

projectBack?.addEventListener("click", (event) => {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

  try {
    const referrer = new URL(document.referrer);
    const current = new URL(window.location.href);
    const cameFromPortfolio =
      referrer.origin === current.origin &&
      (referrer.pathname.endsWith("/ying-ni-site-preview/") || referrer.pathname.endsWith("/ying-ni-site-preview/index.html"));

    if (cameFromPortfolio && window.history.length > 1) {
      event.preventDefault();
      window.history.back();
    }
  } catch (_error) {
    // Direct visits use the link's #work fallback.
  }
});
