/**
 * Main Entry Point for Vite
 * Imports all CSS and JavaScript modules
 */

// Import all CSS - Vite will handle processing and bundling
import '/css/fonts.css';         // ensure @font-face is defined first
import '/css/earth-layers.css';
import '/css/blog.css';          // blog styles used on blog pages and listing

// Import our application modules
import "./earth-layers.js";
import "./video-sphere.js";

// Log successful initialization
console.log("🚀 Website loaded with Vite!");
