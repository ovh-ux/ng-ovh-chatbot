import reduce from 'lodash/reduce';

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
      url: '/engine/2api/chat/configuration',
    }).then(response => response && response.data)
      .catch(() => null);
  }

  getQueue(universe, category, sso) {
    return this.$http({
      method: 'GET',
      url: '/engine/2api/chat/queue',
      params: {
        universe,
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

  // Format Calendar to local hours
  static formatCalendar(calendar) {
    // Calendar is keyed by english day name
    // and has a list of open slots
    return reduce(calendar, (res, slots, day) => {
      // Ignore null slots days
      if (slots) {
        res.push({
          name: day,
          slots: this.formatCalendarDay(slots),
        });
      }

      return res;
    }, []);
  }

  static formatCalendarDay(slots) {
    return slots.map(slot => this.formatCalendarSlot(slot));
  }

  static formatCalendarSlot(slot) {
    const today = moment().format('YYYY-MM-DD');
    // Format to local time
    return {
      startTime: moment(`${today}T${slot.startTime}`).format('LT'),
      endTime: moment(`${today}T${slot.endTime}`).format('LT'),
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
