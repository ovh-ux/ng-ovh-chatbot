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

  pushUserMessage(text) {
    this.messages.push({ text, type: this.MESSAGE_TYPES.user, time: '22:47' });
  }

  pushPostbackMessage(text) {
    this.messages.push({ text, type: this.MESSAGE_TYPES.postback, time: '21:17' });
  }

  pushBotMessage({ text, rewords }) {
    this.messages.push({
      text,
      type: this.MESSAGE_TYPES.bot,
      time: '23:15',
      rewords,
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

  postMessage(text, options, isPostback) {
    if (isPostback) {
      this.pushPostbackMessage(text);
    } else {
      this.pushUserMessage(text);
    }

    return this.ChatbotService
      .post(text, options)
      .then((botMessage) => {
        this.pushBotMessage(botMessage);
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
