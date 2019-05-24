import { ProtocolMap } from '../protocols/Protocol.js';
import { Actions } from '../protocols/ActionProtocol.js';
import { Attributes } from '../protocols/AttributeProtocol.js';
import { dispatchAction, attachBoundAttributes } from '../helpers/utils.js';

const PROTOCOLS = Symbol.for('__protocols__');
const STATE = Symbol.for('__state__');

/**
 * Ivokes the lifecycle hooks for all attached protocols
 * and on the CustomElement itself.
 *
 * @param {HTMLElement} host CustomElement host
 * @param {string} hookName Lifecycle hook name
 */
function invokeLifecycleHook(host, hookName) {
  const { [PROTOCOLS]: map, [hookName]: hook } = host;
  map.invoke(hookName);

  if (typeof hook === 'function') {
    hook.call(host);
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

    static get boundAttributes() {
      return this.observedAttributes;
    }

    constructor() {
      super();

      const {
        protocols = [],
        actions = {},
        attributes = {},
        template,
        shadowMode = 'open',
        defaultState = {},
        boundAttributes
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

      // bind properties and attributes
      attachBoundAttributes(this, boundAttributes);

      // Setup protocols
      const INSTANCE_PROTOCOLS = [
        Actions(actions),
        Attributes(attributes),
        ...protocols
      ];
      this[PROTOCOLS] = ProtocolMap.create(this, INSTANCE_PROTOCOLS);

      // instance-specific implementation
      invokeLifecycleHook(this, 'onInit');
    }

    /**
     * Lifecycle hooks
     */
    onInit() {}

    connectedCallback() {
      if (this.isConnected) {
        // instance-specific implementation
        invokeLifecycleHook(this, 'onConnect');
      }
    }

    onConnect() {}

    disconnectedCallback() {
      if (!this.isConnected) {
        // instance-specific implementation
        invokeLifecycleHook(this, 'onDisconnect');
      }
    }

    onDisconnect() {}

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

    addActionListener(actionName, config) {
      this[PROTOCOLS].get(ACTIONS).addAction(actionName, config);
    }

    dispatchAction(name, detail, options) {
      dispatchAction(this, name, detail, options);
    }
  }

  REGISTRY.set(HTMLClass, CustomElement);
  return CustomElement;
}
