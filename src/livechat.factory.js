import 'egain-client-library';
import isFunction from 'lodash/isFunction';
import reduce from 'lodash/reduce';
import messaging from './libs/egain/messaging/translations';
import customChat from './libs/egain/customChat/translations';

/* @ngInject */
function LivechatFactory(
  $http,
  $location,
  $q,
  $translate,
  $window,
  LivechatService,
  CHATBOT_MESSAGE_TYPES,
) {
  return class {
    constructor(countryConfig, languageCode, countryCode, handlers) {
      this.$http = $http;
      this.$location = $location;
      this.$translate = $translate;
      this.$q = $q;
      this.$window = $window;
      this.CHATBOT_MESSAGE_TYPES = CHATBOT_MESSAGE_TYPES;
      this.LivechatService = LivechatService;
      this.countryConfig = countryConfig;
      this.languageCode = languageCode;
      this.countryCode = countryCode;

      this.librarySettings = new EGainLibrarySettings();
      this.librarySettings.CORSHost = this.countryConfig.host;
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
    }

    start(restoredSession = null) {
      this.library = new EGainLibrary(this.librarySettings);
      this.chat = new this.library.Chat();
      this.eventHandlers = this.chat.GetEventHandlers();
      this.restoredSession = restoredSession;

      this.initEventHandlers();

      this.customer = new this.library.Datatype.CustomerObject();

      return this.LivechatService.getAuthentication().then((samlResponse) => {
        const entryPoint = samlResponse
          ? this.countryConfig.entryPoints.sso
          : this.countryConfig.entryPoints.default;

        this.prepareCustomer(this.customer, samlResponse);
        this.chat.Initialize(
          entryPoint,
          this.languageCode,
          this.countryCode,
          this.eventHandlers,
          'ovh',
          'v11',
        );
        return true;
      }).catch(() => {
        this.setChatEnded();
        return $q.reject();
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

      if (sessionId && this.LivechatService.constructor.isChatInProgress()) {
        this.LivechatService.getHistory(
          this.librarySettings.CORSHost,
          sessionId,
        ).then((history) => {
          if (history) {
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
                this.LivechatService.constructor.getSessionId(),
                this.LivechatService.constructor.getLastRequestId(),
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

            return this.LivechatService.getAuthentication().then((samlResponse) => {
              const entryPoint = samlResponse
                ? this.countryConfig.entryPoints.sso
                : this.countryConfig.entryPoints.default;

              this.prepareCustomer(this.customer, samlResponse);
              this.chat.Initialize(
                entryPoint,
                this.languageCode,
                this.countryCode,
                this.eventHandlers,
                'ovh',
                'v11',
              );
            });
          }
          return null;
        }).finally(() => {
          deferred.resolve();
        });
      } else {
        deferred.resolve();
      }

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
          return this.start(history);
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

          const newMsg = {
            time: moment(msg.timeStamp),
            text: msg.body,
          };

          switch (msg.sender.type) {
            case 'Customer':
              newMsg.type = this.CHATBOT_MESSAGE_TYPES.user;
              break;
            case 'Agent':
              newMsg.type = this.CHATBOT_MESSAGE_TYPES.agent;
              break;
            case 'System':
              newMsg.type = this.CHATBOT_MESSAGE_TYPES.bot;
              break;
            default:
              break;
          }

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
        && ['Customer', 'Agent', 'System'].includes(msg.sender.type)
        && msg.body
        && msg.timeStamp
        && moment(msg.timeStamp).isValid();
    }

    initEventHandlers() {
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
    }

    prepareCustomer(customer, samlResponse) {
      const emailParam = new this.library.Datatype.CustomerParameter();
      emailParam.eGainParentObject = 'casemgmt';
      emailParam.eGainChildObject = 'email_address_contact_point_data';
      emailParam.eGainAttribute = 'email_address';
      emailParam.eGainValue = 'customer@ovh.com';
      emailParam.eGainParamName = 'email_address';
      emailParam.eGainMinLength = '1';
      emailParam.eGainMaxLength = '50';
      emailParam.eGainRequired = '1';
      emailParam.eGainFieldType = '1';
      emailParam.eGainPrimaryKey = '1';
      emailParam.eGainValidationString = '';
      customer.AddCustomerParameter(emailParam);

      if (samlResponse) {
        // Use the customer SSO
        const nicParam = new this.library.Datatype.CustomerParameter();
        nicParam.eGainParentObject = 'casemgmt';
        nicParam.eGainChildObject = 'activity_data';
        nicParam.eGainAttribute = 'nichandle';
        nicParam.eGainValue = '';
        nicParam.eGainParamName = 'nichandle';
        nicParam.eGainMinLength = '1';
        nicParam.eGainMaxLength = '50';
        nicParam.eGainRequired = '1';
        nicParam.eGainFieldType = '1';
        nicParam.eGainPrimaryKey = '0';
        nicParam.eGainValidationString = '';
        nicParam.providerAttributeName = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/upn';
        nicParam.secureAttribute = '1';
        customer.AddCustomerParameter(nicParam);

        this.library.SetSamlResponse(samlResponse);
      }
    }

    sendMessageToAgent(message) {
      this.chat.SendMessageToAgent(message);
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
