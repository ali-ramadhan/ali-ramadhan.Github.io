// Dynamically rotate comets so their tails point away from the sun
(function () {
  const sun = document.getElementById('sun');
  const comets = document.querySelectorAll('.comet');

  if (!sun || comets.length === 0) return;

  function updateCometRotations() {
    const sunRect = sun.getBoundingClientRect();
    const sunX = sunRect.left + sunRect.width / 2;
    const sunY = sunRect.top + sunRect.height / 2;

    comets.forEach((comet) => {
      const cometRect = comet.getBoundingClientRect();
      const cometX = cometRect.left + cometRect.width / 2;
      const cometY = cometRect.top + cometRect.height / 2;

      // Calculate angle from sun to comet
      const dx = cometX - sunX;
      const dy = cometY - sunY;
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);

      // Set CSS custom property for rotation (tail points away from sun)
      comet.style.setProperty('--comet-rotation', `${angle}deg`);
    });

    requestAnimationFrame(updateCometRotations);
  }

  // Start the rotation update loop
  updateCometRotations();
})();
