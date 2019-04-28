import CustomElement from '../framework/CustomElement.js';

const ITEMS = [{
  text: 'one',
}, {
  text: 'two'
}, {
  text: 'three'
}];

const NAV_LIST = document.createElement('ul');
NAV_LIST.classList.add('page-nav--list');
const NAV_ITEM = document.createElement('li');
NAV_ITEM.classList.add('page-nav---item');

const ACTIONS = {
  click(event, host) {
    event.stopPropagation();
    const { target } = event;

    if (target.hasAttribute('navigate-to')) {
      const to = target.getAttribute('navigate-to');
      host.setAttribute('current-page', to);
      host.dispatch('PAGE_NAV_SELECTED', to);
    }
  }
};

export default class PageNav extends CustomElement {
  static get actions() { return ACTIONS; }

  static get observedAttributes() {
    return ['current-page'];
  }

  static get defaultState() {
    return {
      items: ITEMS
    };
  }

  onConnect() {
    this.itemTemplate = this.querySelector('template');
    this.renderNavList();
  }

  currentPageChanged(current) {
    this.resolveSelected(current);
  }

  get templateHook() {
    const { itemTemplate } = this;

    if (itemTemplate) {
      return itemTemplate.hook;
    }
  }

  get items() {
    return this.getState('items');
  }

  set items(items) {
    this.setState('items', items);

    if (this.itemTemplate) {
      this.renderNavList();
    }
  }

  resolveSelected(navTo) {
    const { navList } = this;

    if (navList) {
      const items = navList.querySelectorAll('[selected]');

      for (const item of items) {
        item.removeAttribute('selected');
      }

      if (navTo) {
        const selected = navList.querySelector(
          `[navigate-to="${navTo}"]`
        );
        selected.setAttribute('selected', '');
      }
    }
  }

  renderNavList() {
    if (this.navList) {
      this.navList.remove();
    }

    const { itemTemplate, items } = this;
    const navList = NAV_LIST.cloneNode();
    this.navList = navList;

    for (const item of items) {
      const navItem = NAV_ITEM.cloneNode();
      const root = itemTemplate.render(item);
      navItem.append(...root.children);
      navList.appendChild(navItem);
    }

    this.resolveSelected(this.getAttribute('current-page'));
    this.appendChild(navList);
  }
}
PageNav.registerAs('page-nav', {
  extends: 'nav'
});

