import get from 'lodash/get';

class ChatbotService {
  /* @ngInject */
  constructor($http, $q, CHATBOT_API_ACTIONS, CHATBOT_MESSAGE_TYPES) {
    this.$http = $http;
    this.$q = $q;
    this.CHATBOT_MESSAGE_TYPES = CHATBOT_MESSAGE_TYPES;
    this.CHATBOT_API_ACTIONS = CHATBOT_API_ACTIONS;

    this.defaultConfig = {
      url: '/chatbot',
      space: 'Default/Web',
      universe: 'WEB',
      language: 'fr',
      subsidiary: 'FR',
    };

    this.config = { ...this.defaultConfig };
  }

  talk(userInput, contextId, extraParameters = {}) {
    return this.post({
      action: this.CHATBOT_API_ACTIONS.talk,
      contextId: contextId || '',
      language: this.config.language || this.defaultConfig.language,
      space: this.config.space || this.defaultConfig.space,
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

  informationBanner() {
    return this.talk('#bandeau d\'information');
  }

  automaticMessage(universe, subsidiary) {
    return this.talk(`#universe:${universe};subsidiary:${subsidiary}`);
  }

  topKnowledge(maxKnowledge) {
    return this.get({
      action: this.CHATBOT_API_ACTIONS.topKnowledge,
      maxKnowledge,
      space: this.config.space || this.defaultConfig.space,
    }).then(({ data }) => get(data, 'knowledgeArticles', []))
      .then(knowledgeArticles => knowledgeArticles.map(article => ({
        text: article.reword,
        options: {},
      })));
  }

  suggestions(userInput) {
    return this.post({
      action: this.CHATBOT_API_ACTIONS.suggestions,
      userInput,
      space: this.config.space || this.defaultConfig.space,
    }).then(({ data }) => data);
  }

  feedback(contextId, userInput, reason) {
    return this.post({
      action: this.CHATBOT_API_ACTIONS.feedback,
      contextId,
      userInput,
      reason,
    }).then(({ data }) => data);
  }

  setConfig(config) {
    this.config = {
      ...this.defaultConfig,
      ...config,
    };
  }

  getConfig() {
    return this.config;
  }

  get(params) {
    return this.$http({
      method: 'GET',
      url: this.config.url || this.defaultConfig.url,
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
      url: this.config.url || this.defaultConfig.url,
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
