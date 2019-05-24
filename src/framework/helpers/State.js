export const STATE = Symbol('__state__');
const INITIAL_STATE = Symbol('__initial_state__');
const UNDEFINED = Symbol('UNDEFINED');

function isNull(value) {
  return value === null || value === undefined;
}

export default class ComputedProperty {
  constructor() {
  }

  get isComputed() {
    return true;
  }
}

class Property {
  constructor(initialValue) {
    if (typeof initialValue === 'function') {
      this.initial === UNDEFINED;

      Object.defineProperty(this, 'call', {
        enumerable: false,
        configurable: false,
        writable: false,
        value: initialValue
      });
    } else {
      this.initial = isNull(initialValue)
        ? UNDEFINED
        : initialValue;
    }

    Object.defineProperty(this, 'current', {
      enumerable: true,
      configurable: false,
      writable: true,
      value: this.initial
    });
  }

  get value() {
    const {
      current,
      isComputed
    } = this;

    if (current !== UNDEFINED) {
      return current;
    }

    if (isComputed) {
      this.value = this.call();
      return this.current;
    }

    return undefined;
  }

  set value(value) {
    this.current = value;
  }

  get isComputed() {
    return typeof this.call === 'function';
  }

  clear() {
    this.current = UNDEFINED;
  }

  reset() {
    this.current = initial;
  }
}

export function initState(host, state) {
  host[STATE] = state;
}

export function getState(host, attr, defaultValue) {
  const { [STATE]: { [attr]: value } } = host;

  if (value !== UNDEFINED) {
    return value;
  }

  if (defaultValue) {
    setState(host, attr,
      typeof defaultValue === 'function'
        ? defaultValue.call(host, attr)
        : defaultValue;
    );
  }

  return host[STATE][attr];
}

export function setState(host, attr, value) {
  
}

export function clearState(host, attr) {
  const { [STATE]: state } = host;
  state[attr] = UNDEFINED;
}

export default class State {
  constructor(initialState) {
    this[INITIAL_STATE] = initialState;
    Object.assign(this, initialState);

    for (const [key, value] of Object.entries(initialState)) {
    }
  }

  get(attr, defaultValue) {

  }

  set(attr, value) {
    if (isNull(value)) {
      this[attr] = UNDEFINED;
    } else {
      this[attr] = value;
    }
  }
}

