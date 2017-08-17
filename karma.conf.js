// Karma configuration
// http://karma-runner.github.io/0.10/config/configuration-file.html

module.exports = function (config) {
    config.set({
        plugins : [
          'karma-jasmine-html-reporter',
           'karma-spec-reporter',
           'karma-jasmine',
           'karma-phantomjs-launcher',
           'karma-ng-html2js-preprocessor'
         ],


        // base path, that will be used to resolve files and exclude
        basePath   : '',

        // testing framework to use (jasmine/mocha/qunit/...)
        frameworks : ['jasmine'],

        files : [
            'node_modules/jquery/dist/jquery.js',
            'node_modules/lodash/lodash.js',
            'node_modules/angular/angular.js',
            'node_modules/angular-sanitize/angular-sanitize.js',
            'node_modules/angular-mocks/angular-mocks.js',
            'node_modules/ng-emoticons/dist/ng-emoticons.min.js',
            '.test/chatbot.js',
            '.test/*.js',
            '.test/**/*.js'
        ],


        // list of files / patterns to exclude
        exclude               : [],

        // web server port
        port                  : 8081,

        // level of logging
        // possible values: LOG_DISABLE || LOG_ERROR || LOG_WARN || LOG_INFO || LOG_DEBUG
        logLevel              : config.LOG_INFO,

        // enable / disable watching file and executing tests whenever any file changes
        autoWatch             : false,

        // reporter types:
        // - dots
        // - progress (default)
        // - spec (karma-spec-reporter)
        // - junit
        // - growl
        // - coverage
        reporters: ["spec"],


        preprocessors: {
                   "src/**/*.html": "ng-html2js"
        },

        ngHtml2JsPreprocessor: {
           stripPrefix: "src/",
           moduleName: "templates"
        },

        // Start these browsers, currently available:
        // - Chrome
        // - ChromeCanary
        // - Firefox
        // - Opera
        // - Safari (only Mac)
        // - PhantomJS
        // - IE (only Windows)
        browsers              : ['PhantomJS'],

        // Continuous Integration mode
        // if true, it capture browsers, run tests and exit
        singleRun             : false,



    });
};
