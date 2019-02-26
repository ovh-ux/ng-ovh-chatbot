class ChatbotCtrl {
  /* @ngInject */
  constructor(
    $q,
    $scope,
    $translate,
    ChatbotService,
    ovhUserPref,
    CHATBOT_MESSAGE_TYPES,
  ) {
    this.$q = $q;
    this.$scope = $scope;
    this.$translate = $translate;
    this.ChatbotService = ChatbotService;
    this.ovhUserPref = ovhUserPref;
    this.MESSAGE_TYPES = CHATBOT_MESSAGE_TYPES;
  }

  $onInit() {
    this.started = false;
    this.hidden = true;
    this.messages = [];

    this.loaders = {
      starting: false,
      asking: false,
    };

    this.options = {
      notifications: false,
      enable: false,
    };

    this.ovhUserPref
      .getValue('CHATBOT_PREF')
      .then((val) => {
        Object.assign(this.options, val);
      })
      .catch(() => this.ovhUserPref.assign('CHATBOT_PREF', this.options));
  }

  pushMessageToUI(message, type) {
    this.messages.push({
      ...message,
      type,
    });
  }

  ask() {
    if (!this.message) {
      return;
    }

    this.loaders.asking = true;
    this.postMessage(this.message)
      .finally(() => {
        this.loaders.asking = false;
        this.message = '';
      });
  }

  postback(postbackMessage) {
    this.loaders.asking = true;
    this.postMessage(postbackMessage.text, postbackMessage.options, true)
      .finally(() => {
        this.loaders.asking = false;
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
    if (!this.options.enable) {
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
        this.loaders.starting = true;

        return contextId ? this.ChatbotService.history(contextId) : [];
      })
      .then((messages) => {
        this.messages = messages.length > 0 ? messages : [this.welcome()];
      })
      .finally(() => {
        this.loaders.starting = false;
      });
  }

  enableDrag() {
    this.boundElement.find('.chatbot-main').draggable({
      handle: '.chatbot-header',
      cursor: 'move',
      containment: 'window',
    });
  }

  enableScroll() {
    this.$scope.$watch(
      () => this.boundElement.find('.chatbot-messages')[0].scrollHeight,
      newY => this.boundElement.find('.chatbot-body').scrollTop(newY),
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
