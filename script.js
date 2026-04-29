const revealElements = document.querySelectorAll(".reveal");
const counters = document.querySelectorAll("[data-count]");
const shortVideos = document.querySelectorAll(".featured-short-card video");
const localVideos = Array.from(document.querySelectorAll("video"));
const youtubeIframes = Array.from(document.querySelectorAll(".featured-video-card iframe"));

let activeLocalVideo = null;
let activeYouTubePlayer = null;
let currentVisibleMedia = null;
let youTubePlayersReady = false;
const youtubePlayers = new Map();
const mediaVisibility = new Map();

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

const pauseAllLocalVideos = (except = null) => {
  localVideos.forEach((video) => {
    if (video !== except) {
      video.pause();
    }
  });
};

const pauseAllYouTubePlayers = (except = null) => {
  youtubePlayers.forEach((player) => {
    if (player !== except && typeof player.pauseVideo === "function") {
      player.pauseVideo();
    }
  });
};

const playVisibleMedia = () => {
  if (!currentVisibleMedia) {
    return;
  }

  if (currentVisibleMedia.tagName === "VIDEO") {
    currentVisibleMedia.muted = true;
    pauseAllYouTubePlayers();
    pauseAllLocalVideos(currentVisibleMedia);
    currentVisibleMedia.play().catch(() => {});
    activeLocalVideo = currentVisibleMedia;
    activeYouTubePlayer = null;
    return;
  }

  if (!youTubePlayersReady) {
    return;
  }

  const player = youtubePlayers.get(currentVisibleMedia);
  if (!player || typeof player.playVideo !== "function") {
    return;
  }

  pauseAllLocalVideos();
  pauseAllYouTubePlayers(player);

  try {
    player.mute();
    player.playVideo();
    activeYouTubePlayer = player;
    activeLocalVideo = null;
  } catch {
    // Ignore autoplay failures caused by browser policy.
  }
};

const updateVisibleMedia = () => {
  const candidates = [...mediaVisibility.entries()]
    .filter(([, ratio]) => ratio > 0.55)
    .sort((a, b) => b[1] - a[1]);

  currentVisibleMedia = candidates.length ? candidates[0][0] : null;
  playVisibleMedia();
};

const mediaObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      const media = entry.target.matches("iframe, video")
        ? entry.target
        : entry.target.querySelector("iframe, video");

      if (!media) {
        return;
      }

      mediaVisibility.set(media, entry.intersectionRatio);

      if (!entry.isIntersecting || entry.intersectionRatio <= 0.2) {
        if (media.tagName === "VIDEO") {
          media.pause();
        } else {
          const player = youtubePlayers.get(media);
          if (player && typeof player.pauseVideo === "function") {
            player.pauseVideo();
          }
        }
      }
    });

    updateVisibleMedia();
  },
  {
    threshold: [0.2, 0.4, 0.55, 0.7, 0.9],
  }
);

[...youtubeIframes, ...localVideos].forEach((media) => {
  mediaVisibility.set(media, 0);
  mediaObserver.observe(media.closest(".featured-video-card") || media);
});

localVideos.forEach((activeVideo) => {
  activeVideo.addEventListener("play", () => {
    pauseAllLocalVideos(activeVideo);
    pauseAllYouTubePlayers();
    activeLocalVideo = activeVideo;
    activeYouTubePlayer = null;
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

const loadYouTubeApi = () => {
  if (!youtubeIframes.length) {
    return;
  }

  const script = document.createElement("script");
  script.src = "https://www.youtube.com/iframe_api";
  script.async = true;
  document.head.appendChild(script);
};

window.onYouTubeIframeAPIReady = () => {
  youtubeIframes.forEach((iframe) => {
    const player = new YT.Player(iframe, {
      events: {
        onReady: (event) => {
          event.target.mute();
          youtubePlayers.set(iframe, event.target);

          if (youtubePlayers.size === youtubeIframes.length) {
            youTubePlayersReady = true;
            playVisibleMedia();
          }
        },
        onStateChange: (event) => {
          if (event.data === YT.PlayerState.PLAYING) {
            pauseAllLocalVideos();
            pauseAllYouTubePlayers(event.target);
            activeYouTubePlayer = event.target;
            activeLocalVideo = null;
          }
        },
      },
    });

    youtubePlayers.set(iframe, player);
  });
};

loadYouTubeApi();
