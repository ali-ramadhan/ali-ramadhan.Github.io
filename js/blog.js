/**
 * Blog Entry
 * Loads fonts and blog-specific CSS, and minimal JS modules
 */

import '/css/fonts.css';
import '/css/base.css';
import '/css/blog.css';
import '/css/components/theme-toggle.css';

import { ThemeManager } from './modules/theme.js';
import { MathJaxManager } from './modules/mathjax.js';

// Initialize minimal functionality for blog pages
new ThemeManager();
new MathJaxManager();

console.log('📝 Blog loaded with Vite!');
