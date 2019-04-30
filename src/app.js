import importStyles from './framework/importStyles.js';

const STYLES = [
  'film-list.css'
];
importStyles(import.meta,
  ...STYLES.map(file => `/css/${file}`)
);

import './framework/components/PageNav.js';
import './components/GhibliApp.js';
