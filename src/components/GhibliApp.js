import CustomElement, { importStyles } from '../framework/CustomElement.js';
import { ajax } from '../helpers/utils.js';

importStyles(import.meta);

const { history, location } = window;

const ACTIONS = {
  NAV_ITEM_SELECTED({ detail: { id: currentPage, title } }) {
    const state = { currentPage };
    history.pushState(state, title, `#/page/${currentPage}`);
    document.title = title;
  }
};

function getPageId() {
  const matches = location.hash.match(/\/page\/(.+)/)
  if (matches) {
    return matches[1];
  }
}

export default class GhibliApp extends CustomElement {
  static get actions() { return ACTIONS; }

  constructor() {
    super();
    window.addEventListener('popstate', (event) => {
      const { state: { currentPage } } = event;
      this.pageNav.setAttribute('current-page', currentPage);
    });
  }

  get pageNav() {
    return this.getState('pageNav', () => this.querySelector('nav[is="page-nav"]'));
  }

  getFilms() {
    // TODO: Add a Channel class to allow subscriptions for updates like these
    return ajax('https://ghibliapi.herokuapp.com/films');
  }

  async onConnect() {
    const pageId = getPageId();
    const films = await this.getFilms();
    const currentPage = films.find(film => film.id === pageId);
    const { pageNav } = this;
    pageNav.items = films;

    if (currentPage) {
      pageNav.setAttribute('current-page', currentPage.id);
      document.title = currentPage.title;
    }
  }
}
GhibliApp.registerAs('ghibli-app');

