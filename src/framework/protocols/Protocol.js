/**
 * @typedef ProtocolDefinition
 * @property {typeof Protocol} protocol A Protocol class
 * @property {object} config Configuration passed to the Protocol constructor
 */

/**
 * @callback ProtocolSignature
 * @param {object} config
 * @returns {ProtocolDefinition}
 */

export default class Protocol {
  /**
   * @property {ProtocolSignature}
   */
  static get SIGNATURE() {
    return config => ({ protocol: this, config });
  }

  constructor(host, config = {}) {
    Object.defineProperties(this, {
      host: {
        configurable: false,
        writable: false,
        enumerable: true,
        value: host
      },
      config: {
        configurable: false,
        writable: false,
        enumerable: true,
        value: { ...config }
      }
    });
  }
  onInit() {}
  onConnect() {}
  onDisconnect() {}
}

export class ProtocolMap extends Map {
  /**
   * Create a new ProtocolMap and add the ProtocolDefinitions in scope of the host
   * @param {HTMLElement} host The host element passed to the Protocol constructor
   * @param  {ProtocolDefinition[]} protocolDefinitions An array of ProtocolDefinitions
   * @returns {ProtocolMap}
   */
  static create(host, protocolDefinitions) {
    const map = new this();

    for (const { protocol: ProtocolClass, config } of protocolDefinitions) {
      const protocol = new ProtocolClass(host, config);
      map.addProtocol(protocol);
    }

    return map;
  }

  set(ProtocolClass, protocol) {
    if (protocol instanceof ProtocolClass && !this.has(ProtocolClass)) {
      super.set(ProtocolClass, protocol);
    }
  }

  /**
   * Add a unique Protocol object to the map
   *
   * @param {Protocol} protocol
   */
  addProtocol(protocol) {
    const { constructor } = protocol;
    this.set(constructor, protocol);
  }

  /**
   * Iterates through all Protocols and calls the passed lifecycle hook on each.
   *
   * @param {string} hookName The name of the CustomElement lifecycle hook
   * @param {...any} params Parameters to pass to the lifecycle hook
   */
  invoke(hookName, ...params) {
    for (const protocol of this.values()) {
      const { [hookName]: hook } = protocol;

      if (typeof hook === 'function') {
        hook.call(protocol, ...params);
      }
    }
  }
}
