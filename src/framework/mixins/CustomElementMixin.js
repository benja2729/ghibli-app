import { attachProtocolMap, PROTOCOLS } from '../protocols/Protocol.js';
import { Actions } from '../protocols/ActionProtocol.js';
import { Attributes } from '../protocols/AttributeProtocol.js';
import { Shadow } from '../protocols/ShadowProtocol.js';

const STATE = Symbol.for('__state__');

/**
 * Ensures that someone using this mixin cannot override the custom lifecycle workflow.
 * @param {CustomElement} host CustomElement instance
 * @param {typeof CustomElement} customElement
 * @throws {Error}
 */
function protectPrototype(host, customElement) {
  const { prototype: proto } = customElement;
  const hooks = {
    connectedCallback: 'onConnect',
    adoptedCallback: 'onAdopt',
    disconnectedCallback: 'onDisconnect',
    invokeLifecycleHook: 'Protocols'
  };

  for (const name of Object.keys(hooks)) {
    const { [name]: hook } = host;
    const { [name]: protoHook } = proto;

    if (hook !== protoHook) {
      const { [name]: hookName } = hooks;
      throw new Error(
        `[CustomElement] Cannot assign '${name}' to '${
          host.localName
        }', use '${hookName}' instead.`
      );
    }
  }
}

/**
 * @type {Map<typeof HTMLElement, typeof CustomElement>}
 */
const REGISTRY = new Map();

/**
 * Provides the base functionality extensions for Web Components.
 *
 * @param {typeof HTMLElement} HTMLClass HTMLElement or subclass
 * @param {string} nativTagExtension Name of the tag being extended if HTMLClass is not HTMLElement
 * @return {typeof CustomElement}
 */
export default function CustomElementMixin(HTMLClass, nativTagExtension) {
  if (REGISTRY.has(HTMLClass)) {
    return REGISTRY.get(HTMLClass);
  }

  const extendsNativeTag =
    HTMLClass !== HTMLElement && HTMLClass.prototype instanceof HTMLElement;

  if (extendsNativeTag && typeof nativTagExtension !== 'string') {
    throw new Error(
      `Must provide 'extendsElement' to CustomElementMixin for ${HTMLClass}`
    );
  }

  /**
   * Provides the base functionality extensions for Web Components.
   * @extends {typeof HTMLElement}
   */
  class CustomElement extends HTMLClass {
    static registerAs(name, options = {}) {
      if (extendsNativeTag && !options.extends) {
        options.extends = nativTagExtension;
      }

      window.customElements.define(name, this, options);
    }

    constructor() {
      super();
      protectPrototype(this, CustomElement);

      const {
        protocols = [],
        actions = {},
        attributes = {},
        defaultState = {}
      } = this.constructor;

      const INSTANCE_PROTOCOLS = [Actions(actions), Attributes(attributes)];

      if (!extendsNativeTag) {
        INSTANCE_PROTOCOLS.push(Shadow());
      }

      // setup state
      this[STATE] = { ...defaultState };

      // Setup protocols
      attachProtocolMap(this, [...INSTANCE_PROTOCOLS, ...protocols]);
      this.invokeLifecycleHook('onInit');
    }

    /**
     * Ivokes the lifecycle hooks for all attached protocols
     * and on the CustomElement itself.
     *
     * @param {string} hookName Lifecycle hook name
     * @param {...any} args Arguments to pass to hooks
     */
    invokeLifecycleHook(hookName, ...args) {
      const { [PROTOCOLS]: map, [hookName]: hook } = this;
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

    /**
     * Instance methods
     */
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

  REGISTRY.set(HTMLClass, CustomElement);
  return CustomElement;
}
