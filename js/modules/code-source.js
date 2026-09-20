/**
 * Code Source Module
 * Adds a "View on GitHub" link to the toolbar of code blocks that were embedded
 * from ProjectEulerSolutions.jl with @code[...]; the link is a permalink to the
 * exact commit the site was built against
 */

import Prism from "prismjs";

export function registerCodeSourceButton() {
  Prism.plugins.toolbar.registerButton("view-source", (env) => {
    const { sourceUrl, sourcePath } = env.element.dataset;
    if (!sourceUrl) return null;

    const link = document.createElement("a");
    link.href = sourceUrl;
    link.target = "_blank";
    link.rel = "noopener";
    link.textContent = "View on GitHub";
    link.title = sourcePath;
    return link;
  });
}
