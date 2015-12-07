import { Children } from 'react';
import { glue, box, penalty } from './measureText';

import UAX14 from 'linebreak';
import Hypher from 'hypher';
import english from 'hyphenation.en-us';
const h = new Hypher(english);
import { INFINITY } from 'typeset';

const hyphenateLimitChars = 6;

const CLOSE_SCOPE = -1;

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

export default function buildPenaltyBox(rootNode, styles) {
  const stack = [];
  const penaltyBox = [];

  function recur(virtualDOMNode) {
    // could use `if (React.isValidElement(virtualDOMNode))` instead, for
    // maximum correctness.
    if (typeof virtualDOMNode !== 'string') { // recursive case
      const { uniqueNodeId, children } = virtualDOMNode.props;
      // Open a new scope.
      stack.push(uniqueNodeId);
      // We're going to do a stupid weak-typing trick here and push the vDOM
      // node ID into the penalty box to mark the opening of a new scope. The
      // linebreaking algorithm will just ignore this node, and we'll use it
      // when it's time to fold the penalty box back up into a vDOM tree.
      //
      // TODO: Make this type safe
      penaltyBox.push(uniqueNodeId);
      // recur
      Children.forEach(children, recur);
      // close scope
      penaltyBox.push(CLOSE_SCOPE);
      stack.pop();
    } else { // Base case: a text node.
      // obtain the font for this scope
      const container = stack[stack.length - 1];
      const font = styles[container].font;

      while(true) { // consolidate runs of glue and split.
        let [match, whitespace, string] = glueRegex.exec(virtualDOMNode);

        if (!match) break;
        
        if (whitespace) penaltyBox.push(glue(font));

        if (string) {
          const string_length = string.length;
          // at this point `string` could contain a mix of printing characters,
          // spaces with width semantics, and non-breaking spaces. We apply
          // the unicode linebreaking algorithm.
          let breaker = new UAX14(string);
          let lastBreakPosition = 0;
          // TODO: I wish this didn't allocate
          let bk = breaker.nextBreak();
          if (bk.position !== string_length) {
            // continue breaking using UAX 14 semantics
            do {
              const fragment = string.slice(lastBreakPosition, bk.position);
              lastBreakPosition = bk.position;
              penaltyBox.push(box(font, fragment));
              if (bk.required) {
                penaltyBox.push(EOL_GLUE);
                penaltyBox.push(EOL_PENALTY);
              }
            } while (bk = breaker.nextBreak())
          } else if (string_length >= hyphenateLimitChars) {
            // hyphenate
            // TODO: I wish this didn't allocate
            const syllables = h.hyphenate(string);
            const syllables_length = syllables.length;
            for (let syllable_index = 0;
                 syllable_index < syllables_length;
                 syllable_index++) {
              const syllable = syllables[syllable_index];
              // push each syllable
              penaltyBox.push(box(font, syllable));
              if (syllable_index !== syllables_length - 1) {
                penaltyBox.push(penalty(font, syllable, syllables[syllable_index + 1]));
              }
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
  console.log(penaltyBox);
  return penaltyBox;
}
