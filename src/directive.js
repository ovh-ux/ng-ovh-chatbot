import template from './templates/index.html';

export default () => ({
  template,
  restrict: 'E',
  replace: true,
  controller: 'chatbotController',
  controllerAs: 'ctrl',
  bindTocontroller: true,
  link(scope, elem, attrs, ctrl) {
    ctrl.pullRate = 2;
    if (attrs.pull && Number.isInteger(parseInt(attrs.pull, 10))) {
      ctrl.pullRate = parseInt(attrs.pull, 10);
    }

    const draggableOptions = {
      handle: '.chatbot-header',
      cursor: 'move',
      containment: 'window',
    };

    ctrl.enableDrag = () => {
      elem.find('.chatbot-main').draggable(draggableOptions);
    };

    scope.$watch(
      () => ctrl.options.enable ? elem.find('.chatbot-messages')[0].scrollHeight : 0,
      newV => elem.find('.chatbot-messages').scrollTop(newV),
    );

    scope.$watch(ctrl.hidden, hidden => !hidden ? elem.find('input.chatbot-input').focus() : null);
  },
});
