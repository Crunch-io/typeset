import measureText from './measureText';

const glues = {};
export const glue = (width) => {

  // Original Version

  if (!glues[width]) {
    glues[width] = {
      Glue: true,
      width,
      stretch: width * (3 / 6),
      shrink: width * (3 / 9)
    };
  }
  return glues[width];

  // Optimized to cache property access

  // const cached = glues[font];
  // if (cached) return cached;
  // const width = measureText(font, '\xA0');
  // const glue = {
  //   Glue: true,
  //   width: width,
  //   stretch: width * (3 / 6),
  //   shrink: width * (3 / 9)
  // };
  // glues[font] = glue;
  // return glue;
}

const boxes = {};
export const box = (font, text) => {

  // Original version

  if (!boxes[font]) boxes[font] = {};
  if (!boxes[font][text]) {
    boxes[font][text] = {
      Box: true,
      width: measureText(font, text),
      value: text
    };
  }
  return boxes[font][text];

  // Optimized to cache property access

  // let boxes_font = boxes[font];
  // if (!boxes_font) {
  //   boxes_font = {};
  //   boxes[font] = boxes_font;
  // }
  // const boxes_font_text = boxes_font[text];
  // if (boxes_font_text) return boxes_font_text;
  // const box = {
  //   Box: true,
  //   width: measureText(font, text),
  //   value: text
  // };
  // boxes_font[text] = box;
  // return box;
}

const penalties = {};
export const hyphen = (font, syllable1, syllable2) => {

  // Original version

  if (!penalties[font]) {
    penalties[font] = {
      width: measureText(font, '-'),
      memos: {}
    };
  }
  if (!penalties[font].memos[syllable1]) {
    penalties[font].memos[syllable1] = {
      width: measureText(font, syllable1),
      kerns: {}
    };
  }
  if (!penalties[font].memos[syllable1].kerns[syllable2]) {
    penalties[font].memos[syllable1].kerns[syllable2] = {
      Penalty: true,
      penalty: 100,
      value: '-',
      width: penalties[font].width,
      kern: measureText(font, syllable1 + syllable2) - (
        penalties[font].memos[syllable1].width + measureText(font, syllable2)
      ),
      flagged: true
    };
  }
  return penalties[font].memos[syllable1].kerns[syllable2];

  // Optimized to cache property access

  // let penalties_font = penalties[font];
  // if (!penalties_font) {
  //   penalties_font = {
  //     width: measureText(font, '-'),
  //     memos: {}
  //   };
  //   penalties[font] = penalties_font;
  // }
  // const penalties_font_memos = penalties_font.memos;
  // let penalties_font_memos_syllable1 = penalties_font_memos[syllable1];
  // if (!penalties_font_memos_syllable1) {
  //   penalties_font_memos_syllable1 = {
  //     width: measureText(font, syllable1),
  //     kerns: {}
  //   };
  //   penalties_font_memos[syllable1] = penalties_font_memos_syllable1;
  // }
  // const penalties_font_memos_syllable1_kerns =
  //   penalties_font_memos_syllable1.kerns;
  // const penalties_font_memos_syllable1_kerns_syllable2 =
  //   penalties_font_memos_syllable1_kerns[syllable2];
  // if (penalties_font_memos_syllable1_kerns_syllable2) {
  //   return penalties_font_memos_syllable1_kerns_syllable2;
  // }
  // const penalty = {
  //   Penalty: true,
  //   penalty: 100,
  //   value: '-',
  //   width: penalties_font.width,
  //   kern: measureText(font, syllable1 + syllable2) -
  //           (penalties_font_memos_syllable1.width +
  //            measureText(font, syllable2)),
  //   flagged: true
  // };
  // penalties_font_memos_syllable1_kerns[syllable2] = penalty;
  // return penalty;
}

export const freeBreak = {
  Penalty: true,
  penalty: 0,
  value: '',
  width: 0,
  kern: 0,
  flagged: false,
}
