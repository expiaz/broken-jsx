var v = require('./n/v');
var A = require('./../A');

var begin = new Date();

for(var i = 0; i < 10000; i++){
    A.render(
        v(),
        document.getElementById('app')
    );
    A.unmount(document.getElementById('app'));
}


console.log(new Date() - begin);