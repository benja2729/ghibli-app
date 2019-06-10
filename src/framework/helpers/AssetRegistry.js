const REGISTRY = {};
const DEFAULT_POD_SIGNATURE = {
  template: false,
  styles: false
};

const TEMPLATE_PROMISES = {
  promises: {},
  fetch(source) {
    const {
      promises,
      promises: { [source]: pendingPromise }
    } = this;

    if (pendingPromise) {
      return pendingPromise;
    }

    const promise = fetch(source).then(response => {
      delete promises[source];
      return response.text();
    });
    promises[source] = promise;
    return promise;
  }
};

function getRelativePath(href, path) {
  const url = new URL(path, href);

  if (/^~/.test(path)) {
    return `${url.origin}${path.slice(1)}`;
  }

  return url.toString();
}

function deriveAssetURL(pod, tag, url, attr) {
  const { [attr]: path } = pod;

  if (path === true) {
    const ext = {
      styles: 'css',
      template: 'html'
    }[attr];
    return getRelativePath(url, `./${tag}.${ext}`);
  }

  if (typeof path === 'string') {
    return getRelativePath(url, path);
  }

  return path;
}

function createLink(href) {
  const link = document.createElement('link');

  Object.assign(link, {
    type: 'text/css',
    rel: 'stylesheet',
    href
  });

  return link;
}

function preloadStyles(href) {
  return new Promise((resolve, onerror) => {
    const link = createLink(href);

    Object.assign(link, {
      as: 'style',
      rel: 'preload',
      onload() {
        resolve(link);
      },
      onerror
    });

    document.head.appendChild(link);
  });
}

async function preloadTemplate({ template: href, tag }) {
  const templateID = `${tag}--template`;
  let template = document.getElementById(templateID);

  if (!template) {
    template = document.createElement('template');
    template.id = templateID;
    document.body.appendChild(template);
    const templateText = await TEMPLATE_PROMISES.fetch(href);
    template.innerHTML = templateText;
  }

  return template;
}

async function preloadAssets(pod) {
  const { template: src, styles: href } = pod;
  let template;

  if (typeof src === 'string') {
    template = await preloadTemplate(pod);
  }

  if (template && typeof href === 'string') {
    preloadStyles(href);
    const link = createLink(href);
    template.content.prepend(link);
  }

  return pod;
}

export function setPod(tag, pod) {
  REGISTRY[tag] = { ...pod };
}

export function getPod(tag) {
  return { ...REGISTRY[tag] };
}

export function definePod({ url }, signature = {}) {
  const [tag] = url
    .split('/')
    .pop()
    .split('.');

  const pod = {
    ...DEFAULT_POD_SIGNATURE,
    ...signature
  };

  return {
    styles: deriveAssetURL(pod, tag, url, 'styles'),
    template: deriveAssetURL(pod, tag, url, 'template'),
    component: url,
    tag
  };
}

export async function registerPod(meta, signature) {
  const pod = definePod(meta, signature);
  setPod(pod.tag, pod);
  await preloadAssets(pod);
  return pod;
}
