class LivechatService {
  /* @ngInject */
  constructor($http, $location, $q) {
    this.$http = $http;
    this.$location = $location;
    this.$q = $q;
  }

  getConfiguration() {
    return this.$http({
      method: 'GET',
      url: '/support/chat/configuration',
    }).then(response => response && response.data)
      .catch(() => null);
  }

  getQueue(category, product, sso) {
    return this.$http({
      method: 'GET',
      url: '/support/chat/queue',
      params: {
        product,
        category,
        sso,
      },
    }).then((response) => {
      const queueConfig = response && response.data;

      if (queueConfig && queueConfig.calendar) {
        queueConfig.calendar = this.constructor.formatCalendar(queueConfig.calendar);
      }

      return queueConfig;
    });
  }

  static formatCalendar(calendar) {
    const result = [];
    [
      'monday', 'tuesday', 'wednesday',
      'thursday', 'friday', 'saturday', 'sunday',
    ].forEach((day) => {
      if (calendar[day]) {
        result.push({
          name: day,
          slots: calendar[day].map(slot => this.formatCalendarSlot(calendar.timezone, slot)),
        });
      }
    });

    return result;
  }

  static formatCalendarSlot(timezone, slot) {
    return {
      startTime: moment(`${slot.startTime}${timezone}`, 'HH:mm:ssZ').format('LT'),
      endTime: moment(`${slot.endTime}${timezone}`, 'HH:mm:ssZ').format('LT'),
    };
  }

  getAuthentication() {
    if (!this.$location.host().includes('ovh.com')) {
      return this.$q.resolve(null);
    }

    return this.$http({
      method: 'GET',
      url: 'https://www.ovh.com/auth/sso/saml/stub.cgi',
      withCredentials: true,
    }).then(response => response && response.data)
      .catch(() => null);
  }

  getAgentAvailability(livechatHost, entryPoint) {
    return this.$http({
      method: 'GET',
      url: `${livechatHost}/egain/chat/entrypoint/agentAvailability/${entryPoint}`,
      headers: {
        Accept: 'application/json',
      },
    }).then((response) => {
      if (response && response.data && response.data.available) {
        return true;
      }

      return this.$q.reject();
    });
  }

  getHistory(livechatHost, sessionId) {
    return this.$http({
      method: 'POST',
      url: `${livechatHost}/egain/chat/entrypoint/transcript`,
      data: {
        sid: sessionId,
      },
      headers: {
        'Content-Type': 'application/json;charset=utf-8',
        Accept: 'application/json',
      },
    }).then(response => response && response.data)
      .catch((err) => {
        if (err && err.data && err.data.code === '400-115') {
          // This session is closed
          return null;
        }

        return this.$q.reject();
      });
  }

  postSurvey(livechatHost, sessionId, survey) {
    return this.$http({
      method: 'POST',
      url: `${livechatHost}/egain/chat/entrypoint/survey`,
      data: `<egainSurvey sid="${sessionId}"
                          xmlns="http://bindings.egain.com/chat">
               <survey>
                 <question>Q1</question>
                 <answer>${survey.q1}</answer>
               </survey>
               <survey>
                 <question>Q2</question>
                 <answer>${survey.q2}</answer>
               </survey>
               <survey>
                 <question>Q3</question>
                 <answer>${survey.q3}</answer>
               </survey>
             </egainSurvey>`,
      headers: {
        'Content-Type': 'text/xml;charset=utf-8',
        Accept: '*/*',
      },
    });
  }

  static getSessionId() {
    return localStorage.getItem('ovhLivechatId');
  }

  static saveSessionId(id) {
    if (id) {
      localStorage.setItem('ovhLivechatId', id);
    }
  }

  static removeSessionId() {
    localStorage.removeItem('ovhLivechatId');
  }

  static getEntryPoint() {
    return localStorage.getItem('ovhLivechatEntryPoint');
  }

  static saveEntryPoint(entryPoint) {
    if (entryPoint) {
      localStorage.setItem('ovhLivechatEntryPoint', entryPoint);
    }
  }

  static getLastRequestId() {
    return localStorage.getItem('ovhLivechatLastRequestId');
  }

  /* Store chat inProgress because the livechat
     does not support multiple tabs / windows
     for the same chat */

  static isChatInProgress() {
    return localStorage.getItem('ovhLivechatInProgress');
  }

  static setChatInProgress() {
    localStorage.setItem('ovhLivechatInProgress', true);
  }

  static setChatEnded() {
    localStorage.removeItem('ovhLivechatInProgress');
  }
}

export default LivechatService;
