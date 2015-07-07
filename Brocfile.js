var concat = require('broccoli-concat');
var uglifyJavaScript = require('broccoli-uglify-js');

var scripts = concat('./', {
  inputFiles: ['**/javascript/**.js'],
  outputFile: '/index.js'
});

scripts = uglifyJavaScript(scripts);

module.exports = scripts;
