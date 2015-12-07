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
import { box, glue, penalty, INFINITY } from './linebreak';

let timeAssemblingNodes = 0;
let timeMeasuringText = 0;

function formatter({
        text,
        measureText,
        space: {width = 3, stretch = 6, shrink = 9} = {},
        textAlign = 'justify',
        indent = 0,
        hyphenateLimitChars = 5
    } = {}) {

    let start = window.performance.now();
    const spaceWidth = measureText('\u{00A0}');
    const hyphenWidth = measureText('-');
    timeMeasuringText += window.performance.now() - start;
    start = window.performance.now();

    const spaceStretch = (spaceWidth * width) / stretch;
    const spaceShrink = (spaceWidth * width) / shrink;
    const hyphenPenalty = 100;

    const nodes = [];
    const words = text.split(/\s/);

    if (textAlign === 'center') {
        // Although not specified in the Knuth and Plass whitepaper,
        // this box is necessary to keep the glue from disappearing.
        nodes.push(box(0, ''));
        nodes.push(glue(0, 12, 0));
    } else if (indent) {
        nodes.push(box(indent, ''));
    }

    words.forEach(function (word, index, array) {
        // var hyphenated = h.hyphenate(word);
        // if (hyphenated.length > 1 && word.length > 4) {

        if (word.length > hyphenateLimitChars) {
            // TODO: remove second argument 'en'
            const syllables = h.hyphenate(word, 'en');
            syllables.forEach(function (part, partIndex, partArray) {
                timeAssemblingNodes += window.performance.now() - start;
                start = window.performance.now();
                const length = measureText(part)
                timeMeasuringText += window.performance.now() - start;
                start = window.performance.now();

                nodes.push(box(length, part));
                if (partIndex !== partArray.length - 1) {
                    nodes.push(penalty(hyphenWidth, hyphenPenalty, 1));
                }
            });
        } else {
            timeAssemblingNodes += window.performance.now() - start;
            start = window.performance.now();
            const length = measureText(word)
            timeMeasuringText += window.performance.now() - start;
            start = window.performance.now();

            nodes.push(box(length, word));
        }

        switch (textAlign) {
            case 'center':
                if (index === array.length - 1) {
                    nodes.push(glue(0, 12, 0));
                    nodes.push(penalty(0, -INFINITY, 0));
                } else {
                    nodes.push(glue(0, 12, 0));
                    nodes.push(penalty(0, 0, 0));
                    nodes.push(glue(spaceWidth, -24, 0));
                    nodes.push(box(0, ''));
                    nodes.push(penalty(0, INFINITY, 0));
                    nodes.push(glue(0, 12, 0));
                }
                break;
            case 'left':
                if (index === array.length - 1) {
                    nodes.push(glue(0, INFINITY, 0));
                    nodes.push(penalty(0, -INFINITY, 1));
                } else {
                    nodes.push(glue(0, 12, 0));
                    nodes.push(penalty(0, 0, 0));
                    nodes.push(glue(spaceWidth, -12, 0));
                }
                break;
            default:
                if (index === array.length - 1) {
                    nodes.push(glue(0, INFINITY, 0));
                    nodes.push(penalty(0, -INFINITY, 1));
                } else {
                    nodes.push(glue(spaceWidth, spaceStretch, spaceShrink));
                }
                break;
        }

    });
    timeAssemblingNodes += window.performance.now() - start;
    console.log(`Time Measuring Text: ${timeMeasuringText}; Time Assembling Nodes: ${timeAssemblingNodes}`);
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
