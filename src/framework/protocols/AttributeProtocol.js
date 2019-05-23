import Protocol from './Protocol.js';
import { attr2prop } from '../helpers/utils.js';

const OBSERVER = Symbol('__observer__');

export default class AttributeProtocol extends Protocol {
  get observer() {
    if (this[OBSERVER]) {
      return this[OBSERVER];
    }

    const value = new MutationObserver(mutationList => {
      for (const {
        type,
        attributeName,
        target: host,
        oldValue
      } of mutationList) {
        if (type !== 'attributes') {
          continue;
        }

        const newValue = host.getAttribute(attributeName);

        if (oldValue !== newValue) {
          const changeFn = host[`${attr2prop(attributeName)}Changed`];

          if (typeof changeFn === 'function') {
            changeFn.call(host, newValue, oldValue);
          }
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

  onInit() {
    const { host, config, observer } = this;
    observer.observe(host, {
      // attributeFilter: Object.keys(config),
      attributeFilter: host.constructor.observedAttributes,
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
