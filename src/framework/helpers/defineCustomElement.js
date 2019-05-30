import { attachPluginMap, PLUGINS } from './Plugin.js';
import Mixin from './Mixin.js';
import { applyMixins } from '../helpers/Mixin.js';
import { Actions } from '../plugins/ActionPlugin.js';
import { Attributes } from '../plugins/AttributePlugin.js';
import { Shadow } from '../plugins/ShadowPlugin.js';

const POD_REGISTRY = {};
const STATE = Symbol.for('__state__');

class CoreMixin extends Mixin {
  /**
   * Ivokes the lifecycle hooks for all attached plugins
   * and on the CustomElement itself.
   *
   * @param {string} hookName Lifecycle hook name
   * @param {...any} args Arguments to pass to hooks
   */
  invokeLifecycleHook(hookName, ...args) {
    const { [PLUGINS]: map, [hookName]: hook } = this;
    map && map.invoke(hookName, ...args);

    if (typeof hook === 'function') {
      hook.call(this, ...args);
    }
  }

  connectedCallback() {
    if (this.isConnected) {
      this.invokeLifecycleHook('onConnect');
    }
  }

  adoptedCallback() {
    this.invokeLifecycleHook('onAdopted');
  }

  disconnectedCallback() {
    if (!this.isConnected) {
      this.invokeLifecycleHook('onDisconnect');
    }
  }

  getState(attr, defaultValue) {
    let { [STATE]: state } = this;

    if (state[attr]) {
      return state[attr];
    }

    const value =
      typeof defaultValue === 'function'
        ? defaultValue.call(this)
        : defaultValue;

    this.setState(attr, value);
    return value;
  }

  setState(attr, value) {
    this[STATE][attr] = value;
  }
}

function setupCustomElement(DefinedElement, options) {
  const { plugins = [], mixins = [] } = options;
  applyMixins(DefinedElement, ...mixins);
  const INSTANCE_PLUGINS = [Shadow()];

  class CustomElement extends DefinedElement {
    constructor() {
      super();

      const {
        defaultState = {},
        actions = {},
        attributes = {}
      } = this.constructor;

      INSTANCE_PLUGINS.push(Actions(actions));
      INSTANCE_PLUGINS.push(Attributes(attributes));

      // setup state
      this[STATE] = { ...defaultState };

      // Setup plugins
      attachPluginMap(this, [...INSTANCE_PLUGINS, ...plugins]);
      this.invokeLifecycleHook('onInit');
    }
  }

  CoreMixin.apply(CustomElement);
  return CustomElement;
}

export default function defineCustomElement(
  name,
  DefinedElement,
  options = {}
) {
  const { extends: extendsOption } = options;
  delete options.extends;
  const CustomElement = setupCustomElement(DefinedElement, options);
  const params = [name, CustomElement];

  if (typeof extendsOption === 'string') {
    params.push({ extends: extendsOption });
  }

  customElements.define(...params);
}
