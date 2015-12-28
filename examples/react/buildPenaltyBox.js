import { Children } from 'react';
import { glue, box, hyphen, freeBreak } from './metrics';

import UAX14 from 'linebreak';
import Hypher from 'hypher';
import english from 'hyphenation.en-us';
const h = new Hypher(english);
import { INFINITY } from 'typeset';

const hyphenateLimitChars = 6;

export const OPEN_SCOPE = 0;
export const CLOSE_SCOPE = 1;

const EOL_GLUE = {
  Glue: true,
  width: 0,
  stretch: INFINITY,
  shrink: 0
};
const EOL_PENALTY = {
  Penalty: true,
  width: 0,
  penalty: -INFINITY,
  flagged: true
};

// The built in \s and \b character classes match a variety of non-breaking
// whitespace. Here we are interested specifically in breaking spaces
// without width semantics.
const glueRegex = /([\t\n\f\r ]*)([^\t\n\f\r ]*)/g;
// The control characters
// 
//   U+000B LINE TABULATION,
//   U+0085 NEXT LINE,
//   U+2028 LINE SEPARATOR,
// and
//   U+2029 PARAGRAPH SEPARATOR,
// 
// will not be consolidated into a glue run , but will survive until
// being parsed into a forced break by UAX 14.

export function buildPenaltyBox(rootNode, styles) {
  const stack = [];
  const penaltyBox = [];

  function recur(virtualDOMNode) {
    // could use `if (React.isValidElement(virtualDOMNode))` instead, for
    // maximum correctness.
    if (typeof virtualDOMNode !== 'string') { // recursive case
      // Open a new scope.
      stack.push(virtualDOMNode);
      penaltyBox.push(OPEN_SCOPE);
      // recur
      Children.forEach(virtualDOMNode.props.children, recur);
      // close scope
      penaltyBox.push(CLOSE_SCOPE);
      stack.pop();
    } else { // Base case: a text node.
      // obtain the font for this scope
      const container = stack[stack.length - 1];
      const style = styles[container.props.uniqueNodeId];

      const font = style.font ||
          // Gecko will not report a font shorthand string, so we'll build one
          // for it.
          `${style.fontStyle} ${style.fontVariant} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;

      const wordSpacing = style.wordSpacing === '0px' ?
        parseFloat(style.fontSize) / 4 :
        parseFloat(style.wordSpacing);

      const hyphens = style.hyphens ||
                      style.WebkitHyphens ||
                      style.MozHyphens ||
                      style.msHyphens ||
                      (container.props && container.props.style ? (
                        container.props.style.hyphens ||
                        container.props.style.WebkitHyphens ||
                        container.props.style.MozHyphens ||
                        container.props.style.msHyphens
                      ) : undefined);

      while(true) { // consolidate runs of glue and split.
        let [match, whitespace, string] = glueRegex.exec(virtualDOMNode);

        if (!match) break;
        
        if (whitespace) penaltyBox.push(glue(wordSpacing));

        if (string) {
          const string_length = string.length;
          // at this point `string` could contain a mix of printing characters,
          // spaces with width semantics, and non-breaking spaces. We apply
          // the unicode linebreaking algorithm.
          let breaker = new UAX14(string);
          let lastPosition = 0;
          // TODO: I wish this didn't allocate
          let bk = breaker.nextBreak();
          if (bk.position !== string_length) {
            // continue breaking using UAX 14 semantics

            while(true) {
              const fragment = string.slice(lastPosition, bk.position);
              lastPosition = bk.position;
              penaltyBox.push(box(font, fragment));
              const required = bk.required;
              bk = breaker.nextBreak();
              if (required) {
                penaltyBox.push(EOL_GLUE);
                penaltyBox.push(EOL_PENALTY);
              } else if (bk) {
                penaltyBox.push(freeBreak);
              } else {
                break;
              }
            }

          } else if (string_length >= hyphenateLimitChars) {
            // hyphenate
            // TODO: I wish this didn't allocate
            const syllables = hyphens === 'none' ? string :
                              hyphens === 'auto' ? h.hyphenate(string) :
                              string.split('\u00AD'); // SOFT HYPHEN
            for (let i = 0; i < syllables.length; i++) {
              const syllable = syllables[i];
              if (i !== 0) {
                penaltyBox.push(hyphen(font, syllable, syllables[i + 1]));
              }
              penaltyBox.push(box(font, syllable));
            }
          } else {
            // string is too short to hyphenate, push the complete string
            penaltyBox.push(box(font, string));
          }
        }
      }
      glueRegex.lastIndex = 0;
    }
  }
  recur(rootNode);
  penaltyBox.push(EOL_GLUE);
  penaltyBox.push(EOL_PENALTY);
  return penaltyBox;
}
