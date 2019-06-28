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

export default {
  CHATBOT_API_ACTIONS,
  CHATBOT_CONFIG,
  CHATBOT_MESSAGE_QUALITY,
  CHATBOT_MESSAGE_TYPES,
  CHATBOT_SURVEY_STEPS,
  LIVECHAT_CLOSED_REASONS,
  LIVECHAT_MESSAGE_TYPES,
  LIVECHAT_NOT_AGENT,
};
