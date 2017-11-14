'use strict';

var _linebreak = require('./linebreak');

/*global Typeset.linebreak*/

/*!
 * Knuth and Plass line breaking algorithm in JavaScript
 *
 * Licensed under the new BSD License.
 * Copyright 2009-2010, Bram Stein
 * All rights reserved.
 */

var Hypher = require('hypher');
var english = require('hyphenation.en-us');
var h = new Hypher(english);


var timeAssemblingNodes = 0;
var timeMeasuringText = 0;

function formatter() {
    var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        text = _ref.text,
        measureText = _ref.measureText,
        _ref$space = _ref.space;

    _ref$space = _ref$space === undefined ? {} : _ref$space;
    var _ref$space$width = _ref$space.width,
        width = _ref$space$width === undefined ? 3 : _ref$space$width,
        _ref$space$stretch = _ref$space.stretch,
        stretch = _ref$space$stretch === undefined ? 6 : _ref$space$stretch,
        _ref$space$shrink = _ref$space.shrink,
        shrink = _ref$space$shrink === undefined ? 9 : _ref$space$shrink,
        _ref$textAlign = _ref.textAlign,
        textAlign = _ref$textAlign === undefined ? 'justify' : _ref$textAlign,
        _ref$indent = _ref.indent,
        indent = _ref$indent === undefined ? 0 : _ref$indent,
        _ref$hyphenateLimitCh = _ref.hyphenateLimitChars,
        hyphenateLimitChars = _ref$hyphenateLimitCh === undefined ? 5 : _ref$hyphenateLimitCh;


    var start = window.performance.now();
    var spaceWidth = measureText('\xA0');
    var hyphenWidth = measureText('-');
    timeMeasuringText += window.performance.now() - start;
    start = window.performance.now();

    var spaceStretch = spaceWidth * width / stretch;
    var spaceShrink = spaceWidth * width / shrink;
    var hyphenPenalty = 100;

    var nodes = [];
    var words = text.split(/\s/);

    if (textAlign === 'center') {
        // Although not specified in the Knuth and Plass whitepaper,
        // this box is necessary to keep the glue from disappearing.
        nodes.push((0, _linebreak.box)(0, ''));
        nodes.push((0, _linebreak.glue)(0, 12, 0));
    } else if (indent) {
        nodes.push((0, _linebreak.box)(indent, ''));
    }

    words.forEach(function (word, index, array) {
        // var hyphenated = h.hyphenate(word);
        // if (hyphenated.length > 1 && word.length > 4) {

        if (word.length > hyphenateLimitChars) {
            // TODO: remove second argument 'en'
            var syllables = h.hyphenate(word, 'en');
            syllables.forEach(function (part, partIndex, partArray) {
                timeAssemblingNodes += window.performance.now() - start;
                start = window.performance.now();
                var length = measureText(part);
                timeMeasuringText += window.performance.now() - start;
                start = window.performance.now();

                nodes.push((0, _linebreak.box)(length, part));
                if (partIndex !== partArray.length - 1) {
                    nodes.push((0, _linebreak.penalty)(hyphenWidth, hyphenPenalty, 1));
                }
            });
        } else {
            timeAssemblingNodes += window.performance.now() - start;
            start = window.performance.now();
            var length = measureText(word);
            timeMeasuringText += window.performance.now() - start;
            start = window.performance.now();

            nodes.push((0, _linebreak.box)(length, word));
        }

        switch (textAlign) {
            case 'center':
                if (index === array.length - 1) {
                    nodes.push((0, _linebreak.glue)(0, 12, 0));
                    nodes.push((0, _linebreak.penalty)(0, -_linebreak.INFINITY, 0));
                } else {
                    nodes.push((0, _linebreak.glue)(0, 12, 0));
                    nodes.push((0, _linebreak.penalty)(0, 0, 0));
                    nodes.push((0, _linebreak.glue)(spaceWidth, -24, 0));
                    nodes.push((0, _linebreak.box)(0, ''));
                    nodes.push((0, _linebreak.penalty)(0, _linebreak.INFINITY, 0));
                    nodes.push((0, _linebreak.glue)(0, 12, 0));
                }
                break;
            case 'left':
                if (index === array.length - 1) {
                    nodes.push((0, _linebreak.glue)(0, _linebreak.INFINITY, 0));
                    nodes.push((0, _linebreak.penalty)(0, -_linebreak.INFINITY, 1));
                } else {
                    nodes.push((0, _linebreak.glue)(0, 12, 0));
                    nodes.push((0, _linebreak.penalty)(0, 0, 0));
                    nodes.push((0, _linebreak.glue)(spaceWidth, -12, 0));
                }
                break;
            default:
                if (index === array.length - 1) {
                    nodes.push((0, _linebreak.glue)(0, _linebreak.INFINITY, 0));
                    nodes.push((0, _linebreak.penalty)(0, -_linebreak.INFINITY, 1));
                } else {
                    nodes.push((0, _linebreak.glue)(spaceWidth, spaceStretch, spaceShrink));
                }
                break;
        }
    });
    timeAssemblingNodes += window.performance.now() - start;
    //console.log(`Time Measuring Text: ${timeMeasuringText}; Time Assembling Nodes: ${timeAssemblingNodes}`);
    return nodes;
}

formatter.defaults = {
    space: {
        width: 3,
        stretch: 6,
        shrink: 9
    }
};

module.exports = formatter;
