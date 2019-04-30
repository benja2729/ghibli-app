import { getBasePath } from './preloadStyles.js';

const LINK = document.createElement('link');
LINK.setAttribute('type', 'text/css');
LINK.setAttribute('rel', 'stylesheet');

function importSingleStyle(url) {
  const link = LINK.cloneNode();
  link.setAttribute('href', url);
  document.body.appendChild(link);
}

/**
 * Must be called in your component file.
 * `importStyles` assumes your `*.css` file to be a sibling of the same name.
 * ```
 *  importStyles(import.meta);
 * ```
 * It's that easy!
 */
export default function importStyles(meta, ...paths) {
  if (paths.length === 0) {

    // Import from module
    importSingleStyle(meta.url.replace(/\js$/, 'css'));
  } else {
    const base = getBasePath(meta);

    // import multiple paths
    for (const path of paths) {
      importSingleStyle(`${base}${path}`);
    }
  }
}

