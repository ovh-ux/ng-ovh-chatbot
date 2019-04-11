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
        angular: 'angular',
        'angular-translate': 'translate',
        moment: 'moment',
      },
    },
  }),
];
