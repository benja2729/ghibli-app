
const LINK = document.createElement('link');
LINK.setAttribute('type', 'text/css');
LINK.setAttribute('rel', 'preload');
LINK.setAttribute('as', 'style');

export function getBasePath({ url }) {
  const parts = url.split('/');
  parts.pop();
  return parts.join('/');
}

/**
 * Must be called from a blocking `script` tag in the document head.
 * Expects you to call `importStyles` in your component file.
 * `importStyles` assumes your `*.css` file to be a sibling of the same name.
 * All paths must be in relation to the url's origin.
 */
export default function preloadStyles(meta, ...paths) {
  const base = getBasePath(meta);

  for (const href of paths) {
    const link = LINK.cloneNode();
    link.href = `${base}${href}`;
    document.head.appendChild(link);
  }
}

preloadStyles(import.meta,
  '/components/PageNav.css'
);

