var concat = require('broccoli-concat');
var uglifyJavaScript = require('broccoli-uglify-js');
var compileSass = require('broccoli-sass');
var mergeTrees = require('broccoli-merge-trees')

var appJs = concat('javascript', {
  inputFiles: ['jquery-1.11.3.js', 'jquery.paging.js', 'est-widget.js'],
  outputFile: '/est-widget.js'
});
appJs = uglifyJavaScript(appJs);

var appCss = compileSass(['sass'], 'style.scss', 'est-widget.css');

var html = concat('.', {
  inputFiles: ['example.html'],
  outputFile: '/example.html'
});

module.exports = mergeTrees([appJs, appCss, html])
