const videos = document.querySelectorAll("iframe");

const observer = new IntersectionObserver(
(entries) => {
entries.forEach((entry) => {
const iframe = entry.target;

```
  if (entry.isIntersecting) {
    iframe.src = iframe.src.replace("autoplay=0", "autoplay=1");
  } else {
    iframe.src = iframe.src.replace("autoplay=1", "autoplay=0");
  }
});
```

},
{ threshold: 0.6 }
);

videos.forEach((video) => observer.observe(video));
