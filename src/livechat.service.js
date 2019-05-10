class LivechatService {
  /* @ngInject */
  constructor($http, $location, $q) {
    this.$http = $http;
    this.$location = $location;
    this.$q = $q;
  }

  getCountryConfiguration(countryCode) {
    return this.$http({
      method: 'GET',
      url: `/engine/2api/chat/configuration/${countryCode}`,
    }).then(response => response && response.data)
      .catch(() => null);
  }

  getQueue(universe, category) {
    return this.$http({
      method: 'GET',
      url: '/engine/2api/chat/queue',
      params: {
        universe,
        category,
      },
    }).then(response => response && response.data);
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
