const ABSOLUTE_URL_REGEXP = /^\w+:\/\//;
const ASSET_PROMISES = {};
const PENDING_ASSET_CALLBACKS = {};
const REGISTRY = {};
window.ASSET_REGISTRY = REGISTRY;

const DEFAULT_POD_SIGNATURE = {
  component: true,
  template: false,
  styles: false
};

const EXTENSION_MAP = {
  component: 'js',
  template: 'html',
  styles: 'css'
};

function deriveAssetURL(pod, base, podAttr) {
  const { [podAttr]: path } = pod;
  const { [podAttr]: extenstion } = EXTENSION_MAP;

  if (path === true) {
    return `${base}/${podAttr}.${extenstion}`;
  }

  if (path && !ABSOLUTE_URL_REGEXP.test(path)) {
    return `${base}/${path}`;
  }

  return path;
}

function preloadStyles(href) {
  return new Promise((resolve, onerror) => {
    const link = document.createElement('link');

    Object.assign(link, {
      type: 'text/css',
      as: 'style',
      rel: 'preload',
      onload(...args) {
        console.log('loadedStyle: ', href, ...args);
        resolve(link);
      },
      onerror,
      href
    });

    document.head.appendChild(link);
  });
}

function preloadTemplate(href) {
  // TODO: implement preload template
}

function flushPendingCallbacks(tag, results) {
  const { [tag]: callbacks } = PENDING_ASSET_CALLBACKS;

  if (Array.isArray(callbacks)) {
    callbacks.forEach(cb => cb(results));
    delete PENDING_ASSET_CALLBACKS[tag];
  }
}

function preloadAssets({ tag, component, template, styles }) {
  const promises = [];

  if (typeof component === 'string') {
    promises.push(import(component));
  }

  if (typeof template === 'string') {
    promises.push(preloadTemplate(template));
  }

  if (typeof styles === 'string') {
    promises.push(preloadStyles(styles));
  }

  const promise = Promise.all(promises);
  const flush = flushPendingCallbacks.bind(null, tag);
  promise.then(flush, flush);

  ASSET_PROMISES[tag] = promise;
  return promise;
}

export function whenAssetsLoaded(tag, callback) {
  const { [tag]: promise } = ASSET_PROMISES;
  let { [tag]: callbacks } = PENDING_ASSET_CALLBACKS;

  if (promise) {
    promise.then(callback, callback);
  }

  if (!Array.isArray(callbacks)) {
    PENDING_ASSET_CALLBACKS[tag] = callbacks = [];
  }

  callbacks.push(callback);
}

export function setPod(tag, pod) {
  REGISTRY[tag] = { ...pod };
  return preloadAssets(pod);
}

export function getPod(tag) {
  return { ...REGISTRY[tag] };
}

export function definePod({ url }, signature = {}) {
  const urlParts = url.split('/');
  urlParts.pop();
  const base = urlParts.join('/');
  const tag = urlParts.pop();
  const pod = {
    ...DEFAULT_POD_SIGNATURE,
    ...signature
  };
  const derive = deriveAssetURL.bind(null, pod, base);

  return {
    component: derive('component'),
    template: derive('template'),
    styles: derive('styles'),
    tag,
    base
  };
}

export function registerPod(meta, signature) {
  const pod = definePod(meta, signature);
  return setPod(pod.tag, pod);
}
