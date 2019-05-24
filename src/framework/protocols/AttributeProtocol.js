import Protocol from './Protocol.js';
import { attr2prop, prop2attr } from '../helpers/utils.js';

const OBSERVER = Symbol('__observer__');

function legacyUpdate({ attributeName, target: host, oldValue }) {
  const newValue = host.getAttribute(attributeName);

  if (oldValue !== newValue) {
    const changeFn = host[`${attr2prop(attributeName)}Changed`];

    if (typeof changeFn === 'function') {
      changeFn.call(host, newValue, oldValue);
    }
  }
}

export default class AttributeProtocol extends Protocol {
  get observer() {
    if (this[OBSERVER]) {
      return this[OBSERVER];
    }

    const { isLegacy, config } = this;

    const value = new MutationObserver(mutationList => {
      for (const mutation of mutationList) {
        const { type, attributeName, target: host, oldValue } = mutation;
        if (type !== 'attributes') {
          continue;
        }

        if (isLegacy) {
          legacyUpdate(mutation);
          continue;
        }

        const newValue = host.getAttribute(attributeName);
        const prop = attr2prop(attributeName);
        const {
          [prop]: { onChange, extract }
        } = config;

        if (typeof extract === 'function') {
          // TODO: have this set on state instead of on property
          host[prop] = extract(host, newValue, oldValue);
        }

        if (typeof onChange === 'function') {
          onChange(host, newValue, oldValue);
        }
      }
    });

    Object.defineProperty(this, OBSERVER, {
      configurable: false,
      writable: false,
      enumerable: false,
      value
    });

    return value;
  }

  get isLegacy() {
    return Object.keys(this.config).length === 0;
  }

  get attributeFilter() {
    const {
      isLegacy,
      config,
      host: {
        constructor: { observedAttributes: legacyAttributeFilter }
      }
    } = this;
    return isLegacy
      ? legacyAttributeFilter
      : Object.keys(config).map(prop => prop2attr(prop));
  }

  onInit() {
    const { host, attributeFilter, observer } = this;
    observer.observe(host, {
      attributeFilter,
      attributes: true,
      attributeOldValue: true
    });
  }

  onDisconnect() {
    const { observer } = this;
    observer.disconnect();
  }
}

export const Attributes = AttributeProtocol.SIGNATURE;
