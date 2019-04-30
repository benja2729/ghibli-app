import CustomElement, { importStyles } from '../CustomElement.js';
importStyles(import.meta);

const NAV_LIST_SELECTOR = 'page-nav--list';
const NAV_LIST = document.createElement('ul');
NAV_LIST.classList.add(NAV_LIST_SELECTOR);

const NAV_ITEM_SELECTOR = 'page-nav--item';
const NAV_ITEM = document.createElement('li');
NAV_ITEM.classList.add(NAV_ITEM_SELECTOR);

const ACTIONS = {
  click(event, host) {
    event.stopPropagation();
    const { target } = event;
    const pageItem = target.closest('[page]');

    if (pageItem) {
      host.setAttribute('current-page', pageItem.getAttribute('page'));
    } else {
      const navItem = target.closest(`.${NAV_ITEM_SELECTOR}`);

      if (navItem) {
        host.selectedItem = navItem;
      }
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
      items: []
    };
  }

  onConnect() {
    this.renderNavList();
  }

  // Template must set the `[page]` attribute for this to work
  currentPageChanged(page) {
    const { navList } = this;

    if (!navList) { return; }
    const pageItem = navList.querySelector(`[page="${page}"]`);

    if (pageItem) {
      this.selectedItem = pageItem.closest(`.${NAV_ITEM_SELECTOR}`);
    } else {
      console.warn('[PageNav] template must set `[page]` attribute to update selected via `[current-page]`');
    }
  }

  get itemTemplate() {
    return this.querySelector('template');
  }

  get selectedItem() {
    return this.querySelector('[selected]');
  }

  set selectedItem(selected) {
    const { selectedItem } = this;

    if (selectedItem) {
      selectedItem.removeAttribute('selected');
    }

    selected.setAttribute('selected', '');
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

    this.appendChild(navList);
  }
}

PageNav.registerAs('page-nav', {
  extends: 'nav'
});

