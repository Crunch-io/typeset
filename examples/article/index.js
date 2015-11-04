var Typeset = require('typeset');
import { INFINITY, formatter, linebreak } from 'typeset';
require('./browser');
require('./browser-assist');
import { chain, range, map, filter } from 'lodash';
window.text = "In olden times when wishing still helped one, there lived a king whose daughters were all beautiful; and the youngest was so beautiful that the sun itself, which has seen so much, was astonished whenever it shone in her face. Close by the king's castle lay a great dark forest, and under an old lime-tree in the forest was a well, and when the day was very warm, the king's child went out to the forest and sat down by the fountain; and when she was bored she took a golden ball, and threw it up on high and caught it; and this ball was her favorite plaything."

const lineHeight = 21;

function draw(context, nodes, breaks, lineLengths, drawCentered) {
  const maxLength = Math.max.apply(null, lineLengths);

  // Iterate through the line breaks, and split the nodes at the
  // correct point.
  const { positions, ratios } = breaks;
  const lines = positions.map((position, i, positions) => {
    // After a line break, we skip any nodes unless they are boxes or forced breaks.
    let lastBreak = positions[i - 1] || 0;
    while (lastBreak < nodes.length) {
     if (nodes[lastBreak].Box) break;
     if (nodes[lastBreak].Penalty && nodes[lastBreak] === -INFINITY) break;
     lastBreak++;
    }
    return nodes.slice(lastBreak, position);
  });

  lines.forEach((line, lineNumber) => {
    const y = 4 + lineNumber * lineHeight
    const ratio = ratios[lineNumber]
    const lineLength = lineNumber < lineLengths.length ?
      lineLengths[lineNumber] :
      lineLengths[lineLengths.length - 1];

    let x = drawCentered ? (maxLength - lineLength) / 2 : 0;

    line.forEach(function (node, i, line) {
      if (node.Box) {
        context.fillText(node.value, x, y);
        x += node.width;
      } else if (node.Glue) {
        x += node.width + ratio * (ratio < 0 ? node.shrink : node.stretch);
      } else if (node.Penalty && node.penalty === 100 && i === line.length - 1) {
          context.fillText('-', x, y);
      }
    });
  });
};

function align({id, textAlign, lineLengths, tolerance, drawCentered}) {
  const canvas = document.getElementById(id);
  const ctx = canvas.getContext('2d');

  ctx.textBaseline = 'top';
  ctx.font = "14px 'times new roman', 'FreeSerif', serif";

  const nodes = formatter({
    text: window.text,
    measureText: str => ctx.measureText(str).width,
    textAlign,
    hyphenateLimitChars: 4
  });

  const breaks = linebreak(nodes, lineLengths, {tolerance: tolerance});

  if (!breaks.error) {
    draw(ctx, nodes, breaks, lineLengths, drawCentered);
  } else {
    ctx.fillText(breaks.error.message, 0, 0);
  }
}

const radius = 147;
const circleLineLengths = chain(range(0, radius * 2, lineHeight))
  .map(j => Math.round(Math.sqrt((radius - j / 2) * 8 * j)))
  .filter(j => j > 30)
  .value();

document.addEventListener('DOMContentLoaded', () => {
  align({
    id: 'center',
    textAlign: 'center',
    lineLengths: [350],
    tolerance: 3
  });
  align({
    id: 'left',
    textAlign: 'left',
    lineLengths: [350],
    tolerance: 4
  });
  align({
    id: 'flow',
    textAlign: 'justify',
    lineLengths: [350, 350, 350, 200, 200, 200, 200, 200, 200, 200, 350, 350],
    tolerance: 3
  });
  align({
    id: 'triangle',
    textAlign: 'justify',
    lineLengths: [50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 550],
    tolerance: 3,
    drawCentered: true
  });
  align({
    id: 'circle',
    textAlign: 'justify',
    lineLengths: circleLineLengths,
    tolerance: 3,
    drawCentered: true
  });
});
