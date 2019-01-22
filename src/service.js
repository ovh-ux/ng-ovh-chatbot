const fakeChatbotData = [
  {
    type: 'user',
    message: 'Hello world!',
    items: [],
    buttons: [],
  },
];

class ChatbotServiceProvider {
  constructor() {
    const self = this;
    this.chatbotUrl = '/engine/2api/chatbot';
    this.$get = ['$http', '$q', ($http, $q) => {
      const chatbotService = {};
      chatbotService.post = (message, type) => $q((resolve, reject) => $http({
        method: 'POST',
        url: self.chatbotUrl,
        data: {
          message,
          type: type || 'message',
        },
        serviceType: 'aapi',
        withCredentials: true,
      }).then(resolve, reject));
      chatbotService.post = (message, type) => $q.when(true).then(() => ({
        data: fakeChatbotData,
      }));

      chatbotService.history = () => $q((resolve, reject) => $http({
        method: 'GET',
        url: self.chatbotUrl,
        serviceType: 'aapi',
        withCredentials: true,
      }).then(resolve, reject));
      chatbotService.history = (message, type) => $q.when(true).then(() => ({ data: fakeChatbotData }));

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
