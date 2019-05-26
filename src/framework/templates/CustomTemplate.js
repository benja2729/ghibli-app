import { dispatchAction } from '../protocols/ActionProtocol.js';

const CUSTOM_TEMPLATE_ROOT = window.CUSTOM_TEMPLATE_ROOT || 'templates';
const CUSTOM_TEMPLATE_REGEXP = /^([\w-]+)--template$/;
const MANAGED_PROMISES = {
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

function dispatchContentLoaded(template) {
  const event = new CustomEvent('CONTENT_LOADED', {
    composed: false,
    bubbles: false,
    detail: template
  });
  template.dispatchEvent(event);
}

function generateSourceUrl(template) {
  const { id, src } = template;

  if (src) {
    return src;
  }

  if (!id) {
    throw new Error('[CustomTemplate] Must pass an id to load a template');
  }

  try {
    const filename = id.match(CUSTOM_TEMPLATE_REGEXP)[1];
    return `${CUSTOM_TEMPLATE_ROOT}/${filename}.html`;
  } catch (err) {
    throw new Error(
      "[CustomTemplate] id must match '(component-name)--template'"
    );
  }
}

function fetchTemplateContent(template) {
  const source = generateSourceUrl(template);
  template.isLoading = true;
  MANAGED_PROMISES.fetch(source).then(innerHTML => {
    Object.assign(template, {
      innerHTML,
      isLoading: false
    });
  });
}

const DELEGATED_STRATEGIES = {
  attr(segment, value, context) {
    const [attr, prop] = value.split(':');

    if (attr && prop) {
      segment.setAttribute(attr, context[prop]);
    }
  },

  text(segment, prop, context) {
    segment.textContent = context[prop];
  },

  action(segment, prop, context) {
    const [event, action] = prop.split(':');

    if (event && action) {
      segment[event] = () => dispatchAction(segment, action, context);
    }
  }
};

export default class CustomTemplate extends HTMLTemplateElement {
  static get observedAttributes() {
    return ['src', 'async', 'loading'];
  }

  static get delegatedStrategies() {
    return DELEGATED_STRATEGIES;
  }

  static create(baseClass) {
    return document.createElement('template', {
      is: baseClass
    });
  }

  get src() {
    return this.getAttribute('src');
  }

  get isAsync() {
    return this.hasAttribute('async');
  }

  set isAsync(bool) {
    if (bool) {
      this.setAttribute('async', '');
    } else {
      this.removeAttribute('async');
    }
  }

  get isLoading() {
    return this.hasAttribute('loading');
  }

  set isLoading(bool) {
    if (bool) {
      this.setAttribute('loading', '');
    } else {
      this.removeAttribute('loading');
    }
  }

  get isShadow() {
    return this.hasAttribute('is-shadow');
  }

  get hook() {
    return this.getAttribute('hook') || 'data-strategy';
  }

  get root() {
    return this.content.cloneNode(true);
  }

  connectedCallback() {
    if (this.isConnected) {
      const {
        constructor: { templateSource }
      } = this;

      if (templateSource) {
        this.src = templateSource;
      }
    }
  }

  attributeChangedCallback(attr, oldValue, value) {
    const isAsync = typeof value === 'string';

    if (attr === 'src') {
      this.isAsync = isAsync;
    }

    if (attr === 'async' && isAsync) {
      fetchTemplateContent(this);
    }

    if (attr === 'loading' && oldValue === '' && value === null) {
      dispatchContentLoaded(this);
    }
  }

  render(context) {
    const { root } = this;
    const segments = this.gatherSegments(root);
    this.applySegments(segments, context);
    return root;
  }

  gatherSegments(root) {
    return root.querySelectorAll(`[${this.hook}]`);
  }

  applySegments(segments, context) {
    const { hook } = this;

    for (const segment of segments) {
      const strategy = segment.getAttribute(hook);

      if (strategy) {
        this.applyStrategy(strategy, segment, context);
      } else {
        this.delegate(segment, context);
      }

      segment.removeAttribute(hook);
    }
  }

  delegate(segment, context) {
    const params = [segment, context];
    const { delegatedStrategies } = this.constructor;

    for (const [strategy, strategyFn] of Object.entries(delegatedStrategies)) {
      const value = segment.getAttribute(strategy);
      if (!value) continue;
      strategyFn.call(this, segment, value, context);
      segment.removeAttribute(strategy);
    }
  }

  applyStrategy(strategy, segment, context) {
    const params = [segment, context, this.parentElement];
    const { [`${strategy}Strategy`]: strategyFn } = this;

    if (typeof strategyFn === 'function') {
      strategyFn.call(this, ...params);
    } else {
      this.unknownStrategy(...params);
    }
  }

  unknownStrategy(segment) {
    const attr = segment.getAttribute(this.hook);
    throw new Error(
      `[CustomTemplate] unknown strategy for '${
        segment.tagName
      }' with '${attr}'`
    );
  }
}

customElements.define('custom-template', CustomTemplate, {
  extends: 'template'
});
