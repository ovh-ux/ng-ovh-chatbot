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

<!-- you can specify a custom URL for the API (defaults to "/chatbot") -->
<ovh-chatbot url="/url/to/the/chatbot/api"></ovh-chatbot>

<!-- you can also provide additional configuration -->
<ovh-chatbot config="{ 'space': 'Web', 'language': 'fr', 'country': 'BE' }"></ovh-chatbot>
```

In your `app.js`:

```js
import angular from 'angular';
import ngOvhChatbot from '@ovh-ux/ng-ovh-chatbot';

angular
  .module('myApp', [
    ngOvhChatbot,
  ]);
```

## Bindings

| Key                    | Value              | Default       | Description                                                     |
| ---------------------- | ------------------ | ------------- | --------------------------------------------------------------- |
| url                    | Any string         | "/chatbot"    | URL of the API endpoint for the chatbot                         |
| can-switch-to-livechat | `true` or `false`  | `false`       | Whether the bot can switch to a livechat (requires vendor libs) |
| config                 | JS object          | {}            | Configure various aspects of the bot (see next table)           |

## Config fields

| Key        | Value            | Default       | Description                                   |
| ---------- | ---------------- | ------------- | --------------------------------------------- |
| space      | Any string       | "Default/Web" | Provide the knowledge space for the bot       |
| universe   | Any string       | "WEB"         | Provide the universe for the bot              |
| language   | Two letters code | "fr"          | Provide the language for the bot              |
| country    | Two letters code | "FR"          | Provide the country for the bot               |

## Tips

* The chatbot div is automatically placed in the bottom right of the page.

## Test

```sh
yarn test
```

## Contributing

Always feel free to help out! Whether it's [filing bugs and feature requests](https://github.com/ovh-ux/ng-ovh-chatbot/issues/new) or working on some of the [open issues](https://github.com/ovh-ux/ng-ovh-chatbot/issues), our [contributing guide](CONTRIBUTING.md) will help get you started.

## License

[BSD-3-Clause](LICENSE) © OVH SAS
