import controller from './controller';
import template from './templates/index.html';

export default {
  template,
  controller,
  bindings: {
    url: '@?',
    config: '<?',
  },
};