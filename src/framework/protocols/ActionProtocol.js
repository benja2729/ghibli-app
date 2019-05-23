import Protocol from './Protocol.js';

export default class ActionProtocol extends Protocol {
  constructor(...args) {
    super(...args);
    this.actions = {};
  }

  onInit() {
    const { config: actions } = this;

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

export const Actions = ActionProtocol.SIGNATURE;
