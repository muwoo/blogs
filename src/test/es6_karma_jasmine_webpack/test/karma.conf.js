// Karma configuration
// Generated on Thu Aug 16 2018 20:03:57 GMT+0800 (CST)

const webpack = require('../webpack.config')

module.exports = function(config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine'],
    files: [
      'test/**/*.spec.js'
    ],
    exclude: [
    ],
    preprocessors: {
      'test/add.spec.js': ['webpack']
    },
    webpack: webpack,
    reporters: ['spec', 'coverage'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: ['Chrome'],
    singleRun: false,
    concurrency: Infinity,
    coverageReporter: {
      dir: './coverage',
      reporters: [
        { type: 'lcov', subdir: '.' },
        { type: 'text-summary' }
      ]
    }
  })
}
