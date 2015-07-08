var concat = require('broccoli-concat');
var uglifyJavaScript = require('broccoli-uglify-js');
var compileSass = require('broccoli-sass');
var mergeTrees = require('broccoli-merge-trees')

var appJs = concat('./', {
  inputFiles: ['**/javascript/**.js'],
  outputFile: '/index.js'
});
appJs = uglifyJavaScript(appJs);

var appCss = compileSass(['sass'], 'style.scss', 'est-widget.css');

module.exports = mergeTrees([appJs, appCss])
