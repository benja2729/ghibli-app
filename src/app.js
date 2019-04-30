import importStyles from './framework/importStyles.js';

const STYLES = [
  'film-list.css'
];
importStyles(STYLES.map(file => `/src/css/${file}`));

import './framework/components/PageNav.js';
import './components/GhibliApp.js';
