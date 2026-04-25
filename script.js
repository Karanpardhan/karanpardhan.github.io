const revealElements = document.querySelectorAll(".reveal");

const showElement = (element, delay) => {
  element.style.transitionDelay = `${delay}ms`;
  element.classList.add("reveal-visible");
};

if (!("IntersectionObserver" in window)) {
  revealElements.forEach((element, index) => {
    showElement(element, Math.min(index * 70, 420));
  });
} else {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        entry.target.classList.add("reveal-visible");
        revealObserver.unobserve(entry.target);
      });
    },
    {
      threshold: 0.16,
      rootMargin: "0px 0px -8% 0px",
    }
  );

  revealElements.forEach((element, index) => {
    element.style.transitionDelay = `${Math.min(index * 70, 420)}ms`;
    revealObserver.observe(element);
  });
}
