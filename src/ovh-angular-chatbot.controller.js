"use strict";

class ChatbotCtrl {
    constructor ($interval, $window, $translate, webNotification, ovhUserPref, chatbotService, CHATBOT_MESSAGE_TYPES, CHATBOT_NGEMBED_OPTIONS) {
        this.$interval = $interval;
        this.$window = $window;
        this.webNotification = webNotification;
        this.chatbotService = chatbotService;
        this.$translate = $translate;

        this.error = false;
        this.initialized = false;
        this.hidden = true;
        this.processing = false;
        this.newMsg = 0;

        this.MESSAGE_TYPES = CHATBOT_MESSAGE_TYPES;
        this.NG_EMBED_OPTIONS = CHATBOT_NGEMBED_OPTIONS;

        let messagesPrivate = [];
        Object.defineProperty(this, "messages", {
            set (newMessages) {
                const prevSize = messagesPrivate.length;
                messagesPrivate = newMessages;
                if (messagesPrivate.length) {
                    this.update(messagesPrivate.length - prevSize);
                }
            },
            get () {
                return messagesPrivate;
            }
        });
        this.messages = [];

        this.options = {
            notifications: false,
            enable: false
        };

        this.errorHandler = this.errorHandler.bind(this);
        this.formatMsg = this.formatMsg.bind(this);
        this.tick = this.tick.bind(this);

        // OVH user pref
        ovhUserPref
            .getValue("CHATBOT_PREF")
            .then((val) => {
                Object.assign(this.options, val);
            })
            .catch(() => ovhUserPref.assign("CHATBOT_PREF", this.options));

        /*  End  */
    }

    // lazy check
    static areMessagesEquals (msgA, msgB) {
        return msgA != null && msgB != null && msgA.message === msgB.message;
    }

    static extractDifferenceBetweenArrays (oldArr, newArr) {
        const last = oldArr.length - 1;
        for (let i = newArr.length - 1; i >= 0; i--) {
            if (ChatbotCtrl.areMessagesEquals(newArr[i], oldArr[last])) {
                // we slice to get the new elements
                return newArr.slice(i + 1, newArr.length);
            }
        }
        return newArr;
    }

    formatMsg (data) {
        const msg = {
            message: data.message,
            items: data.items,
            buttons: data.buttons.map((button) => ({
                text: button.text,
                value: button.value,
                externalUrl: button.type === "web_url"
            }))
        };

        switch (data.origin) {
        case "user":
            msg.type = this.MESSAGE_TYPES.user;
            break;
        case "user_postback":
            msg.type = this.MESSAGE_TYPES.postback;
            break;
        case "bot":
            msg.type = this.MESSAGE_TYPES.bot;
            break;
        default:
        }
        return msg;
    }

    ask () {
        const self = this;
        if (!this.message) {
            return;
        }
        this.$interval.cancel(this.tickInterval);
        self.tickInterval = undefined;
        this.error = null;
        this.processing = true;
        this.chatbotService
            .post(this.message)
            .then((result) => {
                self.messages = [...self.messages, ...result.data.map(self.formatMsg)];
                if (!self.tickInterval) {
                    self.tickInterval = self.$interval(self.tick, self.pullRate * 1000);
                }
                self.processing = false;
            })
            .catch(this.errorHandler);
        const uMsg = {
            type: this.MESSAGE_TYPES.user,
            message: this.message,
            items: [],
            buttons: []
        };
        this.message = "";
        this.messages = [...this.messages, uMsg];
    }

    buttonClick (button) {
        const self = this;
        if (button.externalUrl) {
            this.$window.open(button.value);
        } else {
            this.error = null;
            this.processing = true;
            this.chatbotService.post(button.value, "postback")
                .then((result) => {
                    self.messages = [...self.messages, ...result.data.map(self.formatMsg)];
                    self.processing = false;
                })
                .catch(this.errorHandler);
        }
    }

    close () {
        this.hidden = true;
    }

    open () {
        if (!this.initialized) {
            return this.init();
        }
        if (!this.messages.length) {
            return null;
        }
        this.hidden = false;
        this.newMsg = 0;
        return null;
    }

    errorHandler () {
        this.$interval.cancel(this.tickInterval);
        this.tickInterval = undefined;
        this.error = true;
        this.processing = false;
    }

    tick () {
        const self = this;
        this.chatbotService
            .history()
            .then((result) => {
                const msgs = result.data.map(self.formatMsg);
                const diff = ChatbotCtrl.extractDifferenceBetweenArrays(self.messages, msgs);
                self.messages = [...self.messages, ...diff];
            })
            .catch(this.errorHandler);
    }

    init () {
        const self = this;
        if (!this.options.enable) {
            return;
        }
        this.initialized = true;

        this.chatbotService
            .history()
            .then((result) => {
                self.messages = result.data.map(self.formatMsg);
                self.$interval.cancel(self.tickInterval);
                self.tickInterval = self.$interval(self.tick, self.pullRate * 1000); // Pulling, evry X seconds
                self.open();
            })
            .catch(this.errorHandler);
    }

    update (delta) {
        if (this.hidden && delta > 0) {
            this.newMsg += delta;
            if (this.options.notifications) {
                this.$translate("chatbot_title").then((title) => {
                    this.webNotification.showNotification(title, {
                        body: this.messages[this.messages.length - 1].message,
                        onClick: this.open,
                        icon: "img/ovh-angular-chatbot.png",
                        autoClose: 4000
                    });
                });

            }
        }
    }

}

angular.module("ovh-angular-chatbot").controller("chatbotController", ChatbotCtrl);
