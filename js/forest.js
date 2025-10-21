/**
 * Forest Generator
 * Creates a forest of trees in the land layer and cacti in the desert
 */

class ForestGenerator {
  constructor() {
    this.treeContainer = null;
    this.cactusContainer = null;
    // Scale tree count based on screen width
    // ~50 trees on phones (375px), ~200 on desktop (1920px), ~400 on 4K (3840px)
    const baseTreeCount = Math.floor(window.innerWidth / 10);
    this.treeCount = Math.max(50, Math.min(500, baseTreeCount)); // Clamp between 50-500

    // Fewer cacti in the desert
    const baseCactusCount = Math.floor(window.innerWidth / 100);
    this.cactusCount = Math.max(5, Math.min(50, baseCactusCount)); // Clamp between 5-50

    this.init();
  }

  init() {
    document.addEventListener("DOMContentLoaded", () => {
      this.treeContainer = document.querySelector(".forest-trees");
      if (this.treeContainer) {
        this.generateForest();
        console.log(`Forest generated with ${this.treeCount} trees`);
      }

      this.cactusContainer = document.querySelector(".desert-cacti");
      if (this.cactusContainer) {
        this.generateDesert();
        console.log(`Desert generated with ${this.cactusCount} cacti`);
      }
    });
  }

  generateForest() {
    const trees = [];

    for (let i = 0; i < this.treeCount; i++) {
      const tree = this.createTree();
      trees.push(tree);
    }

    // Append all trees at once for better performance
    const fragment = document.createDocumentFragment();
    trees.forEach((tree) => fragment.appendChild(tree));
    this.treeContainer.appendChild(fragment);
  }

  generateDesert() {
    const cacti = [];

    for (let i = 0; i < this.cactusCount; i++) {
      const cactus = this.createCactus();
      cacti.push(cactus);
    }

    // Append all cacti at once for better performance
    const fragment = document.createDocumentFragment();
    cacti.forEach((cactus) => fragment.appendChild(cactus));
    this.cactusContainer.appendChild(fragment);
  }

  createTree() {
    const tree = document.createElement("div");
    tree.className = "tree";

    // Position in left 50% (forest region) and upper 60% of land layer
    const x = Math.random() * 40; // 0% to 40% (left half)
    // Use power distribution to make trees denser near top (mountains)
    // Squaring the random value biases distribution towards 0 (top)
    const y = Math.pow(Math.random(), 2) * 60; // 0% to 60%, denser at top

    // Size variation for depth: 20% to 100%
    // Smaller trees appear more distant, larger trees closer
    const scale = 0.7 + Math.random() * 0.3;

    // Base tree size (adjust as needed)
    const baseWidth = 60; // pixels
    const baseHeight = 80; // pixels

    const width = baseWidth * scale;
    const height = baseHeight * scale;

    // Apply positioning and sizing
    tree.style.left = `${x}%`;
    tree.style.top = `${y}%`;
    tree.style.width = `${width}px`;
    tree.style.height = `${height}px`;

    // Smaller trees should appear behind larger ones
    // Z-index based on size (smaller = lower z-index = further back)
    tree.style.zIndex = Math.floor(scale * 100);

    // Add slight opacity variation for more depth
    const opacity = 0.7 + scale * 0.3; // 0.7 to 1.0
    tree.style.opacity = opacity;

    return tree;
  }

  createCactus() {
    const cactus = document.createElement("div");
    cactus.className = "cactus";

    // Position in right 50% (desert region) and upper 60% of land layer
    const x = 50 + Math.random() * 40; // 50% to 90% (right half, away from river)
    // Use power distribution to make cacti denser near top (mountains)
    const y = Math.pow(Math.random(), 2) * 60; // 0% to 60%, denser at top

    // Size variation for depth: 20% to 100%
    // Smaller cacti appear more distant, larger cacti closer
    const scale = 0.7 + Math.random() * 0.3;

    // Base cactus size (adjust as needed)
    const baseWidth = 60; // pixels
    const baseHeight = 80; // pixels

    const width = baseWidth * scale;
    const height = baseHeight * scale;

    // Apply positioning and sizing
    cactus.style.left = `${x}%`;
    cactus.style.top = `${y}%`;
    cactus.style.width = `${width}px`;
    cactus.style.height = `${height}px`;

    // Smaller cacti should appear behind larger ones
    // Z-index based on size (smaller = lower z-index = further back)
    cactus.style.zIndex = Math.floor(scale * 100);

    // Add slight opacity variation for more depth
    const opacity = 0.7 + scale * 0.3; // 0.7 to 1.0
    cactus.style.opacity = opacity;

    return cactus;
  }

  cleanup() {
    if (this.treeContainer) {
      this.treeContainer.innerHTML = "";
    }
    if (this.cactusContainer) {
      this.cactusContainer.innerHTML = "";
    }
  }
}

// Initialize the forest generator
new ForestGenerator();

export { ForestGenerator };
