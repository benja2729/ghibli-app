
const { origin } = window.location;
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
export default function importStyles(paths) {
  if (typeof paths === 'object') {
    if (Array.isArray(paths)) {

      // import multiple paths
      for (const path of paths) {
        importSingleStyle(origin + path);
      }
    } else {

      // Import from module
      importSingleStyle(paths.url.replace(/\js$/, 'css'));
    }
  } else if (typeof paths === 'string') {

    // import single path
    importSingleStyle(origin + path);
  }
}

