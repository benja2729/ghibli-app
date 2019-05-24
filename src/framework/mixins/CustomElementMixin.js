import { ProtocolMap } from '../protocols/Protocol.js';
import ActionProtocol, { Actions } from '../protocols/ActionProtocol.js';
import { Attributes } from '../protocols/AttributeProtocol.js';
import { dispatchAction, attachBoundAttributes } from '../helpers/utils.js';

const PROTOCOLS = Symbol.for('__protocols__');
const STATE = Symbol.for('__state__');

/**
 * Create a new ProtocolMap and add the ProtocolDefinitions in scope of the host
 * @param {HTMLElement} host The host element passed to the Protocol constructor
 * @param  {ProtocolDefinition[]} protocolDefinitions An array of ProtocolDefinitions
 */
function attachProtocolMap(host, protocolDefinitions) {
  const map = new ProtocolMap();

  for (const { protocol: ProtocolClass, config } of protocolDefinitions) {
    const protocol = new ProtocolClass(host, config);
    map.addProtocol(protocol);
  }

  host[PROTOCOLS] = map;
}

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
   * Ensures that someone using this mixin cannot override the custom lifecycle workflow.
   * @param {CustomElement} host CustomElement instance
   */
  function protectLifecycleHooks(host) {
    const { prototype: proto } = CustomElement;
    const hooks = {
      connectedCallback: 'onConnect',
      adoptedCallback: 'onAdopt',
      disconnectedCallback: 'onDisconnect'
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
      attachProtocolMap(this, [
        Actions(actions),
        Attributes(attributes),
        ...protocols
      ]);
      protectLifecycleHooks(this);
      invokeLifecycleHook(this, 'onInit');
    }

    connectedCallback() {
      if (this.isConnected) {
        invokeLifecycleHook(this, 'onConnect');
      }
    }

    adoptedCallback() {
      invokeLifecycleHook(this, 'onAdopted')
    }

    disconnectedCallback() {
      if (!this.isConnected) {
        invokeLifecycleHook(this, 'onDisconnect');
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

    addActionListener(actionName, config) {
      this[PROTOCOLS].get(ActionProtocol).addAction(actionName, config);
    }

    dispatchAction(name, detail, options) {
      dispatchAction(this, name, detail, options);
    }
  }

  REGISTRY.set(HTMLClass, CustomElement);
  return CustomElement;
}
