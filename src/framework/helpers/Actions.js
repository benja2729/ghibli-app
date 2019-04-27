export const ACTIONS = Symbol('__actions__');

export default class Actions {
  constructor(host, actions = {}) {
    this.host = host;
    this.actions = actions;

    for (const [name, config] of Object.entries(actions)) {
      if (typeof config === 'object') {
        host.addEventListener(name, this, config);
      } else {
        host.addEventListener(name, this, false);
      }
    }
  }

  call(name, event) {
    const {
      host,
      actions: { [name]: callback }
    } = this;

    if (typeof callback === 'function') {
      callback.call(this, event, host);
    } else if (typeof callback === 'object') {
      callback.handleEvent.call(this, event, host);
    }
  }

  handleEvent(event) {
    this.call(event.type, event);
  }

  destroy() {
    const { host, actions } = this;
    for (const action of Object.keys(actions)) {
      host.removeEventListener(action, this);
    }
  }
}
