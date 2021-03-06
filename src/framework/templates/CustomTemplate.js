import { dispatchAction } from '../mixins/Actionable.js';

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
  static create(baseClass) {
    return document.createElement('template', {
      is: baseClass
    });
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
    const { delegatedStrategies: strategies } = this.constructor;
    const delegatedStrategies = { ...DELEGATED_STRATEGIES, ...strategies };

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
        segment.localName
      }' with '${attr}'`
    );
  }
}

customElements.define('custom-template', CustomTemplate, {
  extends: 'template'
});
