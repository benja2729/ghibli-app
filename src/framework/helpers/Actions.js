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
    let callback;

    switch (typeof config) {
      case 'object':
        if (!(config || Array.isArray(config))) {
          callback = config.handleEvent;
          host.addEventListener(name, this, config);
          break;
        }
      case 'function':
        callback = config;
        host.addEventListener(name, this, false);
        break;
      default:
        throw new TypeError(
          `[Actions] Expected action '${name}' to be called with a function or object`
        );
    }

    this[ACTIONS][name] = callback;
  }

  handleEvent(event) {
    const {
      [HOST]: host,
      [ACTIONS]: { [event.type]: callback }
    } = this;

    callback.call(this, event, host);
  }

  destroy() {
    const { [HOST]: host, [ACTIONS]: actions } = this;

    for (const action of Object.keys(actions)) {
      host.removeEventListener(action, this);
    }
  }
}
