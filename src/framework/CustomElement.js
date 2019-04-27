import CustomElementMixin from './components/CustomElementMixin.js';

export { dispatchAction } from './helpers/utils.js';
export { default as Fragment } from './components/Fragment.js';
export { CustomElementMixin as CustomElementMixin };
export default class CustomElement extends CustomElementMixin(HTMLElement) {}

