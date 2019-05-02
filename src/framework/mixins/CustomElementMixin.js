import { dispatchAction } from '../helpers/utils.js';
import Actions, { ACTIONS } from '../helpers/Actions.js';
// import Mutations, { MUTATIONS } from '../helpers/Mutations.js';

const STATE = Symbol('__state__');

const REGISTRY = new Map();

function attr2prop(attr) {
  return attr.replace(/-(\w)/g, (_, char) => {
    return char.toUpperCase();
  });
}

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

    constructor() {
      super();

      const {
        actions = {},
        // mutations,
        template,
        shadowMode = 'open',
        defaultState = {},
        boundAttributes = []
      } = this.constructor;

      // Observe mutations
      // if (typeof mutations === 'object') {
      //   this[MUTATIONS] = new Mutations(this, mutations);
      // }

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
      for (const attr of boundAttributes) {
        Object.defineProperty(this, attr, {
          iterable: true,
          configurable: true,
          get() {
            return this.getState(attr) || this.getAttribute(attr);
          },
          set(value) {
            this.setState(attr, value);
            this.setAttribute(attr, value);
          }
        });
      }

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
        if (this[ACTIONS]) {
          this[ACTIONS].destroy();
        }

        if (this[MUTATIONS]) {
          this[MUTATIONS].destroy();
        }

        // instance-specific implementation
        this.onDisconnect();
      }
    }

    onDisconnect() {}

    // Will be called before `connectedCallback` if attribute is defined on html
    attributeChangedCallback(attrName, oldValue, newValue) {
      if (oldValue !== newValue) {
        const { boundAttributes = [] } = this.constructor;
        const changeFn = this[`${attr2prop(attrName)}Changed`];

        if (boundAttributes.includes(attrName)) {
          this.setState(attrName, newValue);
        }

        if (typeof changeFn === 'function') {
          changeFn.call(this, newValue, oldValue);
        }
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
      this[ACTIONS].addAction(actionName, config);
    }

    dispatchAction(name, detail, options) {
      dispatchAction(this, name, detail, options);
    }
  }

  REGISTRY.set(HTMLClass, CustomElement);
  return CustomElement;
}
