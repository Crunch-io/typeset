'use strict';

var formatter = require('./formatter');
var linebreak = require('./linebreak');

module.exports = {
  formatter: formatter,
  linebreak: linebreak.linebreak,
  glue: linebreak.glue,
  box: linebreak.box,
  penalty: linebreak.penalty,
  INFINITY: linebreak.INFINITY
};
