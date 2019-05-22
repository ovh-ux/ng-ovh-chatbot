import isEmpty from 'lodash/isEmpty';
import isString from 'lodash/isString';
import remove from 'lodash/remove';
import filter from 'lodash/filter';

import {
  CHATBOT_CONFIG,
  CHATBOT_MESSAGE_QUALITY,
  CHATBOT_MESSAGE_TYPES,
  CHATBOT_SURVEY_STEPS,
  LIVECHAT_CLOSED_REASONS,
  LIVECHAT_MESSAGE_TYPES,
  LIVECHAT_NOT_AGENT,
} from './constants';

class ChatbotCtrl {
  /* @ngInject */
  constructor(
    $element,
    $q,
    $rootScope,
    $scope,
    $timeout,
    $translate,
    ChatbotService,
    LivechatFactory,
    LivechatService,
  ) {
    this.$element = $element;
    this.$q = $q;
    this.$rootScope = $rootScope;
    this.$scope = $scope;
    this.$timeout = $timeout;
    this.$translate = $translate;
    this.ChatbotService = ChatbotService;
    this.LivechatFactory = LivechatFactory;
    this.LivechatService = LivechatService;
  }

  $onInit() {
    this.started = false;
    this.livechat = false;
    this.hidden = true;
    this.messages = [];
    this.suggestions = [];
    this.banner = null;

    this.loaders = {
      isStarting: false,
      isStartingLivechat: false,
      isAsking: false,
      isGettingSuggestions: false,
      isSendingSurvey: false,
      isAgentTyping: false,
      isLivechatDone: false,
    };

    this.options = {
      isEnabled: true,
      showOpenButton: false,
    };

    this.$scope.CHATBOT_MESSAGE_QUALITY = CHATBOT_MESSAGE_QUALITY;
    this.$scope.CHATBOT_MESSAGE_TYPES = CHATBOT_MESSAGE_TYPES;
    this.$scope.CHATBOT_SURVEY_STEPS = CHATBOT_SURVEY_STEPS;

    this.$rootScope.$on('ovh-chatbot:open', () => this.open());
    this.$rootScope.$on('ovh-chatbot:opened', () => this.focusInput());

    this.loaders.isStartingLivechat = true;
    this.LivechatService.getConfiguration().then((config) => {
      this.livechatFactory = new this.LivechatFactory(
        config,
        this.countryCode,
        this.languageCode, this.livechatCallbacks({
          onConnectSuccess: this.onLivechatConnectionSuccess,
          onWelcomeMessage: this.onLivechatWelcome,
          onAgentMessage: this.onLivechatAgentMessage,
          onSystemMessage: this.onLivechatSystemMessage,
          onHistory: this.onLivechatHistory,
          onSurvey: this.onLivechatSurvey,
          onConnectionFailure: this.onLivechatConnectionFailure,
          onError: this.onLivechatError,
          onNoAgentsAvailable: this.onLivechatNoAgentsAvailable,
          onAgentStartTyping: this.onLivechatAgentStartTyping,
          onAgentStopTyping: this.onLivechatAgentStopTyping,
        }),
      );

      return this.livechatFactory.restore().then((chatRestored) => {
        if (chatRestored) {
          this.started = true;
          this.livechat = true;
          this.open();
        }
      }).catch(() => {
        this.onLivechatConnectionFailure();
        this.started = true;
        this.open();
      });
    }).catch(() => {
      this.LivechatFactory = null;
    }).finally(() => {
      this.loaders.isStartingLivechat = false;
    });

    this.config = this.config || {};
    if (isString(this.url)) {
      this.config.url = this.url;
    }
    this.ChatbotService.setConfig(this.config);
  }

  livechatCallbacks(callbacks) {
    const boundCallbacks = {};

    Object.entries(callbacks).forEach(([event, callback]) => {
      const boundCallback = callback.bind(this);

      // Bind callbacks to instance and scope
      // with original arguments
      boundCallbacks[event] = ((...args) => {
        this.$scope.$apply(() => {
          boundCallback(...args);
        });
      });
    });

    return boundCallbacks;
  }

  static isInvisibleMessage(text) {
    return ChatbotCtrl.qualifyMessage(text) === CHATBOT_MESSAGE_QUALITY.invisible;
  }

  static qualifyMessage(text) {
    if (text.startsWith('##')) {
      return CHATBOT_MESSAGE_QUALITY.toplist;
    }

    if (text.startsWith('#')) {
      return CHATBOT_MESSAGE_QUALITY.invisible;
    }

    return CHATBOT_MESSAGE_QUALITY.normal;
  }

  pushMessageToUI(message) {
    this.messages.push(message);
  }

  botMessage(translateId, params) {
    return {
      text: this.$translate.instant(translateId),
      time: moment().format('LT'),
      type: CHATBOT_MESSAGE_TYPES.bot,
      quality: CHATBOT_MESSAGE_QUALITY.normal,
      ...params,
    };
  }

  ask(message) {
    const messageToSend = message || this.message;
    this.message = '';
    this.suggestions = [];

    if (!isString(messageToSend)) {
      throw new Error('Chatbot: User message is not a string.');
    }

    if (isEmpty(messageToSend)) {
      return;
    }

    if (!this.livechat) {
      this.loaders.isAsking = true;
      this.postMessage(messageToSend)
        .finally(() => {
          this.loaders.isAsking = false;
        });
    } else {
      this.postChatMessage(messageToSend);
    }
  }

  startTyping() {
    if (this.livechat) {
      this.livechatFactory.setCustomerIsTyping();
    }
  }

  postback(postbackMessage) {
    if (postbackMessage.action) {
      this.doAction(postbackMessage.action);
      return;
    }

    this.loaders.isAsking = true;
    this.postMessage(postbackMessage.text, postbackMessage.options, true)
      .finally(() => {
        this.loaders.isAsking = false;
      });
  }

  doAction(action) {
    switch (action) {
      case 'fullClose':
        this.fullClose();
        break;
      case 'endConcurrentLivechat':
        this.endConcurrentLivechat();
        this.startLivechat();
        break;
      default:
        break;
    }
  }

  postMessage(messageText, options, isPostback) {
    this.pushMessageToUI({
      text: messageText,
      time: moment().format('LT'),
      type: isPostback ? CHATBOT_MESSAGE_TYPES.postback : CHATBOT_MESSAGE_TYPES.user,
      quality: ChatbotCtrl.qualifyMessage(messageText),
    });

    return this.ChatbotService
      .talk(messageText, this.constructor.getContextId(), options)
      .then((botMessage) => {
        this.constructor.saveContextId(botMessage.contextId);
        this.pushMessageToUI({
          ...botMessage,
          time: moment(botMessage.serverTime).format('LT'),
          type: CHATBOT_MESSAGE_TYPES.bot,
          quality: ChatbotCtrl.qualifyMessage(botMessage.text),
        });
        if (botMessage.askFeedback) {
          this.$timeout(() => {
            this.removeSurvey();
            this.pushMessageToUI(this.survey());
          }, CHATBOT_CONFIG.secondsBeforeSurvey);
        }
        if (botMessage.startLivechat) {
          this.enableLivechat();
        }
      });
  }

  postChatMessage(messageText) {
    this.livechatFactory.setCustomerIsTyping(false);
    this.livechatFactory.sendMessageToAgent(messageText);
    this.pushMessageToUI({
      text: messageText,
      time: moment().format('LT'),
      type: this.MESSAGE_TYPES.user,
    });
  }

  welcome() {
    return this.ChatbotService.automaticMessage(this.config.universe, this.config.subsidiary)
      .then(message => [
        message,
        this.botMessage('chatbot_welcome_message'),
      ]);
  }

  survey() {
    return this.botMessage('chatbot_survey_message', {
      type: CHATBOT_MESSAGE_TYPES.survey,
      survey: {
        step: CHATBOT_SURVEY_STEPS.ask,
        details: null,
      },
    });
  }

  surveyNextStep(message) { /* eslint-disable no-param-reassign */
    message.survey.step = CHATBOT_SURVEY_STEPS.details;
    message.text = this.$translate.instant('chatbot_survey_message_details');
  }

  answerSurvey(answer, details) {
    this.removeSurvey();
    return this.ChatbotService.feedback(
      this.constructor.getContextId(),
      answer ? 'positive' : 'negative',
      details,
    ).then(() => {
      this.pushMessageToUI(this.botMessage('chatbot_thanks_message'));
    });
  }

  removeSurvey() {
    remove(this.messages, message => message.type === CHATBOT_MESSAGE_TYPES.survey);
  }

  close() {
    this.hidden = true;
  }

  fullClose() {
    this.hidden = true;
    this.started = false;
    this.endLivechat();
  }

  open() {
    if (!this.options.isEnabled) {
      return;
    }

    if (!this.started) {
      this.start();
    }

    this.hidden = false;

    this.$timeout(() => {
      this.$rootScope.$broadcast('ovh-chatbot:opened');
    });
  }

  start() {
    this.loaders.isLivechatDone = false;

    this.enableDrag();
    this.enableScroll();
    return this.$q.when(true)
      .then(() => {
        this.started = true;

        this.enableDrag();
        this.enableScroll();
        this.enableAutocomplete();

        return this.ChatbotService.informationBanner();
      })
      .then((banner) => {
        this.banner = this.constructor.parseBanner(banner);

        const contextId = this.constructor.getContextId();
        this.loaders.isStarting = true;

        return contextId ? this.ChatbotService.history(contextId) : [];
      })
      .catch(() => []) // if history fails
      .then((messages) => {
        if (!messages || isEmpty(messages)) {
          return this.welcome();
        }
        return messages;
      })
      .then((messages) => {
        this.messages = messages.map(message => ({
          ...message,
          quality: ChatbotCtrl.qualifyMessage(message.text),
        }));
      })
      .finally(() => {
        this.loaders.isStarting = false;
      });
  }

  enableLivechat() {
    // Check livechat initialization
    if (!this.livechatFactory) {
      this.pushMessageToUI(this.botMessage('livechat_init_error'));
      return;
    }

    // Check for concurrent session in another tab / window
    if (!this.livechatFactory.hasConcurrentSession()) {
      this.startLivechat('HLP', 'WEB', 'Hosting');
    } else {
      // Ask whether to end the concurrent session
      this.pushMessageToUI(this.botMessage('livechat_concurrent_session', {
        rewords: [
          {
            action: 'endConcurrentLivechat',
            text: this.$translate.instant('chatbot_answer_yes'),
          },
          {
            action: 'fullClose',
            text: this.$translate.instant('chatbot_answer_no'),
          },
        ],
      }));
    }
  }

  startLivechat(category, universe, product) {
    this.started = true;
    this.livechat = true;
    this.loaders.isStartingLivechat = true;
    this.livechatFactory.start(category, universe, product).then(() => {
      this.pushMessageToUI(this.botMessage('livechat_transfer'));
    }).catch((err) => {
      this.loaders.isLivechatDone = true;

      if (err && Object.values(LIVECHAT_CLOSED_REASONS).includes(err.closedReason)) {
        this.pushMessageToUI(this.botMessage(`livechat_closed_${err.closedReason}`));

        if (err.calendar) {
          this.pushMessageToUI({
            text: this.$translate.instant('livechat_calendar'),
            time: moment().format('LT'),
            type: this.MESSAGE_TYPES.livechatCalendar,
            calendar: err.calendar,
          });
        }

        this.pushMessageToUI(this.botMessage('livechat_closed_create_a_ticket'));
        return;
      }

      if (err === LIVECHAT_NOT_AGENT) {
        this.pushMessageToUI(this.botMessage('livechat_no_agents_available'));
        return;
      }

      this.onLivechatConnectionFailure();
    }).finally(() => {
      this.loaders.isStartingLivechat = false;
    });
  }

  onLivechatConnectionSuccess() {
    this.pushMessageToUI(this.botMessage('livechat_waiting'));
  }

  onLivechatWelcome(agentName) {
    this.pushMessageToUI({
      text: this.$translate.instant('livechat_welcome', { name: agentName }),
      time: moment().format('LT'),
      type: this.MESSAGE_TYPES.agent,
    });
  }

  endLivechat() {
    if (this.livechatFactory) {
      this.livechatFactory.end();
    }
    this.livechat = false;
  }

  endConcurrentLivechat() {
    this.LivechatService.getConfiguration().then((config) => {
      // Use a separate instance to prevent interferences
      // with the next session
      const killerFactory = new this.LivechatFactory(
        config,
        this.countryCode,
        this.languageCode,
      );
      killerFactory.endConcurrentSession();
    }).catch(() => {
      this.pushMessageToUI(this.botMessage('livechat_init_error'));
    });
  }

  onLivechatAgentStartTyping() {
    this.loaders.isAgentTyping = true;
  }

  onLivechatAgentStopTyping() {
    this.loaders.isAgentTyping = false;
  }

  onLivechatAgentMessage(msg) {
    this.onLivechatAgentStopTyping();
    this.pushMessageToUI({
      text: msg.Message,
      time: moment().format('LT'),
      type: this.MESSAGE_TYPES.agent,
    });
  }

  onLivechatSystemMessage(msg) {
    this.onLivechatAgentStopTyping();
    this.pushMessageToUI({
      text: msg.Message,
      time: moment().format('LT'),
      type: this.MESSAGE_TYPES.bot,
    });
  }

  onLivechatHistory(messages) {
    messages.forEach((msg) => {
      if (msg.type === LIVECHAT_MESSAGE_TYPES.Welcome) {
        this.onLivechatWelcome(msg.text);
        return;
      }

      this.pushMessageToUI({
        text: msg.text,
        time: msg.time.format('LT'),
        type: msg.type,
      });
    });
  }

  onLivechatSurvey(sessionId) {
    this.loaders.isLivechatDone = true;
    this.onLivechatAgentStopTyping();
    this.pushMessageToUI({
      text: this.$translate.instant('livechat_survey'),
      time: moment().format('LT'),
      sessionId,
      type: this.MESSAGE_TYPES.livechatSurvey,
    });
  }

  sendLivechatSurvey(msg) {
    if (!this.loaders.isSendingSurvey) {
      this.loaders.isSendingSurvey = true;

      this.livechatFactory.sendSurvey(msg.sessionId, msg.survey).then(() => {
        this.pushMessageToUI(this.botMessage('livechat_survey_thanks'));
        this.removeLivechatSurvey();
      }).catch(() => {
        this.pushMessageToUI(this.botMessage('livechat_survey_error'));
      }).finally(() => {
        this.loaders.isSendingSurvey = false;
      });
    }
  }

  removeLivechatSurvey() {
    this.messages = filter(this.messages, msg => msg.type !== this.MESSAGE_TYPES.livechatSurvey);
  }

  onLivechatNoAgentsAvailable() {
    this.livechat = false;
    this.loaders.isLivechatDone = true;
    this.pushMessageToUI(this.botMessage('livechat_no_agents_available'));
  }

  onLivechatConnectionFailure() {
    this.livechat = false;
    this.loaders.isLivechatDone = true;
    this.pushMessageToUI(this.botMessage('livechat_connection_failure'));
  }

  onLivechatError(err) {
    let i = this.messages.length - 1;
    let pass = false;
    const text = this.$translate.instant(err || 'livechat_error');

    // Check this message has not been already displayed
    // since the last customer message because the library
    // can throw the same error multiple times
    while (i >= 0) {
      const msg = this.messages[i];

      if (msg.text === text
        && msg.type === this.MESSAGE_TYPES.bot) {
        pass = true;
        break;
      } else if (msg.type === this.MESSAGE_TYPES.user) {
        break;
      }

      i -= 1;
    }

    if (!pass) {
      this.pushMessageToUI({
        text,
        time: moment().format('LT'),
        type: this.MESSAGE_TYPES.bot,
      });
    }

    this.onLivechatAgentStopTyping();
  }

  suggest(message) {
    if (message && message.length > 3 && !this.loaders.isGettingSuggestions) {
      this.loaders.isGettingSuggestions = true;
      return this.ChatbotService.suggestions(message)
        .then((suggestions) => {
          this.suggestions = suggestions
            .sort((a, b) => b.score - a.score)
            .map(suggestion => suggestion.rootConditionReword)
            .filter((suggestion, index, self) => self.indexOf(suggestion) === index)
            .splice(0, 3);
        })
        .finally(() => {
          this.loaders.isGettingSuggestions = false;
        });
    }

    this.suggestions = [];
    return undefined;
  }

  enableDrag() {
    this.$element.find('.chatbot-main').draggable({
      handle: '.chatbot-header',
      cursor: 'move',
      containment: 'window',
    });
  }

  enableScroll() {
    this.$scope.$watch(
      () => this.$element.find('.chatbot-messages')[0].scrollHeight,
      (newY) => {
        // wait for the end of the digest before scrolling
        this.$timeout(() => {
          this.$element.find('.chatbot-body').scrollTop(newY);
        });
      },
    );
  }

  enableAutocomplete() {
    this.$scope.$watch(() => this.message, newMessage => this.suggest(newMessage));
  }

  focusInput() {
    this.$element.find('.chatbot-footer textarea').focus();
  }

  static getContextId() {
    return localStorage.getItem('ovhChatbotContextId');
  }

  static saveContextId(id) {
    if (id) {
      localStorage.setItem('ovhChatbotContextId', id);
    }
  }

  static parseBanner(bannerMessage) {
    return bannerMessage.text;
  }
}

export default ChatbotCtrl;
