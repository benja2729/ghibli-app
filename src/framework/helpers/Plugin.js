/**
 * @typedef PluginDefinition
 * @property {typeof Plugin} plugin A Plugin class
 * @property {object} config Configuration passed to the Plugin constructor
 */

/**
 * @callback PluginSignature
 * @param {object} config
 * @returns {PluginDefinition}
 */

export default class Plugin {
  /**
   * Returns a function that returns the plugin signature to be passed to PluginMap.
   * NOTE: Is set as a property to retain scope of `this`
   * @property {PluginSignature}
   */
  static get SIGNATURE() {
    return (config = {}) => ({ plugin: this, config });
  }

  constructor(host, config) {
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

export class PluginMap extends Map {
  /**
   * Restring default Map#set to unique instances of Plugin types
   * @param {typeof Plugin} PluginClass
   * @param {Plugin} plugin
   * @returns {this}
   */
  set(PluginClass, plugin) {
    if (plugin instanceof PluginClass && !this.has(PluginClass)) {
      super.set(PluginClass, plugin);
    }
    return this;
  }

  /**
   * Add a unique Plugin object to the map
   * @param {Plugin} plugin
   * @returns {boolean}
   */
  addPlugin(plugin) {
    const { constructor } = plugin;
    this.set(constructor, plugin);
    return this.has(constructor);
  }

  /**
   * Iterates through all Plugins and calls the passed lifecycle hook on each.
   * @param {string} hookName The name of the CustomElement lifecycle hook
   * @param {...any} params Parameters to pass to the lifecycle hook
   */
  invoke(hookName, ...params) {
    for (const plugin of this.values()) {
      const { [hookName]: hook } = plugin;

      if (typeof hook === 'function') {
        hook.call(plugin, ...params);
      }
    }
  }
}

export const PLUGINS = Symbol.for('__plugins__');

/**
 * Create a new PluginMap and add the PluginDefinitions in scope of the host
 * @param {HTMLElement} host The host element passed to the Plugin constructor
 * @param  {PluginDefinition[]} [pluginDefinitions] An array of PluginDefinitions
 */
export function attachPluginMap(host, pluginDefinitions = []) {
  const map = new PluginMap();

  for (const { plugin: PluginClass, config } of pluginDefinitions) {
    const plugin = new PluginClass(host, config);
    map.addPlugin(plugin);
  }

  host[PLUGINS] = map;
}
