import registerCustomElement from '../Just.js';
import ActionPlugin from '../plugins/ActionPlugin.js';
import { PLUGINS } from '../helpers/Plugin.js';

const NAV_LIST_SELECTOR = 'page-nav--list';
const NAV_LIST = document.createElement('ul');
NAV_LIST.classList.add(NAV_LIST_SELECTOR);

const NAV_ITEM_SELECTOR = 'page-nav--item';
const NAV_ITEM = document.createElement('li');
NAV_ITEM.classList.add(NAV_ITEM_SELECTOR);

function click(event) {
  event.stopPropagation();
  const { target, currentTarget: host } = event;
  const navItem = target.closest(`.${NAV_ITEM_SELECTOR}`);

  if (navItem) {
    host.selectedItem = navItem;
  }
}

export default class PageNav extends HTMLElement {
  static get defaultState() {
    return {
      items: []
    };
  }

  static get attributes() {
    return {
      // Template must set the `[page]` attribute for this to work
      currentPage(host, page) {
        const { navList, currentPage } = host;

        if (!navList || currentPage === page) {
          return;
        }
        const pageItem = navList.querySelector(`[page="${page}"]`);

        if (pageItem) {
          host.selectedItem = pageItem.closest(`.${NAV_ITEM_SELECTOR}`);
        } else {
          console.warn(
            '[PageNav] template must set `[page]` attribute to update selected via `[current-page]`'
          );
        }
      }
    };
  }

  onInit() {
    this[PLUGINS].get(ActionPlugin).addAction('click', click);
  }

  onConnect() {
    this.renderNavList();
  }

  onDisconnect() {
    this.removeEventListener('click', click, false);
  }

  get currentPage() {
    const { selectedItem } = this;

    if (selectedItem) {
      const pageItem = selectedItem.querySelector('[page]');
      return pageItem && pageItem.getAttribute('page');
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
    this.currentPage = this.currentPage || false;
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

registerCustomElement(import.meta, PageNav, {
  extends: 'nav'
});
