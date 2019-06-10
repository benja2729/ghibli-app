import store from './store.js';

store.find('films').then(() => {
  import('./framework/templates/CustomTemplate.js');
  import('./transforms/index.js');

  import('./components/page-nav.js');
  import('./components/ghibli-film-details.js');
  import('./components/ghibli-app.js');
});
