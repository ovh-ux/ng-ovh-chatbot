const fakeChatbotData = [
  {
    message: 'Hello world!',
    type: 'bot',
  },
];

class ChatbotServiceProvider {
  constructor() {
    const self = this;
    this.chatbotUrl = '/chatbot';
    this.$get = ['$http', '$q', ($http, $q) => {
      const chatbotService = {};
      chatbotService.post = message => $q((resolve, reject) => $http({
        method: 'POST',
        url: self.chatbotUrl,
        data: {
          language: 'fr',
          userInput: message,
        },
        serviceType: 'aapi',
        withCredentials: true,
      }).then(resolve, reject));

      chatbotService.history = () => $q((resolve, reject) => $http({
        method: 'GET',
        url: self.chatbotUrl,
        serviceType: 'aapi',
        withCredentials: true,
      }).then(resolve, reject));
      chatbotService.history = message => $q.when(true).then(() => ({ data: fakeChatbotData }));

      return chatbotService;
    }];
  }

  setChatbotUrl(url) {
    this.chatbotUrl = url;
  }

  getChatbotUrl() {
    return this.chatbotUrl;
  }
}

export default ChatbotServiceProvider;
