/**
 * Blog Entry
 * Loads fonts and blog-specific CSS, and minimal JS modules
 */

import '/css/fonts.css';
import '/css/blog.css';

import { ThemeManager } from './modules/theme.js';

// Initialize minimal functionality for blog pages
new ThemeManager();

console.log('📝 Blog loaded with Vite!');
