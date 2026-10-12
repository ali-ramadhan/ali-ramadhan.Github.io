// Send the "Random" link in the about me box to a random destination
(function () {
  const link = document.getElementById("random-link");

  if (!link) return;

  // The first entry is also the link's no-JS fallback href in about-me.html
  const destinations = [
    "https://eyes.nasa.gov/apps/solar-system/",
    "https://htwins.net/scale2/",
    "https://earth.nullschool.net/",
    "https://www.tropicaltidbits.com/",
    "https://dinosaurpictures.org/ancient-earth#240",
    "https://earthengine.google.com/timelapse/",
    "https://thetruesize.com/",
    "https://radio.garden/",
    "https://neal.fun/deep-sea/",
    "https://oeis.org/webcam",
    "https://everynoise.com/",
  ];

  function pickDestination() {
    link.href = destinations[Math.floor(Math.random() * destinations.length)];
  }

  // Pick ahead of time so hovering, middle-clicking, and "open in new tab" all agree on
  // where the link goes, then pick again after it's followed (it opens in a new tab, so
  // the next click on this page should go somewhere new).
  pickDestination();
  link.addEventListener("click", () => setTimeout(pickDestination));
  link.addEventListener("auxclick", () => setTimeout(pickDestination));
})();
