import registerCustomElement from '../framework/Just.js';
import store from '../store.js';

const { history, location } = window;

function getPageId() {
  const matches = location.hash.match(/\/page\/(.+)/);
  if (matches) {
    return matches[1];
  }
}

export default class GhibliApp extends HTMLElement {
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
    return this.getState('pageNav', () =>
      this.querySelector('nav[is="page-nav"]')
    );
  }

  get filmDetails() {
    return this.getState('filmDetails', () =>
      this.querySelector('section[is="ghibli-film-details"]')
    );
  }

  get currentFilm() {
    let film = this.getState('currentFilm');

    if (!film) {
      const filmId = getPageId();

      if (filmId) {
        film = store.films.find(film => film.id === filmId);
      } else {
        film = store.films[0];
        this.dispatchAction('PUSH_HISTORY_STATE', film);
      }

      this.setState('currentFilm', film);
    }

    return film;
  }

  set currentFilm(film) {
    this.setState('currentFilm', film);
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
    const films = await store.find('films');
    pageNav.items = films;
    this.updateViewedFilm();
  }
}

GhibliApp.actions = {
  PUSH_HISTORY_STATE(
    {
      detail: { id: currentPage, title }
    },
    host
  ) {
    const state = { currentPage };
    history.pushState(state, title, `#/page/${currentPage}`);
  },

  NAV_ITEM_SELECTED({ detail: film }, host) {
    host.dispatchAction('PUSH_HISTORY_STATE', film);
    host.currentFilm = film;
    host.updateViewedFilm();
  }
};

registerCustomElement(import.meta, GhibliApp);
