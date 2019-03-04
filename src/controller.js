import isEmpty from 'lodash/isEmpty';
import isString from 'lodash/isString';

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

  pushMessageToUI(message, type) {
    this.messages.push({
      ...message,
      type,
    });
  }

  ask() {
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
    this.pushMessageToUI(
      { text: messageText, time: moment().format('LT') },
      isPostback ? this.MESSAGE_TYPES.postback : this.MESSAGE_TYPES.user,
    );

    return this.ChatbotService
      .post(messageText, this.constructor.getContextId(), options)
      .then((botMessage) => {
        this.constructor.saveContextId(botMessage.contextId);
        this.pushMessageToUI(
          { ...botMessage, time: moment(botMessage.serverTime).format('LT') },
          this.MESSAGE_TYPES.bot,
        );
      });
  }

  welcome() {
    return {
      text: this.$translate.instant('chatbot_welcome_message'),
      time: moment().format('LT'),
      type: this.MESSAGE_TYPES.bot,
      rewords: [
        { text: 'Comment payer ?', options: {} },
        { text: 'Comment consulter ma facture ?', options: {} },
        { text: 'Que faire si on site web dysfonctionne ?', options: {} },
      ],
    };
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
        this.messages = messages.length > 0 ? messages : [this.welcome()];
      })
      .finally(() => {
        this.loaders.isStarting = false;
      });
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
