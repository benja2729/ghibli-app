import Plugin from '../helpers/Plugin.js';

export function dispatchAction(host, name, detail, options = {}) {
  const action = new CustomEvent(name, {
    bubbles: true,
    composed: true,
    cancelable: true,
    ...options,
    detail
  });
  host.dispatchEvent(action);
}

export default class ActionPlugin extends Plugin {
  onInit() {
    this.actions = {};
    const { host, config: actions } = this;

    // Define `dispatchAction` on host
    host.dispatchAction = dispatchAction.bind(null, host);

    for (const [name, config] of Object.entries(actions)) {
      this.addAction(name, config);
    }
  }

  addAction(name, config) {
    const { host, actions } = this;

    switch (typeof config) {
      case 'object':
        if (config && !Array.isArray(config)) {
          actions[name] = config.handleEvent;
          host.addEventListener(name, this, config);
          break;
        }
      case 'function':
        actions[name] = config;
        host.addEventListener(name, this, false);
        break;
      default:
        throw new TypeError(
          `[Actions] Expected action '${name}' to be called with a function or object`
        );
    }
  }

  handleEvent(event) {
    const {
      host,
      actions: { [event.type]: callback }
    } = this;

    callback.call(this, event, host);
  }

  onDisconnect() {
    const { host, actions } = this;

    for (const action of Object.keys(actions)) {
      host.removeEventListener(action, this);
    }
  }
}

export const Actions = ActionPlugin.SIGNATURE;
