import Mixin, { mix } from '../helpers/Mixin.js';
import Pluggable, { PLUGINS } from './Pluggable.js';
import { assertHTMLElement } from '../helpers/utils.js';

export default Mixin(HTMLClass => {
  assertHTMLElement(HTMLClass, `[Lifecycle] Expected instance of HTMLElement`);

  class Lifecycle extends mix(HTMLClass).with(Pluggable) {
    constructor() {
      super();
      this.invokeLifecycleHook('onInit');
    }

    connectedCallback() {
      if (super.connectedCallback) {
        super.connectedCallback();
      }

      if (this.isConnected) {
        this.invokeLifecycleHook('onConnect');
      }
    }

    adoptedCallback() {
      if (super.adoptedCallback) {
        super.adoptedCallback();
      }

      this.invokeLifecycleHook('onAdopted');
    }

    disconnectedCallback() {
      if (super.disconnectedCallback) {
        super.disconnectedCallback();
      }

      if (!this.isConnected) {
        this.invokeLifecycleHook('onDisconnect');
      }
    }

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
  }

  return Lifecycle;
});
