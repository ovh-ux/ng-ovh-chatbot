export const CHATBOT_API_ACTIONS = {
  talk: 'talk',
  setContext: 'setContext',
  history: 'history',
  feedback: 'feedback',
  suggestions: 'suggestions',
  topKnowledge: 'topKnowledge',
};

export const CHATBOT_CONFIG = {
  secondsBeforeSurvey: 3000,
};

export const CHATBOT_MESSAGE_QUALITY = {
  normal: 'normal',
  invisible: 'invisible',
  toplist: 'toplist',
};

export const CHATBOT_MESSAGE_TYPES = {
  bot: 'bot',
  user: 'user',
  agent: 'agent',
  postback: 'postback',
  survey: 'survey',
};

export const CHATBOT_SURVEY_STEPS = {
  ask: 'ask',
  details: 'details',
};

export const LIVECHAT_CLOSED_REASONS = {
  outOfBusinessHours: 'out_of_business_hours',
  closingDay: 'closing_day',
  holiday: 'holiday',
};

export const LIVECHAT_MESSAGE_TYPES = {
  Customer: 'user',
  Agent: 'agent',
  System: 'bot',
  Welcome: 'welcome',
};

export const LIVECHAT_NOT_AGENT = 'no_agent_available';

export const LIVECHAT_QUESTIONS = [
  {
    id: 'q1',
    text: 'livechat_survey_question1',
    answers: [
      { value: 3, text: 'livechat_survey_answer_over_satisfied', img: 'happy' },
      { value: 1, text: 'livechat_survey_answer_satisfied', img: 'medium' },
      { value: 0, text: 'livechat_survey_answer_unsatisfied', img: 'sad' },
    ],
  },
  {
    id: 'q2',
    text: 'livechat_survey_question2',
    answers: [
      { value: 3, text: 'livechat_survey_answer_over_satisfied', img: 'happy' },
      { value: 1, text: 'livechat_survey_answer_satisfied', img: 'medium' },
      { value: 0, text: 'livechat_survey_answer_unsatisfied', img: 'sad' },
    ],
  },
  {
    id: 'q3',
    text: 'livechat_survey_question3',
    answers: [
      { value: 4, text: 'chatbot_answer_yes', img: 'happy' },
      { value: 0, text: 'chatbot_answer_no', img: 'sad' },
    ],
  },
];

export default {
  CHATBOT_API_ACTIONS,
  CHATBOT_CONFIG,
  CHATBOT_MESSAGE_QUALITY,
  CHATBOT_MESSAGE_TYPES,
  CHATBOT_SURVEY_STEPS,
  LIVECHAT_CLOSED_REASONS,
  LIVECHAT_MESSAGE_TYPES,
  LIVECHAT_NOT_AGENT,
  LIVECHAT_QUESTIONS,
};
