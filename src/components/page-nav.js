import { CoreElement, registerComponent } from '../framework/Just.js';

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

export default class PageNav extends CoreElement {
  static attributes = {
    // Template must set the `[page]` attribute for this to work
    currentPage(host, page) {
      const { navList } = host;

      if (!navList) {
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

  static properties = {
    items: {
      get default() {
        return [];
      },
      onChange(host, items) {
        if (host.itemTemplate) {
          host.renderNavList(items);
        }
      }
    }
  };

  onInit() {
    this.addEventListener('click', click);
  }

  onDisconnect() {
    this.removeEventListener('click', click, false);
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

  renderNavList(items) {
    if (this.navList) {
      this.navList.remove();
    }

    const { itemTemplate } = this;
    const navList = (this.navList = NAV_LIST.cloneNode());

    for (const item of items) {
      const navItem = NAV_ITEM.cloneNode();
      const root = itemTemplate.render(item);
      navItem.append(...root.children);
      navList.appendChild(navItem);
    }

    this.appendChild(navList);
  }
}

registerComponent(import.meta, PageNav, {
  extends: 'nav'
});
