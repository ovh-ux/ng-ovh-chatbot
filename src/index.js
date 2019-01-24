import angular from 'angular';

import ChatbotCtrl from './controller';
import ChatbotServiceProvider from './service';
import directive from './directive';

import iconsTemplate from './templates/icons.html';
import embeddedTemplate from './templates/embedded.html';

import './index.less';

const moduleName = 'ngOvhChatbot';

angular
  .module(moduleName, [
    'ngAnimate',
    'ngEmbed',
    'ovh-angular-user-pref',
  ])
  .controller('chatbotController', ChatbotCtrl)
  .provider('chatbotService', ChatbotServiceProvider)
  .directive('ovhChatbot', directive)
  .run(($templateCache) => {
    $templateCache.put('ng-ovh-chatbot-icons-template.html', iconsTemplate);
    $templateCache.put('ng-ovh-chatbot-embedded-template.html', embeddedTemplate);
  })
  .constant('CHATBOT_MESSAGE_TYPES', {
    bot: 'bot',
    user: 'user',
    postback: 'postback',
  })
  .constant('CHATBOT_NGEMBED_OPTIONS', {
    watchEmbedData: true, // watch embed data and render on change
    sanitizeHtml: false, // convert html to text
    fontSmiley: true, // convert ascii smileys into font smileys
    emoji: true, // convert emojis short names into images
    link: false, // convert links into anchor tags
    linkTarget: '_blank', // _blank|_self|_parent|_top|framename
    pdf: {
      embed: true, // show pdf viewer.
    },
    image: {
      embed: true, // toggle embedding image after link, supports gif|jpg|jpeg|tiff|png|svg|webp.
    },
    audio: {
      embed: true, // toggle embedding audio player, supports wav|mp3|ogg
    },
    basicVideo: true, // embed video player, supports ogv|webm|mp4
    gdevAuth: '', // Google developer auth key for YouTube data api
    video: {
      embed: false, // embed YouTube/Vimeo videos
      width: 360, // width of embedded player
      height: 240, // height of embedded player
      ytTheme: 'dark', // YouTube player theme (light/dark)
      details: false, // display video details (like title, description etc.)
      thumbnailQuality: 'medium', // quality of the thumbnail low|medium|high
      autoPlay: false, // autoplay embedded videos
    },
    twitchtvEmbed: true,
    dailymotionEmbed: true,
    tedEmbed: true,
    dotsubEmbed: true,
    liveleakEmbed: true,
    ustreamEmbed: true,
    soundCloudEmbed: true,
    soundCloudOptions: {
      height: 160,
      themeColor: 'f50000',
      autoPlay: false,
      hideRelated: false,
      showComments: true,
      showUser: true,
      showReposts: false,
      visual: false, // Show/hide the big preview image
      download: false, // Show/Hide download buttons
    },
    spotifyEmbed: true,
    tweetEmbed: false, // toggle embedding tweets
    tweetOptions: {
      // The maximum width of a rendered Tweet in whole pixels.
      // Must be between 220 and 550 inclusive.
      maxWidth: 550,

      // Toggle expanding links in Tweets to photo, video, or link previews.
      hideMedia: false,

      // When set to true or 1 a collapsed version of the previous Tweet in a conversation thread
      // will not be displayed when the requested Tweet is in reply to another Tweet.
      hideThread: false,

      // Specifies whether the embedded Tweet should be floated left, right, or center in
      // the page relative to the parent element.Valid values are left, right, center, and none.
      // Defaults to none, meaning no alignment styles are specified for the Tweet.
      align: 'none',

      // Request returned HTML and a rendered Tweet in the specified.
      // Supported Languages listed here (https://dev.twitter.com/web/overview/languages)
      lang: 'en',
    },
    code: {
      highlight: false, // highlight code written in 100+ languages supported by highlight
      // requires highlight.js (https://highlightjs.org/) as dependency.
      lineNumbers: false, // display line numbers
    },
    codepenEmbed: true,
    codepenHeight: 300,
    jsfiddleEmbed: true,
    jsfiddleHeight: 300,
    jsbinEmbed: true,
    jsbinHeight: 300,
    plunkerEmbed: true,
    githubgistEmbed: true,
    ideoneEmbed: true,
    ideoneHeight: 300,
  });

export default moduleName;
