import 'egain-client-library';
import debounce from 'lodash/debounce';
import isFunction from 'lodash/isFunction';
import reduce from 'lodash/reduce';
import messaging from './libs/egain/messaging/translations';
import customChat from './libs/egain/customChat/translations';

import {
  LIVECHAT_MESSAGE_TYPES,
  LIVECHAT_NOT_AGENT,
} from './constants';

/* @ngInject */
function LivechatFactory(
  $q,
  $window,
  LivechatService,
) {
  return class {
    constructor(config, languageCode, countryCode, handlers) {
      this.$q = $q;
      this.$window = $window;
      this.LivechatService = LivechatService;

      this.languageCode = languageCode || 'fr';
      this.countryCode = countryCode || 'FR';

      this.librarySettings = new EGainLibrarySettings();
      this.librarySettings.CORSHost = config.host;
      this.librarySettings.ChatPauseInSec = '30';
      this.librarySettings.IsDevelopmentModeOn = false;
      this.librarySettings.IsDebugOn = false;
      this.librarySettings.eGainMessaging = messaging;
      this.librarySettings.eGainCustomChat = customChat;

      this.customHandlers = handlers || {};
      this.restoredSession = null;
      this.inChat = false;

      this.$window.addEventListener('unload', () => {
        // Stop chat only if this was the current tab
        if (this.inChat) {
          this.setChatEnded();
        }
      });

      this.stopTypingDebounced = debounce(() => {
        this.chat.SendCustomerStopTyping();
      }, 3000);
    }

    start(category, universe, product, restoredSession = null) {
      this.library = new EGainLibrary(this.librarySettings);
      this.chat = new this.library.Chat();
      this.eventHandlers = this.chat.GetEventHandlers();
      this.restoredSession = restoredSession;

      this.initEventHandlers(restoredSession);

      this.customer = new this.library.Datatype.CustomerObject();

      return this.LivechatService.getAuthentication().then((samlResponse) => {
        if (!restoredSession) {
          // Get the queue name and opening hours
          return this.LivechatService.getQueue(
            category,
            universe,
            !!samlResponse, // EntryPoint is different when using SSO
          ).then((queueConfig) => {
            if (!queueConfig) {
              return $q.reject();
            }

            if (!queueConfig.isOpen || !queueConfig.name || !queueConfig.entryPoint) {
              return $q.reject(queueConfig);
            }

            // Save entryPoint for session restore
            this.LivechatService.constructor.saveEntryPoint(queueConfig.entryPoint);

            return [queueConfig.entryPoint, queueConfig.name, samlResponse];
          });
        }

        // Retrieve the entryPoint to restore the session
        return [this.LivechatService.constructor.getEntryPoint(), null, samlResponse];
      }).then(([entryPoint, queue, samlResponse]) => {
        let availabilityPromise = $q.resolve();

        if (!restoredSession) {
          availabilityPromise = this.LivechatService.getAgentAvailability(
            this.librarySettings.CORSHost,
            entryPoint,
          );
        }

        // Check agent availability
        return availabilityPromise.then(() => {
          if (!restoredSession) {
            this.prepareCustomer(this.customer, queue, product, samlResponse);
          }

          this.chat.Initialize(
            entryPoint,
            this.languageCode,
            this.countryCode,
            this.eventHandlers,
            'ovh',
            'v11',
          );

          return true;
        }).catch(() => $q.reject(LIVECHAT_NOT_AGENT));
      }).catch((err) => {
        this.setChatEnded();
        return $q.reject(err);
      });
    }

    end() {
      try {
        this.setChatEnded();
        this.chat.End();
      } catch (e) { /* Just catch */ }
    }

    hasConcurrentSession() {
      return this.LivechatService.constructor.getSessionId()
        && this.LivechatService.constructor.isChatInProgress()
        && !this.inChat;
    }

    endConcurrentSession() {
      const deferred = $q.defer();
      const sessionId = this.LivechatService.constructor.getSessionId();
      const entryPoint = this.LivechatService.constructor.getEntryPoint();
      const lastRequestId = this.LivechatService.constructor.getLastRequestId();

      if (!sessionId || !this.LivechatService.constructor.isChatInProgress()) {
        deferred.resolve();
        return deferred.promise;
      }

      this.LivechatService.getHistory(
        this.librarySettings.CORSHost,
        sessionId,
      ).then((history) => {
        if (!history) {
          return null;
        }

        this.library = new EGainLibrary(this.librarySettings);
        this.chat = new this.library.Chat();
        this.eventHandlers = this.chat.GetEventHandlers();

        const endHandler = () => {
          this.end();
          deferred.resolve();
        };

        const setEndHandler = () => {
          this.setChatEnded();
          deferred.resolve();
        };

        this.eventHandlers.OnConnectionInitialized = () => {
          this.chat.Attach(
            sessionId,
            lastRequestId,
          );
        };

        // Making sure the connection will be closed
        this.eventHandlers.OnConnectSuccess = endHandler;
        this.eventHandlers.OnConnectionAttached = endHandler;
        this.eventHandlers.OnAgentMessageReceived = angular.noop;
        this.eventHandlers.OnSystemMessageReceived = angular.noop;
        this.eventHandlers.OnAgentJoined = angular.noop;
        this.eventHandlers.OnErrorOccurred = angular.noop;
        this.eventHandlers.OnCustTerminateSuccess = setEndHandler;
        this.eventHandlers.OnConnectionComplete = setEndHandler;
        this.eventHandlers.OnConnectionFailure = setEndHandler;
        this.eventHandlers.OnConnectionAttachedFailure = setEndHandler;
        this.eventHandlers.OnAgentsNotAvailable = setEndHandler;

        this.customer = new this.library.Datatype.CustomerObject();

        this.chat.Initialize(
          entryPoint,
          this.languageCode,
          this.countryCode,
          this.eventHandlers,
          'ovh',
          'v11',
        );

        return null;
      }).finally(() => {
        deferred.resolve();
      });

      return deferred.promise;
    }

    restore() {
      const sessionId = this.LivechatService.constructor.getSessionId();

      if (!sessionId || this.LivechatService.constructor.isChatInProgress()) {
        return $q.resolve(false);
      }

      return this.LivechatService.getHistory(
        this.librarySettings.CORSHost,
        sessionId,
      ).then((history) => {
        if (history) {
          return this.start(null, null, null, history);
        }

        this.setChatEnded();
        return false;
      }).catch(() => {
        this.setChatEnded();
        return $q.reject();
      });
    }

    restoreConversation(history) {
      if (history && history.message) {
        const messages = reduce(history.message, (acc, msg) => {
          if (!this.constructor.isHistoryMessage(msg)) {
            return acc;
          }

          if (this.constructor.isWelcomeMessage(msg.body)
            && msg.sender.type === 'System') {
            const newMsg = {
              time: moment(msg.timeStamp),
              text: msg.body.replace('WELCOME_MESSAGE#', ''),
              type: LIVECHAT_MESSAGE_TYPES.Welcome,
            };

            acc.push(newMsg);

            return acc;
          }

          const newMsg = {
            time: moment(msg.timeStamp),
            text: msg.body,
            type: LIVECHAT_MESSAGE_TYPES[msg.sender.type],
          };

          acc.push(newMsg);

          return acc;
        }, []);

        if (isFunction(this.customHandlers.onHistory)) {
          this.customHandlers.onHistory(messages);
        }
      }
    }

    static isHistoryMessage(msg) {
      return msg.sender
        && msg.sender.type
        && Object.keys(LIVECHAT_MESSAGE_TYPES).includes(msg.sender.type)
        && msg.body
        && msg.timeStamp
        && moment(msg.timeStamp).isValid();
    }

    static isWelcomeMessage(msg) {
      return msg.startsWith('WELCOME_MESSAGE#');
    }

    initEventHandlers(restoredSession) {
      this.eventHandlers.OnConnectionInitialized = () => {
        if (this.restoredSession) {
          this.chat.Attach(
            this.LivechatService.constructor.getSessionId(),
            this.LivechatService.constructor.getLastRequestId(),
          );
          return;
        }

        this.library.SetCustomer(this.customer);
        this.chat.Start();
      };

      this.eventHandlers.OnConnectSuccess = (successData) => {
        this.LivechatService.constructor.saveSessionId(successData.SessionID);
        this.setChatInProgress();

        // If this is a new session, trigger connectSucces
        // to display a waiting message
        if (!restoredSession && isFunction(this.customHandlers.onConnectSuccess)) {
          this.customHandlers.onConnectSuccess();
        }
      };

      this.eventHandlers.OnConnectionAttached = () => {
        this.restoreConversation(this.restoredSession);
        this.setChatInProgress();
      };

      this.eventHandlers.OnAgentMessageReceived = (agentMessage) => {
        if (isFunction(this.customHandlers.onAgentMessage)) {
          this.customHandlers.onAgentMessage(agentMessage);
        }
      };

      this.eventHandlers.OnSystemMessageReceived = (systemMessage) => {
        // Automatic welcome message based on agent name
        if (this.constructor.isWelcomeMessage(systemMessage.Message)
          && isFunction(this.customHandlers.onWelcomeMessage)) {
          this.customHandlers.onWelcomeMessage(systemMessage.Message.replace('WELCOME_MESSAGE#', ''));
          return;
        }

        // Other system messages
        if (isFunction(this.customHandlers.onSystemMessage)) {
          this.customHandlers.onSystemMessage(systemMessage);
        }
      };

      this.eventHandlers.OnCustTerminateSuccess = () => {
        if (isFunction(this.customHandlers.onSurvey)) {
          this.customHandlers.onSurvey(this.LivechatService.constructor.getSessionId());
        }
        this.setChatEnded();
      };

      this.eventHandlers.OnConnectionComplete = () => {
        this.setChatEnded();
      };

      this.eventHandlers.OnAgentJoined = angular.noop;

      this.eventHandlers.OnConnectionFailure = (event) => {
        this.setChatEnded();
        if (event.StatusMessage === 'L10N_NO_AGENTS_AVAILABLE') {
          if (isFunction(this.customHandlers.onNoAgentsAvailable)) {
            this.customHandlers.onNoAgentsAvailable();
          }
        } else if (isFunction(this.customHandlers.onConnectionFailure)) {
          this.customHandlers.onConnectionFailure();
        }
      };

      this.eventHandlers.OnConnectionAttachedFailure = () => {
        this.setChatEnded();
        if (isFunction(this.customHandlers.onConnectionFailure)) {
          this.customHandlers.onConnectionFailure();
        }
      };

      this.eventHandlers.OnAgentsNotAvailable = () => {
        this.setChatEnded();
        if (isFunction(this.customHandlers.onNoAgentsAvailable)) {
          this.customHandlers.onNoAgentsAvailable();
        }
      };

      this.eventHandlers.OnErrorOccurred = (err) => {
        if (err && err.message
          && err.message.includes('Should be abandoned')) {
          this.end();

          if (isFunction(this.customHandlers.onConnectionFailure)) {
            this.customHandlers.onConnectionFailure();
          }
        } else if (isFunction(this.customHandlers.onError)) {
          this.customHandlers.onError();
        }
      };

      this.eventHandlers.OnAgentStartTyping = () => {
        if (isFunction(this.customHandlers.onAgentStartTyping)) {
          this.customHandlers.onAgentStartTyping();
        }
      };

      this.eventHandlers.OnAgentStopTyping = () => {
        if (isFunction(this.customHandlers.onAgentStopTyping)) {
          this.customHandlers.onAgentStopTyping();
        }
      };
    }

    prepareCustomer(customer, queue, product, samlResponse) {
      const emailParam = new this.library.Datatype.CustomerParameter();
      Object.assign(emailParam, {
        eGainParentObject: 'casemgmt',
        eGainChildObject: 'email_address_contact_point_data',
        eGainAttribute: 'email_address',
        eGainValue: 'customer@ovh.com',
        eGainParamName: 'email_address',
        eGainMinLength: '1',
        eGainMaxLength: '50',
        eGainRequired: '1',
        eGainFieldType: '1',
        eGainPrimaryKey: '1',
        eGainValidationString: '',
      });
      customer.AddCustomerParameter(emailParam);

      const queueParam = new this.library.Datatype.CustomerParameter();
      Object.assign(queueParam, {
        eGainParentObject: 'casemgmt',
        eGainChildObject: 'activity_data',
        eGainAttribute: 'queue',
        eGainValue: queue,
        eGainParamName: 'queue',
        eGainMinLength: '1',
        eGainMaxLength: '50',
        eGainRequired: '1',
        eGainFieldType: '1',
        eGainPrimaryKey: '0',
        eGainValidationString: '',
      });
      customer.AddCustomerParameter(queueParam);

      const productParam = new this.library.Datatype.CustomerParameter();
      Object.assign(productParam, {
        eGainParentObject: 'casemgmt',
        eGainChildObject: 'activity_data',
        eGainAttribute: 'product',
        eGainValue: product,
        eGainParamName: 'product',
        eGainMinLength: '1',
        eGainMaxLength: '50',
        eGainRequired: '1',
        eGainFieldType: '1',
        eGainPrimaryKey: '0',
        eGainValidationString: '',
      });
      customer.AddCustomerParameter(productParam);

      if (samlResponse) {
        // Use the customer SSO
        const nicParam = new this.library.Datatype.CustomerParameter();
        Object.assign(nicParam, {
          eGainParentObject: 'casemgmt',
          eGainChildObject: 'activity_data',
          eGainAttribute: 'nichandle',
          eGainValue: '',
          eGainParamName: 'nichandle',
          eGainMinLength: '1',
          eGainMaxLength: '50',
          eGainRequired: '1',
          eGainFieldType: '1',
          eGainPrimaryKey: '0',
          eGainValidationString: '',
          providerAttributeName: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/upn',
          secureAttribute: '1',
        });
        customer.AddCustomerParameter(nicParam);

        this.library.SetSamlResponse(samlResponse);
      }
    }

    sendMessageToAgent(message) {
      this.chat.SendMessageToAgent(message);
    }

    setCustomerIsTyping() {
      this.chat.SendCustomerStartTyping();
      this.stopTypingDebounced();
    }

    setChatInProgress() {
      this.inChat = this.LivechatService.constructor.getSessionId();
      this.LivechatService.constructor.setChatInProgress();
    }

    setChatEnded() {
      // Set chat as ended only if we have the same session as in the storage
      if (this.inChat === this.LivechatService.constructor.getSessionId()) {
        this.LivechatService.constructor.setChatEnded();
      }
      this.inChat = false;
    }

    sendSurvey(sessionId, survey) {
      return this.LivechatService.postSurvey(this.librarySettings.CORSHost, sessionId, survey);
    }
  };
}

export default LivechatFactory;
