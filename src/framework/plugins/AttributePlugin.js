import Plugin from '../helpers/Plugin.js';
import Cache from '../helpers/Cache.js';

const OBSERVER = Symbol('__observer__');

const ATTR_CACHE = Cache(attr => {
  return attr.toLowerCase().replace(/-(\w)/g, (_, char) => {
    return char.toUpperCase();
  });
});

const PROP_CACHE = Cache(prop => {
  const delim = i => (i > 0 ? '-' : '');
  const rec = term =>
    term.length > 1 ? `${term.slice(0, -1)}-${term.slice(-1)}` : term;

  return prop.replace(/([A-Z]+)/g, (_, char, index) => {
    return `${delim(index)}${rec(char.toLowerCase())}`;
  });
});

export default class AttributePlugin extends Plugin {
  get observer() {
    if (this[OBSERVER]) {
      return this[OBSERVER];
    }

    const { config } = this;
    const value = new MutationObserver(mutationList => {
      for (const mutation of mutationList) {
        const { type, attributeName, target: host, oldValue } = mutation;
        if (type !== 'attributes') {
          continue;
        }

        const newValue = host.getAttribute(attributeName);
        const prop = ATTR_CACHE.get(attributeName);
        const {
          [prop]: impliedChange,
          [prop]: { onChange, transform }
        } = config;

        if (typeof impliedChange === 'function') {
          impliedChange(host, newValue, oldValue);
          continue;
        }

        if (transform && typeof transform.extract === 'function') {
          host.setState(prop, transform.extract(newValue));
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

  onInit() {
    const { host, config, observer } = this;
    observer.observe(host, {
      attributeFilter: Object.keys(config).map(prop => PROP_CACHE.get(prop)),
      attributes: true,
      attributeOldValue: true
    });

    for (const [prop, conf] of Object.entries(config)) {
      const { bind, transform } = conf;

      if (bind) {
        const { get, set } = bind;
        const attr = PROP_CACHE.get(prop);
        Object.defineProperty(host, prop, {
          enumerable: false,
          configurable: true,
          get: get || (() => host.getState(prop)),
          set:
            set ||
            (transform && typeof transform.serialize === 'function'
              ? value => host.setAttribute(attr, transform.serialize(value))
              : value =>
                  host.setAttribute(attr, value) && host.setState(attr, value))
        });
      }
    }
  }

  onConnect() {
    const { host, config } = this;
    for (const [prop, conf] of Object.entries(config)) {
      const attr = PROP_CACHE.get(prop);

      if (conf.hasOwnProperty('default') && !host.hasAttribute(attr)) {
        if (conf.bind) {
          host[prop] = conf.default;
        } else {
          host.setAttribute(attr, conf.default);
        }
      }
    }
  }

  onDisconnect() {
    const { observer } = this;
    observer.disconnect();
  }
}

export const Attributes = AttributePlugin.SIGNATURE;
