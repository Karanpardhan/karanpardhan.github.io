const revealElements = document.querySelectorAll(".reveal");
const counters = document.querySelectorAll("[data-count]");
const shortVideos = document.querySelectorAll(".featured-short-card video");
const videos = document.querySelectorAll("video");

const lockPortraitOrientation = async () => {
  if (!screen.orientation || !screen.orientation.lock) {
    return;
  }

  try {
    await screen.orientation.lock("portrait");
  } catch {
    // Ignore unsupported orientation lock failures.
  }
};

const unlockOrientation = async () => {
  if (!screen.orientation || !screen.orientation.unlock) {
    return;
  }

  try {
    screen.orientation.unlock();
  } catch {
    // Ignore unlock failures on unsupported browsers.
  }
};

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  {
    threshold: 0.16,
  }
);

revealElements.forEach((element) => revealObserver.observe(element));

const animateCounter = (element) => {
  const target = Number(element.dataset.count);
  const duration = 1400;
  const startTime = performance.now();

  const update = (time) => {
    const progress = Math.min((time - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const value = Math.round(target * eased);
    element.textContent = value;

    if (progress < 1) {
      requestAnimationFrame(update);
      return;
    }

    element.textContent = `${target}${target >= 20 ? "+" : ""}`;
  };

  requestAnimationFrame(update);
};

const counterObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      }
    });
  },
  {
    threshold: 0.6,
  }
);

counters.forEach((counter) => counterObserver.observe(counter));

videos.forEach((activeVideo) => {
  activeVideo.addEventListener("play", () => {
    videos.forEach((video) => {
      if (video !== activeVideo) {
        video.pause();
      }
    });
  });
});

document.addEventListener("fullscreenchange", async () => {
  const activeElement = document.fullscreenElement;
  const isShortVideoFullscreen =
    activeElement && Array.from(shortVideos).includes(activeElement);

  if (isShortVideoFullscreen) {
    await lockPortraitOrientation();
    return;
  }

  if (!activeElement) {
    await unlockOrientation();
  }
});
