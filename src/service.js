class ChatbotService {
  /* @ngInject */
  constructor($http, $q, CHATBOT_MESSAGE_TYPES) {
    this.$http = $http;
    this.$q = $q;
    this.CHATBOT_MESSAGE_TYPES = CHATBOT_MESSAGE_TYPES;

    this.chatbotUrl = '/chatbot';
  }

  post(userInput, contextId, extraParameters = {}) {
    return this.$http({
      method: 'POST',
      url: this.chatbotUrl,
      data: {
        contextId: contextId || '',
        language: 'fr',
        userInput,
        extraParameters,
      },
      serviceType: 'aapi',
      withCredentials: true,
    }).then(({ data }) => data);
  }

  history(contextId) {
    return this.$http({
      method: 'GET',
      url: this.chatbotUrl,
      params: { contextId: contextId || '' },
      serviceType: 'aapi',
      withCredentials: true,
    })
      .then(({ data }) => data)
      .then(({ interactions }) => interactions.reduce(
        (messages, interaction) => {
          const date = moment(interaction.date, 'DD/MM/YYYY HH:mm:ss');
          messages.push({
            text: interaction.user,
            time: date.format('LT'),
            type: this.CHATBOT_MESSAGE_TYPES.user,
          });
          messages.push({
            text: interaction.text,
            rewords: interaction.rewords,
            time: date.format('LT'),
            type: this.CHATBOT_MESSAGE_TYPES.bot,
          });
          return messages;
        },
        [],
      ));
  }

  setChatbotUrl(url) {
    this.chatbotUrl = url;
  }

  getChatbotUrl() {
    return this.chatbotUrl;
  }
}

export default ChatbotService;
