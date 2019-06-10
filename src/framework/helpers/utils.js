import Cache from './Cache.js';

export function detectHTMLElement(HTMLClass) {
  return Boolean(
    HTMLClass &&
      (HTMLClass === HTMLElement || HTMLClass.prototype instanceof HTMLElement)
  );
}

export function assert(term, message, ErrorClass = Error) {
  if (!term) {
    throw new ErrorClass(message);
  }
}

export function assertHTMLElement(HTMLClass, message) {
  assert(detectHTMLElement(HTMLClass), message, TypeError);
}

const ATTR_CACHE = Cache(attr => {
  return attr.toLowerCase().replace(/-(\w)/g, (_, char) => {
    return char.toUpperCase();
  });
});

export function attr2prop(attr) {
  return ATTR_CACHE.get(attr);
}

const PROP_CACHE = Cache(prop => {
  const delim = i => (i > 0 ? '-' : '');
  const rec = term =>
    term.length > 1 ? `${term.slice(0, -1)}-${term.slice(-1)}` : term;

  return prop.replace(/([A-Z]+)/g, (_, char, index) => {
    return `${delim(index)}${rec(char.toLowerCase())}`;
  });
});

export function prop2attr(prop) {
  return PROP_CACHE.get(prop);
}
