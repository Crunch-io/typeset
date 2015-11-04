import { linebreak, INFINITY, formatter } from 'typeset';
var jQuery = require('jQuery');

jQuery(function ($) {
  const start = window.performance.now();

  var tmp;

  const ctx = document.createElement('canvas').getContext('2d');
  const computedStyle = getComputedStyle(document.body);
  ctx.font =
    computedStyle.fontStyle + ' ' +
    computedStyle.fontVariant + ' ' +
    computedStyle.fontWeight + ' ' +
    computedStyle.fontSize + '/' +
    computedStyle.lineHeight + ' ' +
    computedStyle.fontFamily + ' ';

  const cache = {};
  function measureString(str) {
    if (!cache[str]) return cache[str] = Math.round(ctx.measureText(str).width);
    return cache[str];
  }

  const lineHeight = parseFloat(getComputedStyle(document.body).lineHeight);
  const lineLength = $('#typeset').width();
  let lineLengths = [];

  var space = {
      width: 0,
      stretch: 0,
      shrink: 0
    },
    hyphenWidth = measureString('-'),
    hyphenPenalty = 100;

  // Calculate the space widths based on our font preferences
  space.width = measureString('\u{00A0}');
  space.stretch = (space.width * 3) / 6;
  space.shrink = (space.width * 3) / 9;

  $('#typeset .section').each(function () {
    $(this).find('p, img').each(function (index, element) {
      var paragraph,
        output = [],
        lines = [],
        words,
        carryOver = null,
        lineStart,
        iterator,
        token, hyphenated;

      if (element.nodeName.toUpperCase() === 'P') {
        paragraph = $(element);

        const nodes = formatter({
          text: paragraph.text(),
          measureText: measureString,
          indent: index === 0 ? 0 : 30,
          hyphenateLimitChars: 6
        });

        // Perform the line breaking
        let breaks;
        for (let tolerance = 1; tolerance <= 3; tolerance++) {
          // Try again with a higher tolerance if the line breaking failed.
          breaks = linebreak(
            nodes,
            lineLengths.length !== 0 ? lineLengths : [lineLength],
            { tolerance }
          );
          if (!breaks.error) break;
        }
        if (breaks.error) throw breaks.error;

        // Build lines from the line breaks found.
        const { positions, ratios } = breaks;
        for (let i = 0; i < positions.length; i++) {
          const position = positions[i];
          const ratio = ratios[i];

          for (let j = lineStart; j < nodes.length; j += 1) {
            // After a line break, we skip any nodes unless they are boxes or forced breaks.
            if (nodes[j].Box || (nodes[j].Penalty && nodes[j].penalty === -INFINITY)) {
              lineStart = j;
              break;
            }
          }
          lines.push({
            ratio,
            position,
            nodes: nodes.slice(lineStart, position + 1)
          });
          lineStart = position;
        }

        lines.forEach(function (line, lineIndex, lineArray) {
          var indent = false,
            spaces = 0,
            totalAdjustment = 0,
            wordSpace = line.ratio * (line.ratio < 0 ? space.shrink : space.stretch),
            integerWordSpace = Math.round(wordSpace),
            adjustment = wordSpace - integerWordSpace,
            integerAdjustment = adjustment < 0 ? Math.floor(adjustment) : Math.ceil(adjustment),
            tmp = [];

          // Iterate over the nodes in each line and build a temporary array containing just words, spaces, and soft-hyphens.
          line.nodes.forEach(function (n, index, array) {
            // normal boxes
            if (n.Box && n.value !== '') {
              if (tmp.length !== 0 && tmp[tmp.length - 1] !== '&nbsp;') {
                tmp[tmp.length - 1] += n.value;
              } else {
                tmp.push(n.value);
              }
            // empty boxes (indentation for example)
            } else if (n.Box && n.value === '') {
              output.push('<span style="margin-left: 30px;"></span>');
            // glue inside a line
            } else if (n.Glue && index !== array.length - 1) {
              tmp.push('&nbsp;');
              spaces += 1;
            // glue at the end of a line
            } else if (n.Glue) {
              tmp.push(' ');
            // hyphenated word at the end of a line
            } else if (n.Penalty && n.penalty === hyphenPenalty && index === array.length - 1) {
              tmp.push('&shy;');
            // Remove trailing space at the end of a paragraph
            } else if (n.Penalty && index === array.length - 1 && tmp[tmp.length - 1] === '&nbsp;') {
              tmp.pop();
            }
          });

          totalAdjustment = Math.round(adjustment * spaces);

          // If the line ends at a soft hyphen we need to do something special as Webkit doesn't properly handle <span>hy&shy;</span><span>phen</span>.
          if (tmp[tmp.length - 1] === '&shy;') {
            if (totalAdjustment !== 0) {
              output.push('<span style="word-spacing: ' + (integerWordSpace + integerAdjustment) + 'px;">' + (carryOver ? carryOver : '') + tmp.slice(0, Math.abs(totalAdjustment) * 2).join('') + '</span>');
              output.push('<span style="word-spacing: ' + integerWordSpace + 'px;">' + tmp.slice((Math.abs(totalAdjustment) * 2), -2).join('') + '</span>');
            } else {
              output.push('<span style="word-spacing: ' + integerWordSpace + 'px;">' + (carryOver ? carryOver : '') + tmp.slice(0, -2).join('') + "</span>");
            }
            carryOver = tmp.slice(-2).join('');
          } else {
            if (totalAdjustment !== 0) {
              output.push('<span style="word-spacing: ' + (integerWordSpace + integerAdjustment) + 'px;">' + (carryOver ? carryOver : '') + tmp.slice(0, Math.abs(totalAdjustment) * 2).join('') + '</span>');
              output.push('<span style="word-spacing: ' + integerWordSpace + 'px;">' + tmp.slice(Math.abs(totalAdjustment) * 2).join('') + '</span>');
            } else {
              output.push('<span style="word-spacing: ' + integerWordSpace + 'px;">' + (carryOver ? carryOver : '') + tmp.join('') + "</span>");
            }
            carryOver = null;
          }
        });

        paragraph.html(output.join(''));
        // currentWidth = lineLength;

        lineLengths = lineLengths.slice(lines.length);
      } else {
        tmp = (lineLength - $(element).outerWidth(true));
        for (let i = 0; i < Math.ceil($(element).outerHeight(true) / lineHeight); i += 1) {
          lineLengths.push(tmp);
        }
        lineLengths.push(lineLength);
      }
    });
  });

  console.log('done rendering', window.performance.now()-start);
});
