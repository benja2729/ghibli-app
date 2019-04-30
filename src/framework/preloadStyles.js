
const LINK = document.createElement('link');
LINK.setAttribute('type', 'text/css');
LINK.setAttribute('rel', 'preload');
LINK.setAttribute('as', 'style');

/**
 * Must be called from a blocking `script` tag in the document head.
 * Expects you to call `importStyles` in your component file.
 * `importStyles` assumes your `*.css` file to be a sibling of the same name.
 * All paths must be in relation to the url's origin.
 */
export default function preloadStyles(...paths) {
  for (const href of paths) {
    const link = LINK.cloneNode();
    link.href = href;
    document.head.appendChild(link);
  }
}

const { url } = import.meta;
const base = url.replace('preloadStyles.js', 'components');
const STYLES = [
  'PageNav.css'
];
  
preloadStyles(STYLES.map(file => `${base}/${file}`));

