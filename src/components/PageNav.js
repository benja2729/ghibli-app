import CustomElement, { CustomTemplate } from '../framework/CustomElement.js';

customElements.define('page-nav-item', CustomTemplate, {
  extends: 'template'
});

const ITEMS = [{
  text: 'one',
}, {
  text: 'two'
}, {
  text: 'three'
}];

const NAV_LIST = document.createElement('ul');
NAV_LIST.classList.add('page-nav--list');

const ACTIONS = {
  click: {
    // capture: true,
    handleEvent(event, host) {
      // event.stopPropagation();
      const { target } = event;

      if (target.hasAttribute('text-item')) {
        host.dispatch('PAGE_NAV_SELECTED', target.textContent);
      }
    }
  }
};

export default class PageNav extends CustomElement {
  static get actions() { return ACTIONS; }

  onConnect() {
    this.renderNavList();
  }

  renderNavList() {
    if (this.navList) {
      this.navList.remove();
    }

    const template = this.firstElementChild;
    const navList = NAV_LIST.cloneNode();
    this.navList = navList;

    for (const item of ITEMS) {
      navList.appendChild(template.render(item));
    }

    this.appendChild(navList);
  }
}
PageNav.registerAs('page-nav', {
  extends: 'nav'
});

