const context = document.createElement('canvas').getContext('2d');

const glues = {};
export function glue(font) {
  const cached = glues[font];
  if (cached) return cached;
  context.font = font;
  const width = context.measureText('\xA0').width;
  const glue = {
    Glue: true,
    width: width,
    stretch: width * (3 / 6),
    shrink: width * (3 / 9)
  };
  glues[font] = glue;
  return glue;
}

const boxes = {};
export function box(font, text) {
  let boxes_font = boxes[font];
  if (!boxes_font) {
    boxes_font = {};
    boxes[font] = boxes_font;
  }
  const boxes_font_text = boxes_font[text];
  if (boxes_font_text) return boxes_font_text;
  context.font = font;
  const box = {
    Box: true,
    width: context.measureText(text).width,
    value: text
  };
  boxes_font[text] = box;
  return box;
}

const penalties = {};
export function penalty(font, syllable1, syllable2) {
  let fontSet = false;
  let penalties_font = penalties[font];
  if (!penalties_font) {
    context.font = font;
    fontSet = true;
    penalties_font = {
      width: context.measureText('-').width,
      memos: {}
    };
    penalties[font] = penalties_font;
  }
  const penalties_font_memos = penalties_font.memos;
  let penalties_font_memos_syllable1 = penalties_font_memos[syllable1];
  if (!penalties_font_memos_syllable1) {
    penalties_font_memos_syllable1 = {
      width: context.measureText(syllable1).width,
      kerns: {}
    };
    penalties_font_memos[syllable1] = penalties_font_memos_syllable1;
  }
  const penalties_font_memos_syllable1_kerns =
    penalties_font_memos_syllable1.kerns;
  const penalties_font_memos_syllable1_kerns_syllable2 =
    penalties_font_memos_syllable1_kerns[syllable2];
  if (penalties_font_memos_syllable1_kerns_syllable2) {
    return penalties_font_memos_syllable1_kerns_syllable2;
  }
  if (!fontSet) context.font = font;
  const penalty = {
    Penalty: true,
    width: penalties_font.width,
    kern: context.measureText(syllable1 + syllable2).width -
            (penalties_font_memos_syllable1.width +
              context.measureText(syllable2).width),
    flagged: true
  };
  penalties_font_memos_syllable1_kerns[syllable2] = penalty;
  return penalty;
}
