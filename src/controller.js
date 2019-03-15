import isEmpty from 'lodash/isEmpty';
import isString from 'lodash/isString';
import remove from 'lodash/remove';

class ChatbotCtrl {
  /* @ngInject */
  constructor(
    $element,
    $q,
    $scope,
    $translate,
    ChatbotService,
    CHATBOT_MESSAGE_TYPES,
  ) {
    this.$element = $element;
    this.$q = $q;
    this.$scope = $scope;
    this.$translate = $translate;
    this.ChatbotService = ChatbotService;
    this.MESSAGE_TYPES = CHATBOT_MESSAGE_TYPES;
  }

  $onInit() {
    this.started = false;
    this.hidden = true;
    this.messages = [];
    this.suggestions = [];

    this.loaders = {
      isStarting: false,
      isAsking: false,
    };

    this.options = {
      isEnabled: true,
      showOpenButton: false,
    };

    this.$scope.$on('ovh-chatbot:open', () => this.open());
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
    this.message = message || this.message;

    if (!isString(this.message)) {
      throw new Error('Chatbot: User message is not a string.');
    }

    if (isEmpty(this.message)) {
      return;
    }

    this.loaders.isAsking = true;
    this.postMessage(this.message)
      .finally(() => {
        this.loaders.isAsking = false;
        this.message = '';
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
          this.removeSurvey();
          this.pushMessageToUI(this.survey());
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
    });
  }

  answerSurvey(answer) {
    this.removeSurvey();
    return this.ChatbotService.feedback(
      this.constructor.getContextId(),
      answer ? 'positive' : 'negative',
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
  }

  start() {
    return this.$q.when(true)
      .then(() => {
        this.started = true;

        this.enableDrag();
        this.enableScroll();

        const contextId = this.constructor.getContextId();
        this.loaders.isStarting = true;

        return contextId ? this.ChatbotService.history(contextId) : [];
      })
      .then((messages) => {
        if (messages.length === 0) {
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
    this.suggestions = [
      'Cela va-t-il déchirer ?',
      'Comment manger des frites ?',
      '42 ?',
    ];
  }

  answerSuggest(message) {
    this.suggestions = [];
    this.ask(message);
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
      newY => this.$element.find('.chatbot-body').scrollTop(newY),
    );
  }

  enableAutocomplete() {
    this.$scope.$watch(this.message, newMessage => this.suggest(newMessage));
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
