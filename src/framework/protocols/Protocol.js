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
   * Returns a function that returns the protocol signature to be passed to ProtocolMap.
   * NOTE: Is set as a property to retain scope of `this`
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
        value: Object.freeze({ ...config })
      }
    });
  }
}

export class ProtocolMap extends Map {
  /**
   * Restring default Map#set to unique instances of Protocol types
   * @param {typeof Protocol} ProtocolClass 
   * @param {Protocol} protocol 
   * @returns {this}
   */
  set(ProtocolClass, protocol) {
    if (protocol instanceof ProtocolClass && !this.has(ProtocolClass)) {
      super.set(ProtocolClass, protocol);
    }
    return this;
  }

  /**
   * Add a unique Protocol object to the map
   * @param {Protocol} protocol
   * @returns {boolean}
   */
  addProtocol(protocol) {
    const { constructor } = protocol;
    this.set(constructor, protocol);
    return this.has(constructor);
  }

  /**
   * Iterates through all Protocols and calls the passed lifecycle hook on each.
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
