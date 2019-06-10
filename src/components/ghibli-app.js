import { defineCustomElement, CoreElement } from '../framework/Just.js';
import store from '../store.js';

const { history, location } = window;

function getPageId() {
  const matches = location.hash.match(/\/page\/(.+)/);
  if (matches) {
    return matches[1];
  }
}

export default class GhibliApp extends CoreElement {
  static actions = {
    PUSH_HISTORY_STATE({ id: currentPage, title }, host) {
      const state = { currentPage };
      history.pushState(state, title, `#/page/${currentPage}`);
    },

    NAV_ITEM_SELECTED(film, host) {
      host.dispatchAction('PUSH_HISTORY_STATE', film);
      host.currentFilm = film;
      host.updateViewedFilm();
    }
  };

  static properties = {
    currentFilm: {
      get default() {
        const filmId = getPageId();

        return filmId
          ? store.films.find(film => film.id === filmId)
          : store.films[0];
      }
    }
  };

  constructor() {
    super();
    window.addEventListener('popstate', event => {
      const {
        state: { currentPage }
      } = event;
      this.updateViewedFilm();
    });
  }

  get pageNav() {
    return this.querySelector('nav[is="page-nav"]');
  }

  get filmDetails() {
    return this.querySelector('section[is="ghibli-film-details"]');
  }

  // TODO: Add a Channel class to allow subscriptions for updates like these
  updateViewedFilm() {
    const {
      pageNav,
      filmDetails,
      currentFilm: { id, title }
    } = this;

    pageNav.setAttribute('current-page', id);
    filmDetails.setAttribute('film', id);
    document.title = title;
  }

  async onConnect() {
    const { pageNav } = this;
    pageNav.items = store.films;
    this.updateViewedFilm();
  }
}

defineCustomElement('ghibli-app', GhibliApp);
