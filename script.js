// ===============================
// AUTO PLAY VIDEO WHEN VISIBLE
// ===============================

const videos = document.querySelectorAll("iframe");

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      const iframe = entry.target;

      if (entry.isIntersecting) {
        // Play video
        iframe.src = iframe.src.replace("autoplay=0", "autoplay=1");
      } else {
        // Pause video (reload iframe without autoplay)
        iframe.src = iframe.src.replace("autoplay=1", "autoplay=0");
      }
    });
  },
  {
    threshold: 0.6,
  }
);

// Observe all iframes
videos.forEach((video) => {
  observer.observe(video);
});


// ===============================
// SMOOTH REVEAL ANIMATION
// ===============================

const revealElements = document.querySelectorAll(".reveal");

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("show");
      }
    });
  },
  {
    threshold: 0.2,
  }
);

revealElements.forEach((el) => revealObserver.observe(el));


// ===============================
// OPTIONAL: PAUSE ALL ON TAB CHANGE
// ===============================

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    videos.forEach((iframe) => {
      iframe.src = iframe.src.replace("autoplay=1", "autoplay=0");
    });
  }
});
