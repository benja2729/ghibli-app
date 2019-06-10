import Mixin from '../helpers/Mixin.js';
import JustCore from './JustCore.js';
import { assert, attr2prop } from '../helpers/utils.js';

function getShadowTemplate(host) {
  const {
    localName: name,
    constructor: { template: functionalTemplate }
  } = host;

  return (
    document.getElementById(
      `${/-/.test(name) ? name : host.getAttribute('is')}--template`
    ) || functionalTemplate
  );
}

function scrapeShadowIDs(root) {
  const results = {};
  const elms = root.querySelectorAll('[id]');

  elms.forEach(value => {
    const { id } = value;

    Object.defineProperty(results, attr2prop(id), {
      enumerable: true,
      value
    });
  });

  return results;
}

function scrapeShadowSlots(root) {
  const results = {};
  const elms = root.querySelectorAll('slot');

  for (const value of elms) {
    const { name = 'default' } = value;

    Object.defineProperty(results, attr2prop(name), {
      enumerable: true,
      value
    });
  }

  return results;
}

/**
 * @example
 * <p data-target="actionName" data-target-attr?="attrName" data-target-prop?="textContent"></p>
 * @param {ShadowRoot} root
 */
function scrapeActionTargets(root) {
  const results = {};
  const selectorName = 'data-target';
  const elms = root.querySelectorAll(`[${selectorName}]`);

  for (const target of elms) {
    const actionName = target.getAttribute(selectorName);
    const attr = target.getAttribute(`${selectorName}-attr`);
    const prop = target.getAttribute(`${selectorName}-prop`) || 'textContent';

    if (typeof actionName !== 'string') {
      continue;
    }

    Object.defineProperty(results, actionName, {
      enumerable: true,
      value: {
        target,
        update(value) {
          if (attr) {
            target.setAttribute(attr, value);
          } else {
            target[prop] = value;
          }
        }
      }
    });
  }

  return results;
}

/**
 * @example
 * <button data-action="actionName" data-action-on?="click" />
 * @param {HTMLElement} host
 */
function bindActionSources(host) {
  const { shadowRoot: root } = host;
  const selectorName = 'data-action';
  const elms = root.querySelectorAll(`[${selectorName}]`);

  for (const source of elms) {
    const actionName = source.getAttribute(selectorName);
    const eventName = `on${source.getAttribute(`${selectorName}-on`) ||
      'click'}`;
    source[eventName] = () => host.dispatchAction(actionName);
  }
}

export default Mixin(HTMLClass => {
  assert(JustCore.detect(HTMLClass), `[Shadow] Expected child of JustCore`);

  class Shadow extends HTMLClass {
    hasShadow = true;

    constructor() {
      super();

      const {
        constructor: { shadowMode: mode = 'open' }
      } = this;
      const template = getShadowTemplate(this);

      if (template) {
        const root = this.attachShadow({ mode });

        if (template instanceof HTMLTemplateElement) {
          root.append(template.content.cloneNode(true));
        } else if (typeof template === 'function') {
          root.innerHTML = template(this, document);
        }

        this.setupShadowExtensions();
      }
    }

    setupShadowExtensions() {
      const { shadowRoot: root } = this;
      bindActionSources(this);

      Object.defineProperties(this, {
        IDS: {
          configurable: true,
          enumerable: true,
          value: scrapeShadowIDs(root)
        },
        SLOTS: {
          configurable: true,
          enumerable: true,
          value: scrapeShadowSlots(root)
        },
        TARGETS: {
          configurable: true,
          enumerable: true,
          value: scrapeActionTargets(root)
        }
      });
    }
  }

  return Shadow;
});
