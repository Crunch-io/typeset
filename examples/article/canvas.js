import { INFINITY, formatter, linebreak } from 'typeset';

function draw(
  context,
  nodes,
  breaks,
  lineLengths,
  lineHeight,
  drawCentered
) {
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

export default function canvasTypeset({
  id,
  text,
  textAlign,
  lineLengths,
  tolerance,
  drawCentered,
  font,
  lineHeight
}) {
  const canvas = document.getElementById(id);
  const ctx = canvas.getContext('2d');

  ctx.textBaseline = 'top';
  ctx.font = font;

  const nodes = formatter({
    text: text,
    measureText: str => ctx.measureText(str).width,
    textAlign,
    hyphenateLimitChars: 4
  });

  const breaks = linebreak(nodes, lineLengths, {tolerance: tolerance});

  if (!breaks.error) {
    draw(ctx, nodes, breaks, lineLengths, lineHeight, drawCentered);
  } else {
    ctx.fillText(breaks.error.message, 0, 0);
  }
}
