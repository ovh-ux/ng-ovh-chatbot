export const CHATBOT_API_ACTIONS = {
  talk: 'talk',
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
  postback: 'postback',
  survey: 'survey',
};

export const CHATBOT_SURVEY_STEPS = {
  ask: 'ask',
  details: 'details',
};

export default {
  CHATBOT_API_ACTIONS,
  CHATBOT_CONFIG,
  CHATBOT_MESSAGE_QUALITY,
  CHATBOT_MESSAGE_TYPES,
  CHATBOT_SURVEY_STEPS,
};
