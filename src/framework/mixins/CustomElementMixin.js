import { attachProtocolMap, PROTOCOLS } from '../protocols/Protocol.js';
import { Actions } from '../protocols/ActionProtocol.js';
import { Attributes } from '../protocols/AttributeProtocol.js';

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
    const { [name]: protoHook} = proto;

    if (hook !== protoHook) {
      const {[name]: hookName} = hooks;
      throw new Error(`[CustomElement] Cannot assign '${name}' to '${host.localName}', use '${hookName}' instead.`)
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
 * @param {string} extendsElement Name of the tag being extended if HTMLClass is not HTMLElement
 * @return {typeof CustomElement}
 */
export default function CustomElementMixin(HTMLClass, extendsElement) {
  if (REGISTRY.has(HTMLClass)) {
    return REGISTRY.get(HTMLClass);
  }

  /**
   * Provides the base functionality extensions for Web Components.
   * @extends {typeof HTMLElement}
   */
  class CustomElement extends HTMLClass {
    static registerAs(name, options = {}) {
      if (typeof extendsElement !== 'string' && HTMLClass !== HTMLElement) {
        throw new Error(
          `Must provide 'extendsElement' to CustomElementMixin for ${HTMLClass}`
        );
      } else if (!options.extends) {
        options.extends = extendsElement;
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
        template,
        shadowMode = 'open',
        defaultState = {},
      } = this.constructor;

      // Attach shadow root
      if (typeof template === 'function') {
        const shadow = template(this, document);
        const root = this.attachShadow({ mode: shadowMode });

        if (shadow instanceof HTMLTemplateElement) {
          root.append(shadow.content.cloneNode(true));
        } else if (typeof shadow === 'string') {
          root.innerHTML = shadow;
        }

        this.$ = {};
        const elms = root.querySelectorAll('[id]');
        elms.forEach(({ id }) => {
          Object.defineProperty(this.$, id, {
            enumerable: true,
            get() {
              return root.getElementById(id);
            }
          });
        });
      }

      // setup state
      this[STATE] = { ...defaultState };

      // Setup protocols
      attachProtocolMap(this, [
        Actions(actions),
        Attributes(attributes),
        ...protocols
      ]);
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
      this.invokeLifecycleHook('onAdopted')
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
