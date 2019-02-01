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

  pushBotMessage(data) {
    this.messages.push({ text: data.text, type: this.MESSAGE_TYPES.bot, time: '23:15' });
  }

  ask() {
    if (!this.message) {
      return;
    }

    this.error = null;
    this.loaders.asking = true;

    this.pushUserMessage(this.message);

    this.ChatbotService
      .post(this.message)
      .then(({ data }) => {
        this.pushBotMessage(data);
      })
      .catch(() => {
        this.error = true;
      })
      .finally(() => {
        this.loaders.asking = false;
        this.message = '';
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
      .catch(() => {
        this.error = true;
      })
      .finally(() => {
        this.loaders.starting = false;
      });
  }
}

export default ChatbotCtrl;
