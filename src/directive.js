import template from './templates/index.html';

export default () => ({
  template,
  restrict: 'E',
  replace: true,
  controller: 'chatbotController',
  controllerAs: 'ctrl',
  bindTocontroller: true,
  link(scope, elem, attrs, ctrl) {
    const draggableOptions = {
      handle: '.chatbot-header',
      cursor: 'move',
      containment: 'window',
    };

    ctrl.enableDrag = () => {
      elem.find('.chatbot-main').draggable(draggableOptions);
    };
  },
});
