class ChatbotCtrl {
  /* @ngInject */
  constructor(
    $translate,
    ChatbotService,
    ovhUserPref,
    CHATBOT_MESSAGE_TYPES,
  ) {
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

    this.enableDrag = () => {
      this.boundElement.find('.chatbot-main').draggable({
        handle: '.chatbot-header',
        cursor: 'move',
        containment: 'window',
      });
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
      .post(messageText, options)
      .then(({ text, serverTime }) => {
        this.pushMessageToUI({ text, time: moment(serverTime).format('LT') }, this.MESSAGE_TYPES.bot);
      });
  }

  close() {
    this.hidden = true;
  }

  open() {
    if (!this.started) {
      return this.start();
    }

    if (!this.messages.length) {
      return null;
    }

    this.hidden = false;
    this.enableDrag();
    return null;
  }

  start() {
    if (!this.options.enable) {
      return;
    }

    this.started = true;
    this.loaders.starting = true;

    this.ChatbotService
      .history()
      .then(({ data }) => {
        this.messages = data;
        this.open();
      })
      .finally(() => {
        this.loaders.starting = false;
      });
  }
}

export default ChatbotCtrl;
