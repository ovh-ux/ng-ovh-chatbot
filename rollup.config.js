import configGenerator from '@ovh-ux/component-rollup-config';

const config = configGenerator({
  input: './src/index.js',
});

export default [
  config.cjs(),
  config.es(),
  config.umd({
    output: {
      globals: {
        '@ovh-ux/translate-async-loader': 'translate-async-loader',
        '@uirouter/angularjs': 'uiRouter',
        angular: 'angular',
        'angular-translate': 'translate',
        'chart.js': 'Chart',
        'CSV-JS': 'CSV',
        'ip-address': 'ipAddress',
        jquery: '$',
        'jsplumb/dist/js/jsplumb': 'jsplumb',
        lodash: '_',
        moment: 'moment',
        punycode: 'punycode',
        'validator-js': 'validator',
      },
    },
  }),
];
