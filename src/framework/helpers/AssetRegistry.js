const REGISTRY = {};
const DEFAULT_POD_SIGNATURE = {
  template: false,
  styles: false
};

function preloadStyles(href) {
  const link = document.createElement('link');
  Object.assign(link, {
    type: 'text/css',
    as: 'style',
    rel: 'preload',
    href
  });
  document.head.appendChild(link);
}

function preloadTemplate(href) {
  // TODO: implement preload template
}

export function setPod(name, pod) {
  const { styles, template } = pod;

  if (typeof styles === 'string') {
    preloadStyles(styles);
  }

  if (typeof template === 'string') {
    preloadTemplate(template);
  }

  REGISTRY[name] = { ...pod };
}

export function getPod(name) {
  return { ...REGISTRY[name] };
}

export function definePod({ url: component }, signature = {}) {
  const urlParts = component.split('/');
  const tag = urlParts.pop().replace(/\.\w+$/, '');
  const base = urlParts.join('/');
  let { template, styles } = { ...DEFAULT_POD_SIGNATURE, ...signature };

  if (template === true) {
    template = `${base}/${tag}.html`;
  }

  if (styles === true) {
    styles = `${base}/${tag}.css`;
  }

  return { base, component, tag, template, styles };
}

export function registerPod(meta, signature) {
  const pod = definePod(meta, signature);
  setPod(pod.tag, pod);
  return pod;
}
