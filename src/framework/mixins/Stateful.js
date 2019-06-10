import Mixin, { mix } from '../helpers/Mixin.js';
import Lifecycle from './Lifecycle.js';
import { assertHTMLElement, attr2prop, prop2attr } from '../helpers/utils.js';

const STATE_META = Symbol.for('__state_meta__');
const isFn = fn => typeof fn === 'function';

function initMeta(host) {
  const { attributes = {}, properties = {} } = host.constructor;

  host[STATE_META] = {
    bindings: {},
    cache: {},
    attributes: { ...attributes },
    properties: { ...properties }
  };
}

function definePropertyAliases(host) {
  const {
    [STATE_META]: { properties = {}, cache }
  } = host;

  for (const [prop, config] of Object.entries(properties)) {
    const { default: defaultValue, onChange: expliciteOnChange } = config;
    const onChange = isFn(config)
      ? config
      : isFn(expliciteOnChange)
      ? expliciteOnChange
      : null;

    Object.defineProperty(host, prop, {
      configurable: true,
      enumerable: true,
      get() {
        return cache[prop];
      },
      set: onChange
        ? value => {
            const { [prop]: oldValue } = cache;
            cache[prop] = value;
            onChange(host, value, oldValue);
          }
        : value => (cache[prop] = value)
    });

    if (config.hasOwnProperty('default')) {
      host[prop] = defaultValue;
    }
  }
}

function defineAttributeAliases(host) {
  const {
    [STATE_META]: { attributes = {}, cache }
  } = host;

  for (const [prop, config] of Object.entries(attributes)) {
    const attr = prop2attr(prop);
    const { transform } = config;

    Object.defineProperty(host, prop, {
      configurable: true,
      enumerable: true,
      get() {
        return cache[prop];
      },
      set:
        transform && isFn(transform.serialize)
          ? value => host.setAttribute(attr, transform.serialize(value))
          : value => host.setAttribute(attr, value)
    });
  }
}

function attributeChanged(host, attr, value) {
  const prop = attr2prop(attr);
  const {
    [STATE_META]: {
      cache,
      cache: { [prop]: oldValue },
      attributes: {
        [prop]: impliedOnChange,
        [prop]: { onChange, transform }
      }
    }
  } = host;

  const newValue = (cache[prop] =
    transform && isFn(transform.extract) ? transform.extract(value) : value);

  if (isFn(impliedOnChange)) {
    impliedOnChange(host, newValue, oldValue);
  } else if (isFn(onChange)) {
    onChange(host, newValue, oldValue);
  }
}

export default Mixin(HTMLClass => {
  assertHTMLElement(HTMLClass, `[Stateful] Expected instance of HTMLElement`);

  class Stateful extends mix(HTMLClass).with(Lifecycle) {
    static get observedAttributes() {
      return Object.keys(this.attributes || {}).map(prop => prop2attr(prop));
    }

    constructor() {
      super();
      initMeta(this);
      definePropertyAliases(this);
      defineAttributeAliases(this);
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (oldValue !== newValue) {
        attributeChanged(this, name, newValue);
      }
    }

    getCurrentState() {
      return { ...this[STATE_META].cache };
    }

    getState(prop) {
      return this.getCurrentState()[prop];
    }
  }

  return Stateful;
});
