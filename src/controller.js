class ChatbotCtrl {
  constructor(
    $translate,
    chatbotService,
    ovhUserPref,
    CHATBOT_MESSAGE_TYPES,
    CHATBOT_NGEMBED_OPTIONS,
  ) {
    this.$translate = $translate;
    this.chatbotService = chatbotService;
    this.ovhUserPref = ovhUserPref;
    this.MESSAGE_TYPES = CHATBOT_MESSAGE_TYPES;
    this.NG_EMBED_OPTIONS = CHATBOT_NGEMBED_OPTIONS;

    this.init();
  }

  init() {
    this.error = false;
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

  pushUserMessage(text) {
    this.messages.push({ message: text, type: this.MESSAGE_TYPES.user });
  }

  pushBotMessage(data) {
    this.messages.push({ message: data.text, type: this.MESSAGE_TYPES.bot });
  }

  ask() {
    if (!this.message) {
      return;
    }

    this.error = null;
    this.loaders.asking = true;

    this.pushUserMessage(this.message);

    this.chatbotService
      .post(this.message)
      .then((result) => {
        this.pushBotMessage(result.data);
      })
      .catch(() => {
        this.error = true;
      })
      .finally(() => {
        this.loaders.asking = false;
      });

    this.message = '';
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

    this.chatbotService
      .history()
      .then((result) => {
        this.messages = result.data;
        this.loaders.starting = false;
        this.open();
      })
      .catch(() => {
        this.error = true;
      })
      .finally(() => {
        this.loaders.starting = false;
      });
  }
}

export default ChatbotCtrl;
