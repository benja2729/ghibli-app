import CustomElement from '../framework/CustomElement.js';

const ACTIONS = {
  PAGE_NAV_SELECTED({ detail: pageName }) {
    console.log(pageName);
  }
};

export default class GhibliApp extends CustomElement {
  static get actions() { return ACTIONS; }
}
GhibliApp.registerAs('ghibli-app');

