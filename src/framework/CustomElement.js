import CustomElementMixin from './components/CustomElementMixin.js';

export { dispatchAction } from './helpers/utils.js';
export { default as importStyles } from './importStyles.js';
export { default as CustomTemplate } from './components/CustomTemplate.js';
export { default as Fragment } from './components/Fragment.js';
export { CustomElementMixin as CustomElementMixin };
export default class CustomElement extends CustomElementMixin(HTMLElement) {}

