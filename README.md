# ng-ovh-chatbot

> OVH Angular Chatbot

[![Downloads](https://badgen.net/npm/dt/@ovh-ux/ng-ovh-chatbot)](https://npmjs.com/package/@ovh-ux/ng-ovh-chatbot) [![Dependencies](https://badgen.net/david/dep/ovh-ux/ng-ovh-chatbot)](https://npmjs.com/package/@ovh-ux/ng-ovh-chatbot?activeTab=dependencies) [![Dev Dependencies](https://badgen.net/david/dev/ovh-ux/ng-ovh-chatbot)](https://npmjs.com/package/@ovh-ux/ng-ovh-chatbot?activeTab=dependencies) [![Gitter](https://badgen.net/badge/gitter/ovh-ux/blue?icon=gitter)](https://gitter.im/ovh/ux)

## Install

```sh
yarn add @ovh-ux/ng-ovh-chatbot
```
## Usage

In your `index.html`:

```html
<!-- ng-ovh-chatbot -->
<script src="ng-ovh-chatbot/dist/index.min.js"></script>

<!-- place it anywhere -->
<ovh-chatbot></ovh-chatbot>
```

In your `app.js`:

```js
import angular from 'angular';
import ngOvhChatbot from '@ovh-ux/ng-ovh-chatbot';

angular
  .module('myApp', [
    ngOvhChatbot,
  ]);

// if you want to use a custom url:

angular
  .module('myApp')
  .config(/* @ngInject */(ChatbotService) => {
    ChatbotService.setChatbotUrl("/url/to/the/chatbot");
  });
```

## Tips

* The chatbot div is automatically placed in the bottom right of the page.

### ovh-angular-user-pref:

Key used: `CHATBOT_PREF`

| property      | type | default | usage                          |
|---------------|------|---------|--------------------------------|
| enable        | bool | true    | is the chatbot enabled or not? |
| notifications | bool | false   | will there be notifications?   |

## Test

```sh
yarn test
```

## Contributing

Always feel free to help out! Whether it's [filing bugs and feature requests](https://github.com/ovh-ux/ng-ovh-chatbot/issues/new) or working on some of the [open issues](https://github.com/ovh-ux/ng-ovh-chatbot/issues), our [contributing guide](CONTRIBUTING.md) will help get you started.

## License

[BSD-3-Clause](LICENSE) © OVH SAS
