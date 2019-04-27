import { dispatchAction } from '../helpers/utils.js';
import Actions, { ACTIONS } from '../helpers/Actions.js';
import Mutations, { MUTATIONS } from '../helpers/Mutations.js';

const STATE = Symbol('__state__');

const REGISTRY = new Map();

export default function CustomElementMixin(HTMLClass, extendsElement) {
  if (REGISTRY.has(HTMLClass)) {
    return REGISTRY.get(HTMLClass);
  }

  class CustomElement extends HTMLClass {
    static registerAs(name) {
      const options = {};

      if (typeof extendsElement !== 'string' && HTMLClass !== HTMLElement) {
        throw new Error(
          `Must provide 'extendsElement' to CustomElementMixin for ${HTMLClass}`
        );
      } else {
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
        actions,
        mutations,
        template,
        shadowMode = 'open',
        defaultState = {},
        boundAttributes = []
      } = this.constructor;

      // Observe mutations
      if (typeof mutations === 'object') {
        this[MUTATIONS] = new Mutations(this, mutations);
      }

      // Attach shadow root
      if (typeof template === 'function') {
        const shadow = template(this, document);
        const root = this.attachShadow({ mode: shadowMode });

        if (shadow instanceof HTMLTemplateElement) {
          root.append(shadow.content.cloneNode(true));
        } else if (shadow instanceof Fragment) {
          shadow.attachTo(root);
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
      if (typeof actions === 'object') {
        this[ACTIONS] = new Actions(this, actions);
      }

      // setup state
      this[STATE] = defaultState;

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
    onInit() {console.log('onInit', this)}

    connectedCallback() {
      if (this.isConnected) {

        // instance-specific implementation
        this.onConnect();
      }
      console.log('end of connectedCallback', this);
    }

    onConnect() {console.log('onConnect', this)}

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
      console.log('end of disconnectedCallback', this);
    }

    onDisconnect() {console.log('onDisconnect', this)}

    // Will be called before `connectedCallback` if attribute is defined on html
    attributeChangedCallback(attrName, oldValue, newValue) {
      if (oldValue !== newValue) {
        const { observedAttributes = [] } = this.constructor;
        const changeFn = this[`${attrName}Changed`];

        if (observedAttributes.includes(attrName)) {
          this.setState(attrName, newValue);
        }

        if (typeof changeFn === 'function') {
          changeFn.call(this, newValue, oldValue);
        }
      }

      console.log(`'${attrName}' changed`, this);
    }

    /**
     * Instance methods
     */
    getState(attr) {
      return this[STATE][attr];
    }

    setState(attr, value) {
      this[STATE][attr] = value;
    }

    dispatch(name, detail, options) {
      dispatchAction(this, name, detail, options);
    }
  }

  REGISTRY.set(HTMLClass, CustomElement);
  return CustomElement;
}

