import angular from 'angular';
import translate from 'angular-translate';

import '@ovh-ux/ng-translate-async-loader';

import service from './service';
import directive from './directive';
import iconsTemplate from './templates/icons.html';

import './index.less';

const moduleName = 'ngOvhChatbot';

angular
  .module(moduleName, [
    'ngTranslateAsyncLoader',
    translate,
  ])
  .service('ChatbotService', service)
  .directive('ovhChatbot', directive)
  .component('ovhChatbotIcons', { template: iconsTemplate })
  .run(/* @ngTranslationsInject:xml ./translations */)
  .constant('CHATBOT_MESSAGE_TYPES', {
    bot: 'bot',
    user: 'user',
    postback: 'postback',
    survey: 'survey',
  })
  .constant('CHATBOT_API_ACTIONS', {
    talk: 'talk',
    history: 'history',
    feedback: 'feedback',
    suggestions: 'suggestions',
    topKnowledge: 'topKnowledge',
  })
  .constant('CHATBOT_CONFIG', {
    secondsBeforeSurvey: 3000,
  });

export default moduleName;
