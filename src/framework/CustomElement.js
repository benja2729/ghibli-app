import CustomElementMixin from './mixins/CustomElementMixin.js';

export { dispatchAction } from './protocols/ActionProtocol.js';
export { default as importStyles } from './importStyles.js';
export { default as CustomTemplate } from './templates/CustomTemplate.js';
export { default as Fragment } from './components/Fragment.js';
export { CustomElementMixin };
export default class CustomElement extends CustomElementMixin(HTMLElement) {}
