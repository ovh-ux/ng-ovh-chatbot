# ovh-angular-chatbot

![githubbanner](https://user-images.githubusercontent.com/3379410/27423240-3f944bc4-5731-11e7-87bb-3ff603aff8a7.png)

![Maintenance](https://img.shields.io/maintenance/yes/2017.svg) [![Chat on gitter](https://img.shields.io/gitter/room/ovh/ux.svg)](https://gitter.im/ovh/ux)

[![NPM](https://nodei.co/npm/ovh-angular-chatbot.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/ovh-angular-chatbot/)


_the ovh-chatbot component for web integration_

# Installation

## npm

    npm install --save ovh-angular-chatbot

## bower

*not supported*

# Configuration

:warning: You have to compile the less by yourself :warning:

In your `index.html`:

```html
<!-- ovh-angular-chatbot -->
<script src="dist/ovh-angular-chatbot.min.js"></script>

<!-- place it anywhere (if you want to use the default) -->
<chatbot></chatbot>


<!-- place it anywhere (if you want to configure the pull rate) -->
<chatbot pull="2" ></chatbot>
```

In you `app.js`:

```javascript
    ...
    angular.module("myApp", [..., "ovh-angular-chatbot", ...]);
    ...

    //if you want to use a custom url:

    angular.module("myApp").config(["chatbotServiceProvider", function(chatbotServiceProvider) {
        chatbotServiceProvider.setChatbotUrl("you.re/url/here");
    }]);

```


The notifications have the icon of the file located at : '/img/ovh-angular-chatbot.png'.

dependencies
------------

You will need to have installed:
-   [angular](https://angularjs.org/) : ^1.6.1
-   [angular-animate](https://docs.angularjs.org/api/ngAnimate) : ^1.4.0
-   [angular-web-notification](https://github.com/sagiegurari/angular-web-notification) : ^1.2.22
-   [jquery-ui](https://jqueryui.com/) : ^1.12.1
-   [ng-embed](https://github.com/ritz078/ng-embed) : ^2.2.0
-   [ovh-ui-kit](https://github.com/ovh-ux/ovh-ui-kit) : ^1.0.0
-   [ovh-angular-user-pref](https://github.com/ovh-ux/ovh-angular-user-pref) : ^0.3.1

Caution: this dependencies are installed as node_modules not bower_components.

# Get the sources

```bash
   git clone https://github.com/ovh-ux/ovh-angular-chatbot.git
   cd ovh-angular-chatbot
   npm install
```
You've developed a new cool feature? Fixed an annoying bug? We'd be happy to hear from you!

Have a look in [CONTRIBUTING.md](https://github.com/ovh-ux/ovh-angular-chatbot/blob/master/CONTRIBUTING.md)

## Documentation

the chatbot div is automatically placed in the bottom right of the page.

### Disclaimer

the parent container must at least be 100vw x 100vh for the draggable feature to work properly.

### ovh-angular-user-pref:

Key used: `CHATBOT_PREF`

| property | type | default | usage |
|----------|------|---------|-------|
| enable   | bool | true | is the chatbot enabled or not? |
| notifications | bool | false | will there be notifications, when the user gets a message, when the chatbot is minimized |


You can use:
------------

  - `grunt` : to build.
  - `grunt lint` : to run eslint
  - `grunt watch` : will rebuild your project when a file change. Also re-launch Karma when a spec file change.
  - `grunt test` : to test specs files with Karma/Jasmine.
  - `grunt release --type=major|minor|patch` : to release your module.

# Related links

   * Contribute: https://github.com/ovh-ux/ovh-angular-chatbot/blob/master/CONTRIBUTING.md
   * Report bugs: https://github.com/ovh-ux/ovh-angular-chatbot/issues
   * Get latest version: https://github.com/ovh-ux/ovh-angular-chatbot

# License

See https://github.com/ovh/ovh-angular-chatbot/blob/master/LICENSE
