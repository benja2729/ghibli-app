import Actions, { ACTIONS } from '../helpers/Actions.js';
import Mutations, { MUTATIONS } from '../helpers/Mutations.js';
import { dispatchAction, attachBoundAttributes } from '../helpers/utils.js';

const STATE = Symbol('__state__');

const REGISTRY = new Map();

export default function CustomElementMixin(HTMLClass, extendsElement) {
  if (REGISTRY.has(HTMLClass)) {
    return REGISTRY.get(HTMLClass);
  }

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
        actions = {},
        mutations,
        template,
        shadowMode = 'open',
        defaultState = {},
        boundAttributes
      } = this.constructor;

      // Observe mutations
      this[MUTATIONS] = new Mutations(this, mutations);

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

      // setup actions
      this[ACTIONS] = new Actions(this, actions);

      // setup state
      this[STATE] = { ...defaultState };

      // bind properties and attributes
      attachBoundAttributes(this, boundAttributes);

      // instance-specific implementation
      this.onInit();
    }

    /**
     * Lifecycle hooks
     */
    onInit() {}

    connectedCallback() {
      if (this.isConnected) {
        // instance-specific implementation
        this.onConnect();
      }
    }

    onConnect() {}

    disconnectedCallback() {
      if (!this.isConnected) {
        this[ACTIONS].destroy();
        this[MUTATIONS].destroy();

        // instance-specific implementation
        this.onDisconnect();
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
      this[ACTIONS].addAction(actionName, config);
    }

    dispatchAction(name, detail, options) {
      dispatchAction(this, name, detail, options);
    }
  }

  REGISTRY.set(HTMLClass, CustomElement);
  return CustomElement;
}
