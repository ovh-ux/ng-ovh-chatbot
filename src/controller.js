import filter from 'lodash/filter';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import isString from 'lodash/isString';
import remove from 'lodash/remove';
import takeWhile from 'lodash/takeWhile';

import {
  CHATBOT_CONFIG,
  CHATBOT_MESSAGE_QUALITY,
  CHATBOT_MESSAGE_TYPES,
  CHATBOT_SURVEY_STEPS,
  LIVECHAT_CLOSED_REASONS,
  LIVECHAT_MESSAGE_TYPES,
  LIVECHAT_NOT_AGENT,
  LIVECHAT_QUESTIONS,
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
    this.initialized = false;
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
      isAnsweringSurvey: false,
      isSendingSurvey: false,
      isAgentTyping: false,
      isLivechatDone: false,
    };

    this.options = {
      isEnabled: true,
      showOpenButton: false,
    };

    this.lastLivechatSettings = [];

    this.$scope.CHATBOT_MESSAGE_QUALITY = CHATBOT_MESSAGE_QUALITY;
    this.$scope.CHATBOT_MESSAGE_TYPES = CHATBOT_MESSAGE_TYPES;
    this.$scope.CHATBOT_SURVEY_STEPS = CHATBOT_SURVEY_STEPS;
    this.$scope.LIVECHAT_QUESTIONS = LIVECHAT_QUESTIONS;

    this.$rootScope.$on('ovh-chatbot:open', () => this.open());
    this.$rootScope.$on('ovh-chatbot:opened', () => this.focusInput());
  }

  init() {
    this.initialized = true;

    this.config = this.config || {};
    if (isString(this.url)) {
      this.config.url = this.url;
    }
    this.ChatbotService.setConfig(this.config);

    if (this.canSwitchToLivechat) {
      this.initializeLivechat();
    }
  }

  initializeLivechat() {
    this.$translate('livechat_agent_default_name').then((agentName) => {
      this.agentName = agentName;
    });

    return this.LivechatService.getConfiguration().then((config) => {
      this.livechatFactory = new this.LivechatFactory(
        config,
        this.config.language,
        this.config.country,
        this.bindLivechatCallbacks({
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
      this.livechatFactory = null;
    }).finally(() => {
      this.loaders.isStartingLivechat = false;
    });
  }

  bindLivechatCallbacks(callbacks) {
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
      this.postLivechatMessage(messageToSend);
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
    this.postMessage(postbackMessage.link, postbackMessage.options, true)
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
        this.startLivechat.apply(this.lastLivechatSettings);
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
      .talk(messageText, options)
      .then((botMessage) => {
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
        this.handleLivechatTemplate(botMessage);
      });
  }

  handleLivechatTemplate(message) {
    if (message.templateData && message.templateName === 'livechat_cisco') {
      const { category, product, productLabel } = message.templateData;
      this.enableLivechat(category, product, productLabel);
    }
  }

  postLivechatMessage(messageText) {
    this.livechatFactory.setCustomerIsTyping(false);
    this.livechatFactory.sendMessageToAgent(messageText);
    this.pushMessageToUI({
      text: messageText,
      time: moment().format('LT'),
      type: CHATBOT_MESSAGE_TYPES.user,
      quality: CHATBOT_MESSAGE_QUALITY.normal,
    });
  }

  welcome() {
    return this.ChatbotService.automaticMessage(this.config.universe, this.config.country)
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

    if (!this.initialized) {
      this.init();
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

    return this.$q.when(true)
      .then(() => {
        this.started = true;

        this.enableDrag();
        this.enableScroll();
        this.enableAutocomplete();

        this.loaders.isStarting = true;
        return this.ChatbotService.history();
      })
      .catch(() => []) // if history fails
      .then(messages => this.$q.all({
        banner: this.ChatbotService.informationBanner(),
        messages,
      }))
      .then(({ banner, messages }) => {
        this.banner = this.constructor.parseBanner(banner);
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

  enableLivechat(category, product, productLabel) {
    if (!this.canSwitchToLivechat) {
      return;
    }

    // Check livechat initialization
    if (!this.livechatFactory) {
      this.pushMessageToUI(this.botMessage('livechat_init_error'));
      return;
    }

    // remember what the user answered
    this.lastLivechatSettings = [category, product, productLabel];

    // Check for concurrent session in another tab / window
    if (!this.livechatFactory.hasConcurrentSession()) {
      this.startLivechat(category, product, productLabel);
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

  startLivechat(category, product, productLabel) {
    this.started = true;
    this.livechat = true;
    this.loaders.isStartingLivechat = true;
    this.livechatFactory.start(category, product, productLabel).then(() => {
      this.pushMessageToUI(this.botMessage('livechat_transfer'));
    }).catch((err) => {
      this.loaders.isLivechatDone = true;

      if (err && Object.values(LIVECHAT_CLOSED_REASONS).includes(err.closedReason)) {
        this.pushMessageToUI(this.botMessage(`livechat_closed_${err.closedReason}`));

        if (err.calendar) {
          this.pushMessageToUI({
            text: this.$translate.instant('livechat_calendar'),
            time: moment().format('LT'),
            type: CHATBOT_MESSAGE_TYPES.livechatCalendar,
            quality: CHATBOT_MESSAGE_QUALITY.normal,
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
    this.agentName = agentName;
    this.pushMessageToUI({
      text: this.$translate.instant('livechat_welcome', { name: agentName }),
      time: moment().format('LT'),
      type: CHATBOT_MESSAGE_TYPES.agent,
      quality: CHATBOT_MESSAGE_QUALITY.normal,
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
        this.config.language,
        this.config.country,
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
      type: CHATBOT_MESSAGE_TYPES.agent,
      quality: CHATBOT_MESSAGE_QUALITY.normal,
    });
  }

  onLivechatSystemMessage(msg) {
    this.onLivechatAgentStopTyping();
    this.pushMessageToUI({
      text: msg.Message,
      time: moment().format('LT'),
      type: CHATBOT_MESSAGE_TYPES.bot,
      quality: CHATBOT_MESSAGE_QUALITY.normal,
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
        quality: CHATBOT_MESSAGE_QUALITY.normal,
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
      type: CHATBOT_MESSAGE_TYPES.livechatSurvey,
      quality: CHATBOT_MESSAGE_QUALITY.normal,
      survey: { step: 0, answers: {} },
    });
  }

  answerLivechatSurvey(message, questionId, value) {
    this.loaders.isAnsweringSurvey = true;

    // we only want the question, so let's get rid of the introductory text
    message.text = '';

    message.survey.answers[questionId] = value;
    message.survey.step += 1;
    if (message.survey.step >= LIVECHAT_QUESTIONS.length) {
      this.sendLivechatSurvey(message.sessionId, message.survey.answers);
    }

    // we show a fake loader to inform the user we are switching to the next question
    this.$timeout(() => {
      this.loaders.isAnsweringSurvey = false;
    }, 1000);
  }

  sendLivechatSurvey(sessionId, answers) {
    if (!this.loaders.isSendingSurvey) {
      this.loaders.isSendingSurvey = true;

      this.livechatFactory.sendSurvey(sessionId, answers).then(() => {
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
    this.messages = filter(this.messages, msg => msg.type !== CHATBOT_MESSAGE_TYPES.livechatSurvey);
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
    // Check that this message has not been already displayed
    // since the last customer message because the library
    // can throw the same error multiple times
    const lastBotMessages = takeWhile(
      [...this.messages].reverse(),
      m => m.type === CHATBOT_MESSAGE_TYPES.bot,
    );
    if (!lastBotMessages.some(m => m.livechatError && m.livechatError === err)) {
      this.pushMessageToUI({
        text: this.$translate.instant(err || 'livechat_error'),
        time: moment().format('LT'),
        type: CHATBOT_MESSAGE_TYPES.bot,
        quality: CHATBOT_MESSAGE_QUALITY.normal,
        livechatError: err,
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

  static parseBanner(bannerMessage) {
    return get(bannerMessage, 'text', null);
  }
}

export default ChatbotCtrl;
