class ChatbotService {
  /* @ngInject */
  constructor($http, $q, CHATBOT_API_ACTIONS, CHATBOT_MESSAGE_TYPES) {
    this.$http = $http;
    this.$q = $q;
    this.CHATBOT_MESSAGE_TYPES = CHATBOT_MESSAGE_TYPES;
    this.CHATBOT_API_ACTIONS = CHATBOT_API_ACTIONS;

    this.chatbotUrl = '/chatbot';
  }

  talk(userInput, contextId, extraParameters = {}) {
    return this.post({
      action: this.CHATBOT_API_ACTIONS.talk,
      contextId: contextId || '',
      language: 'fr',
      userInput,
      extraParameters,
    }).then(({ data }) => data);
  }

  history(contextId) {
    return this.get({
      action: this.CHATBOT_API_ACTIONS.history,
      contextId,
    }).then(({ data }) => data)
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

  topKnowledge(maxKnowledge) {
    return this.get({
      action: this.CHATBOT_API_ACTIONS.topKnowledge,
      maxKnowledge,
    }).then(({ data }) => data)
      .then(({ knowledgeArticles }) => knowledgeArticles.map(article => ({
        text: article.reword,
        options: {},
      })));
  }

  suggestions(userInput) {
    return this.post({
      action: this.CHATBOT_API_ACTIONS.suggestions,
      userInput,
    }).then(({ data }) => data);
  }

  feedback(contextId, userInput) {
    return this.post({
      action: this.CHATBOT_API_ACTIONS.feedback,
      contextId,
      userInput,
    }).then(({ data }) => data);
  }

  setChatbotUrl(url) {
    this.chatbotUrl = url;
  }

  getChatbotUrl() {
    return this.chatbotUrl;
  }

  get(params) {
    return this.$http({
      method: 'GET',
      url: this.chatbotUrl,
      params: params || { contextId: '' },
      headers: {
        'Content-Type': 'application/json;charset=utf-8',
      },
      serviceType: 'aapi',
      withCredentials: true,
    });
  }

  post(inputData) {
    return this.$http({
      method: 'POST',
      url: this.chatbotUrl,
      data: inputData,
      headers: {
        'Content-Type': 'application/json;charset=utf-8',
      },
      serviceType: 'aapi',
      withCredentials: true,
    });
  }
}

export default ChatbotService;
