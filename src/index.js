import angular from 'angular';
import translate from 'angular-translate';

import '@ovh-ux/ng-translate-async-loader';

import service from './service';
import livechatService from './livechat.service';
import livechatFactory from './livechat.factory';
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
  .service('LivechatService', livechatService)
  .factory('LivechatFactory', livechatFactory)
  .component('ovhChatbot', component)
  .component('ovhChatbotIcons', { template: iconsTemplate })
  .run(/* @ngTranslationsInject:xml ./translations */);

export default moduleName;
