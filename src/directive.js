import controller from './controller';
import template from './templates/index.html';

export default () => ({
  template,
  restrict: 'E',
  controller,
  controllerAs: '$ctrl',
  bindTocontroller: true,
});
