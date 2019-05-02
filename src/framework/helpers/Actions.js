export const ACTIONS = Symbol('__actions__');

const HOST = Symbol('__host__');

export default class Actions {
  constructor(host, actions = {}) {
    this[HOST] = host;
    this[ACTIONS] = {};

    for (const [name, config] of Object.entries(actions)) {
      this.addAction(name, config);
    }
  }

  addAction(name, config) {
    const { [HOST]: host } = this;

    switch (typeof config) {
      case 'object':
        if (!(config || Array.isArray(config))) {
          host.addEventListener(name, this, config);
          break;
        }
      case 'function':
        host.addEventListener(name, this, false);
        break;
      default: throw new TypeError(
        `[Actions] Expected action '${name}' to be called with a function or object`
      );
    }

    this[ACTIONS][name] = config;
  }

  call(name, event) {
    const {
      [HOST]: host,
      [ACTIONS]: { [name]: callback }
    } = this;
    const props = [this, event, host];

    if (typeof callback === 'function') {
      callback.call(...props);
    } else if (typeof callback === 'object') {
      callback.handleEvent.call(...props);
    }
  }

  handleEvent(event) {
    this.call(event.type, event);
  }

  destroy() {
    const {
      [HOST]: host,
      [ACTIONS]: actions
    } = this;

    for (const action of Object.keys(actions)) {
      host.removeEventListener(action, this);
    }
  }
}

