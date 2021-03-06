import template from './templates/header-navbar.template.html';
import controller from './controllers/header-navbar.controller';

const headerNavbar = {
  controller,
  template,
  bindings: {
    dashboardsMenu: '<',
  },
};

export default headerNavbar;
