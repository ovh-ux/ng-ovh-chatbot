class ChatbotService {
  /* @ngInject */
  constructor($http, $q) {
    this.$http = $http;
    this.$q = $q;
    this.chatbotUrl = '/chatbot';
  }

  post(userInput, options = {}) {
    return this.$http({
      method: 'POST',
      url: this.chatbotUrl,
      data: {
        language: 'fr',
        userInput,
        ...options,
      },
      serviceType: 'aapi',
      withCredentials: true,
    }).then(({ data }) => data);
  }

  history() {
    return this.$q.when(true).then(() => ({
      data: [
        {
          text: 'Hello world!',
          time: '16:12',
          type: 'bot',
        },
      ],
    }));
  }

  setChatbotUrl(url) {
    this.chatbotUrl = url;
  }

  getChatbotUrl() {
    return this.chatbotUrl;
  }
}

export default ChatbotService;
