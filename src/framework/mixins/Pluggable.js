import Mixin from '../helpers/Mixin.js';

class PluginMap extends Map {
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

export default Mixin(HTMLClass => {
  class Pluggable extends HTMLClass {
    isPluggable = true;
    [PLUGINS] = new PluginMap();

    constructor() {
      super();
      const { plugins = [] } = this.constructor;

      for (const signature of plugins) {
        this.attachPlugin(signature);
      }
    }

    attachPlugin({ plugin: PluginClass, config }) {
      const { [PLUGINS]: map } = this;
      const plugin = new PluginClass(this, config);
      map.addPlugin(plugin);
    }
  }

  return Pluggable;
});
