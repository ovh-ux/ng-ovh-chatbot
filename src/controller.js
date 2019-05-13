import isEmpty from 'lodash/isEmpty';
import isString from 'lodash/isString';
import remove from 'lodash/remove';

class ChatbotCtrl {
  /* @ngInject */
  constructor(
    $element,
    $q,
    $rootScope,
    $scope,
    $timeout,
    $translate,
    ChatbotService,
    CHATBOT_CONFIG,
    CHATBOT_MESSAGE_TYPES,
    CHATBOT_SURVEY_STEPS,
  ) {
    this.$element = $element;
    this.$q = $q;
    this.$rootScope = $rootScope;
    this.$scope = $scope;
    this.$timeout = $timeout;
    this.$translate = $translate;
    this.ChatbotService = ChatbotService;
    this.CONFIG = CHATBOT_CONFIG;
    this.MESSAGE_TYPES = CHATBOT_MESSAGE_TYPES;
    this.SURVEY_STEPS = CHATBOT_SURVEY_STEPS;
  }

  $onInit() {
    this.started = false;
    this.hidden = true;
    this.messages = [];
    this.suggestions = [];

    this.loaders = {
      isStarting: false,
      isAsking: false,
      isGettingSuggestions: false,
    };

    this.options = {
      isEnabled: true,
      showOpenButton: false,
    };

    this.$rootScope.$on('ovh-chatbot:open', () => this.open());
    this.$rootScope.$on('ovh-chatbot:opened', () => this.focusInput());
  }

  pushMessageToUI(message) {
    this.messages.push(message);
  }

  botMessage(translateId, params) {
    return {
      text: this.$translate.instant(translateId),
      time: moment().format('LT'),
      type: this.MESSAGE_TYPES.bot,
      ...params,
    };
  }

  ask(message) {
    const messageToSend = message || this.message;
    this.message = '';
    this.suggestions = [];

    if (!isString(messageToSend)) {
      throw new Error('Chatbot: User message is not a string.');
    }

    if (isEmpty(messageToSend)) {
      return;
    }

    this.loaders.isAsking = true;
    this.postMessage(messageToSend)
      .finally(() => {
        this.loaders.isAsking = false;
      });
  }

  postback(postbackMessage) {
    this.loaders.isAsking = true;
    this.postMessage(postbackMessage.text, postbackMessage.options, true)
      .finally(() => {
        this.loaders.isAsking = false;
      });
  }

  postMessage(messageText, options, isPostback) {
    this.pushMessageToUI({
      text: messageText,
      time: moment().format('LT'),
      type: isPostback ? this.MESSAGE_TYPES.postback : this.MESSAGE_TYPES.user,
    });

    return this.ChatbotService
      .talk(messageText, this.constructor.getContextId(), options)
      .then((botMessage) => {
        this.constructor.saveContextId(botMessage.contextId);
        this.pushMessageToUI({
          ...botMessage,
          time: moment(botMessage.serverTime).format('LT'),
          type: this.MESSAGE_TYPES.bot,
        });
        if (botMessage.askFeedback) {
          this.$timeout(() => {
            this.removeSurvey();
            this.pushMessageToUI(this.survey());
          }, this.CONFIG.secondsBeforeSurvey);
        }
        if (botMessage.startLivechat) {
          this.askForLivechat();
        }
      });
  }

  welcome() {
    return this.ChatbotService.topKnowledge(3)
      .then(rewords => ([
        this.botMessage('chatbot_welcome_message', { rewords }),
      ]));
  }

  survey() {
    return this.botMessage('chatbot_survey_message', {
      type: this.MESSAGE_TYPES.survey,
      survey: {
        step: this.SURVEY_STEPS.ask,
        details: null,
      },
    });
  }

  surveyNextStep(message) { /* eslint-disable no-param-reassign */
    message.survey.step = this.SURVEY_STEPS.details;
    message.text = this.$translate.instant('chatbot_survey_message_details');
  }

  answerSurvey(answer, details) {
    this.removeSurvey();
    return this.ChatbotService.feedback(
      this.constructor.getContextId(),
      answer ? 'positive' : 'negative',
      details,
    ).then(() => {
      this.pushMessageToUI(this.botMessage('chatbot_thanks_message'));
    });
  }

  removeSurvey() {
    remove(this.messages, message => message.type === this.MESSAGE_TYPES.survey);
  }

  close() {
    this.hidden = true;
  }

  fullClose() {
    this.hidden = true;
    this.started = false;
  }

  open() {
    if (!this.options.isEnabled) {
      return;
    }

    if (!this.started) {
      this.start();
    }

    this.hidden = false;

    this.$timeout(() => {
      this.$rootScope.$broadcast('ovh-chatbot:opened');
    });
  }

  start() {
    return this.$q.when(true)
      .then(() => {
        this.started = true;

        this.enableDrag();
        this.enableScroll();
        this.enableAutocomplete();

        const contextId = this.constructor.getContextId();
        this.loaders.isStarting = true;

        return contextId ? this.ChatbotService.history(contextId) : [];
      })
      .catch(() => []) // if history fails
      .then((messages) => {
        if (!messages || isEmpty(messages)) {
          return this.welcome();
        }
        return messages;
      })
      .then((messages) => {
        this.messages = messages;
      })
      .finally(() => {
        this.loaders.isStarting = false;
      });
  }

  suggest(message) {
    if (message && message.length > 3 && !this.loaders.isGettingSuggestions) {
      this.loaders.isGettingSuggestions = true;
      return this.ChatbotService.suggestions(message)
        .then((suggestions) => {
          this.suggestions = suggestions
            .sort((a, b) => b.score - a.score)
            .map(suggestion => suggestion.rootConditionReword)
            .filter((suggestion, index, self) => self.indexOf(suggestion) === index)
            .splice(0, 3);
        })
        .finally(() => {
          this.loaders.isGettingSuggestions = false;
        });
    }

    this.suggestions = [];
    return undefined;
  }

  enableDrag() {
    this.$element.find('.chatbot-main').draggable({
      handle: '.chatbot-header',
      cursor: 'move',
      containment: 'window',
    });
  }

  enableScroll() {
    this.$scope.$watch(
      () => this.$element.find('.chatbot-messages')[0].scrollHeight,
      (newY) => {
        // wait for the end of the digest before scrolling
        this.$timeout(() => {
          this.$element.find('.chatbot-body').scrollTop(newY);
        });
      },
    );
  }

  enableAutocomplete() {
    this.$scope.$watch(() => this.message, newMessage => this.suggest(newMessage));
  }

  focusInput() {
    this.$element.find('.chatbot-footer textarea').focus();
  }

  static getContextId() {
    return localStorage.getItem('ovhChatbotContextId');
  }

  static saveContextId(id) {
    if (id) {
      localStorage.setItem('ovhChatbotContextId', id);
    }
  }
}

export default ChatbotCtrl;
