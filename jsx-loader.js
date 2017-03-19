var jstransform = require('./jsx');

module.exports = function(source) {
    console.log('[jsxloader] ',source);
    var transform = jstransform(source);
    return transform;
};