import angular from 'angular';
import translate from 'angular-translate';

import '@ovh-ux/ng-translate-async-loader';

import service from './service';
import component from './component';
import iconsTemplate from './templates/icons.html';

import './index.less';

const moduleName = 'ngOvhChatbot';

angular
  .module(moduleName, [
    'ngTranslateAsyncLoader',
    translate,
  ])
  .service('ChatbotService', service)
  .component('ovhChatbot', component)
  .component('ovhChatbotIcons', { template: iconsTemplate })
  .run(/* @ngTranslationsInject:xml ./translations */);

export default moduleName;
