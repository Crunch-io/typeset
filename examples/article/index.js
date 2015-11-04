import 'babel-polyfill';
import { default as _, range } from 'lodash';
import browserTypeset from './browser'
import browserAssistTypeset from './browser-assist'
import canvasTypeset from './canvas';
import text from './text';

const font = "14px 'times new roman', 'FreeSerif', serif";
const lineHeight = 21;

const radius = 147;
const circleLineLengths = _(range(0, radius * 2, lineHeight))
  .map(j => Math.round(Math.sqrt((radius - j / 2) * 8 * j)))
  .filter(j => j > 30)
  .value();

document.addEventListener('DOMContentLoaded', () => {

  const ruler = document.createElement('div');
  ruler.className = 'example';
  ruler.style.visibility = 'hidden';
  document.body.appendChild(ruler);

  const ctx = document.createElement('canvas').getContext('2d');
  const computedStyle = getComputedStyle(ruler);
  ctx.font =
    computedStyle.fontStyle + ' ' +
    computedStyle.fontVariant + ' ' +
    computedStyle.fontWeight + ' ' +
    computedStyle.fontSize + '/' +
    computedStyle.lineHeight + ' ' +
    computedStyle.fontFamily + ' ';

  const cache = {};
  function measureText(str) {
    if (!cache[str]) return cache[str] = Math.round(ctx.measureText(str).width);
    return cache[str];
  }

  browserTypeset({
    id: 'browser',
    text, measureText
  });

  browserAssistTypeset({
    id: 'browser-assist',
    text, measureText,
    textAlign: 'justify',
    lineLengths: [350],
    tolerance: 3
  });

  canvasTypeset({
    id: 'center',
    text, font, lineHeight,
    textAlign: 'center',
    lineLengths: [350],
    tolerance: 3
  });

  canvasTypeset({
    id: 'left',
    text, font, lineHeight,
    textAlign: 'left',
    lineLengths: [350],
    tolerance: 4,
    font: font
  });

  canvasTypeset({
    id: 'flow',
    text, font, lineHeight,
    textAlign: 'justify',
    lineLengths: [350, 350, 350, 200, 200, 200, 200, 200, 200, 200, 350, 350],
    tolerance: 3,
    font: font
  });

  canvasTypeset({
    id: 'triangle',
    text, font, lineHeight,
    textAlign: 'justify',
    lineLengths: [50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 550],
    tolerance: 3,
    drawCentered: true,
    font: font
  });

  canvasTypeset({
    id: 'circle',
    text, font, lineHeight,
    textAlign: 'justify',
    lineLengths: circleLineLengths,
    tolerance: 3,
    drawCentered: true,
    font: font
  });

});
