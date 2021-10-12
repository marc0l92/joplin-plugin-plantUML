var plantuml = require('node-plantuml');
var fs = require('fs');

var gen = plantuml.generate("input-file");
gen.out.pipe(fs.createWriteStream("output-file.png"));