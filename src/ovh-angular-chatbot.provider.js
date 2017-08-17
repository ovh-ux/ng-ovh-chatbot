"use strict";

class ChatbotServiceProvider {
    constructor () {
        let self = this;
        this.chatbotUrl = "/engine/2api/chatbot";
        this.$get = ["$http", "$q", function ($http, $q) {
            let chatbotService = {};
            chatbotService.post = (message, type) => $q((resolve, reject) =>
                $http({
                    method: "POST",
                    url: self.chatbotUrl,
                    data: {
                        message,
                        type: type || "message"
                    },
                    serviceType: "aapi",
                    withCredentials: true
                }).then(resolve, reject));

            chatbotService.history = () => $q((resolve, reject) =>
                $http({
                    method: "GET",
                    url: self.chatbotUrl,
                    serviceType: "aapi",
                    withCredentials: true
                }).then(resolve, reject));
            return chatbotService;
        }];
    }

    setChatbotUrl (url) {
        this.chatbotUrl = url;
    }

    getChatbotUrl () {
        return this.chatbotUrl;
    }
}

/**
 * @ngdoc service
 * @name chatbot.factory:chatbot.factory
 * @description
 * # chatbot
 * Factory in the chatbot.
 */
angular.module("ovh-angular-chatbot").provider("chatbotService", ChatbotServiceProvider);
