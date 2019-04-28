import { CustomTemplate } from '../framework/CustomElement.js';

class PageNavItemTemplate extends CustomTemplate {
  pageStrategy(segment, context) {
    const { text } = context;
    segment.setAttribute('navigate-to', text);
    segment.textContent = text;
  }
}
customElements.define('page-nav-item', PageNavItemTemplate, {
  extends: 'template'
});

