import Mixin from '../helpers/Mixin.js';
import Cache from '../helpers/Cache.js';
import { assertHTMLElement } from '../helpers/utils.js';

const CUSTOM_ACTION_NAME = 'JUST_CUSTOM_ACTION';
const ACTION_DEFINITIONS = Symbol.for('__action_definitions__');
const ACTION_HANDLERS = Cache(host => {
  return event => {
    const {
      detail: { type, data }
    } = event;
    const {
      [ACTION_DEFINITIONS]: { [type]: handler }
    } = host;

    if (typeof handler === 'function') {
      if (handler(data, host) === true) {
        return;
      }

      event.stopPropagation();
    }
  };
}, WeakMap);

export function dispatchAction(host, type, data) {
  const action = new CustomEvent(CUSTOM_ACTION_NAME, {
    bubbles: true,
    composed: true,
    cancelable: true,
    detail: { type, data }
  });
  host.dispatchEvent(action);
}

export default Mixin(HTMLClass => {
  assertHTMLElement(HTMLClass, `[Actionable] Expected instance of HTMLElement`);

  class Actionable extends HTMLClass {
    isActionable = true;
    [ACTION_DEFINITIONS] = {};

    constructor() {
      super();

      const {
        constructor: { actions = {} }
      } = this;

      for (const [type, handler] of Object.entries(actions)) {
        this.addActionHandler(type, handler);
      }

      const actionHandler = ACTION_HANDLERS.get(this);
      this.addEventListener(CUSTOM_ACTION_NAME, actionHandler, false);
    }

    disconnectedCallback() {
      super.disconnectedCallback();

      if (!this.isConnected) {
        const actionHandler = ACTION_HANDLERS.get(this);
        ACTION_HANDLERS.delete(this);
        this.removeEventListener(CUSTOM_ACTION_NAME, actionHandler);
      }
    }

    addActionHandler(type, handler) {
      this[ACTION_DEFINITIONS][type] = handler;
    }

    removeActionHandler(type) {
      delete this[ACTION_DEFINITIONS];
    }

    dispatchAction(type, data) {
      dispatchAction(this, type, data);
    }
  }

  return Actionable;
});
