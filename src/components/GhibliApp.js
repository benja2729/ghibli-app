import CustomElement from '../framework/CustomElement.js';
import { ajax } from '../helpers/utils.js';

const { history, location } = window;

const ACTIONS = {
  NAV_ITEM_SELECTED({ detail: film }, host) {
    const { id: currentPage, title } = film;
    const state = { currentPage };
    history.pushState(state, title, `#/page/${currentPage}`);
    host.updateViewedFilm();
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
      this.updateViewedFilm();
    });
  }

  get pageNav() {
    return this.getState('pageNav', () => this.querySelector('nav[is="page-nav"]'));
  }

  get filmDetails() {
    return this.getState('filmDetails', () => this.querySelector(
      'section[is="ghibli-film-details"]'
    ));
  }

  get currentFilm() {
    const filmId = getPageId();

    if (filmId) {
      return this.films.find(film => film.id === filmId);
    }

    return this.films[0];
  }

  getFilms() {
    return ajax('https://ghibliapi.herokuapp.com/films');
  }

  // TODO: Add a Channel class to allow subscriptions for updates like these
  updateViewedFilm() {
    const { pageNav, filmDetails, currentFilm } = this;
    const { id, title } = currentFilm;

    pageNav.setAttribute('current-page', id);
    filmDetails.film = currentFilm;
    filmDetails.setAttribute('film', id);
    document.title = title;
  }

  async onConnect() {
    const { pageNav } = this;
    const films = await this.getFilms();
    this.films = films;
    pageNav.items = films;
    this.updateViewedFilm();
  }
}

GhibliApp.registerAs('ghibli-app');

