// © 2015 April Arcus
import React, { PropTypes, Component, cloneElement } from 'react';
import { linebreak } from 'typeset';

import decorateTree from './decorateTree';
import { childrenEqual, shallowEqual } from './equality'
import { buildPenaltyBox } from './buildPenaltyBox';
import renderWithBreaks from './render';

export class Paragraph extends Component {

  constructor(props) {
    super();
    this.updateComputedStyle = this.updateComputedStyle.bind(this);
    this.updateComputedWidth = this.updateComputedWidth.bind(this);

    // Efficient linebreaking requires caching a variety of intermediate
    // results from relatively expensive functions.

    // this.decoratedTree stores the result of a call to decorateTree()
    // It is O(n) in time and space. We set it whenever
    // componentWillReceiveProps(nextProps) discovers that
    // this.props.children and nextProps.children fail a deep equality test.
    // It is crucial to re-render after such a failure so that we can
    // reconstruct new refs and fetch current style information from the DOM.
    this.decoratedTree = decorateTree(<p {...props} />);

    // this.penaltyBox stores the result of a call to buildPenaltyBox(). It is
    // only O(n) in time and space but performs a number of expensive, blocking
    // calls to CanvasRenderingContext2D#measureText(). To be logically
    // consistent it should live in this.state, but in practice whenever we
    // calculate a new penaltyBox, we calculate a new set of breaks immediately
    // afterwards and want this value to be available synchronously.
    this.penaltyBox = undefined;

    // this.breaks stores the result of a call to Typeset.linebreak().
    // This is O(n^2) in time and can fail(!).
    //
    // This can be re-used between renders when e.g. the lineHeight or color
    // of the containing div changes.
    this.breaks = undefined;

    this.cachedStyles = [];

    this.requestID = undefined;
  }

  componentDidMount() {
    this.updateComputedStyle();
    if (!this.props.poll) {
      window.addEventListener('resize', this.updateComputedWidth);
    }
  }

  componentWillReceiveProps(nextProps) {
    const { props } = this;
    if (!childrenEqual(props.children, nextProps.children)) {

      this.decoratedTree = decorateTree(<p {...nextProps} />);
      this.penaltyBox = undefined;
      this.breaks = undefined;
      this.forceUpdate();
      // after we render the new tree with its refs, componentDidUpdate() will
      // call updateComputedStyles(), notice that penaltyBox has been unset,
      // recompute it and reflow the text.

    // transferring nextProps above covers the possibility of an updated style
    // prop, so now we consider the case in which props.children has passed the
    // equality test, but props.style has not.
    } else if (!shallowEqual(props.style, nextProps.style)) {

      // This saves the work of redecorating the tree by updating the style of
      // its root node in place.

      // This time we don't need to explicitly invalidate the penalty box
      // or breaks because we have determiend that no text nodes have changed,
      // and we know that componentDidUpdate() will check to see if any
      // relevant styles have changed in DOM land.

      this.decoratedTree.tree = cloneElement(
        this.decoratedTree.tree, { style: nextProps.style }
      );
      this.forceUpdate();

    }

    // changes to props.poll are handled by adjusting callbacks on window,
    // and don't require a re-render.
    if (!props.poll && nextProps.poll) {
      this.requestID = window.requestAnimationFrame(this.updateComputedStyle);
      window.removeEventListener('resize', this.updateComputedWidth);
    }
    if (props.poll && !nextProps.poll) {
      this.requestID = window.cancelAnimationFrame(this.requestID);
      window.addEventListener('resize', this.updateComputedWidth);
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    // because we do not use this.state, and handle all changes to incoming
    // props in componentWillReceiveProps, we can always
    return false;
  }

  componentDidUpdate() {
    if (!this.props.poll) this.updateComputedStyle();
  }

  componentWillUnmount() {
    if (this.props.poll) {
      window.cancelAnimationFrame(this.requestID);
    } else {
      window.removeEventListener('resize', this.updateComputedWidth);
    }
  }

  updateComputedWidth(event) {
    // updateComputedWidth() will only ever be called after componentDidMount()
    // has populated cachedStyles by calling updateComputedStyles(), so we
    // don't need to consider the case where cachedStyles[0] === undefined
    const rootStyles = this.cachedStyles[0];
    const { width } = this.computedStyles[0];
    if (rootStyles.width !== width) {
      rootStyles.width = width;
      rootStyles.parsedWidth = parseFloat(width);
      // because this is being fired by a callback, I can't be 100% sure that
      // it will not happen in between componentWillReceiveProps() unsetting
      // this.penaltyBox and componentDidUpdate() recomputing it. The guard
      // ensures that if we get caught with our pants down, it's a no-op.
      if (this.penaltyBox) this.breaks =
        linebreak(this.penaltyBox, [rootStyles.parsedWidth]);
      this.forceUpdate();
    }
  }

  updateComputedStyle(DOMHighResTimeStamp) {
    if (this.props.poll) this.requestID =
      window.requestAnimationFrame(this.updateComputedStyle);

    let penaltyBoxIsOutdated = this.penaltyBox === undefined;

    // update inline font descriptors
    const { cachedStyles, containerStyles } = this;
    const { length, computedStyles, tree } = this.decoratedTree;

    for (let id = 0; id < length; id++) {
      if (cachedStyles[id] === undefined) cachedStyles[id] = {};
      const cached = cachedStyles[id];
      const {
        fontStyle,
        fontVariant,
        fontWeight,
        fontSize,
        fontFamily,
        wordSpacing,
        hyphens,
        WebkitHyphens,
        MozHyphens,
        msHyphens
      } = computedStyles[id];
      if (cached.fontStyle !== fontStyle) {
        penaltyBoxIsOutdated = true;
        cached.fontStyle = fontStyle;
      }
      if (cached.fontVariant !== fontVariant) {
        penaltyBoxIsOutdated = true;
        cached.fontVariant = fontVariant;
      }
      if (cached.fontWeight !== fontWeight) {
        penaltyBoxIsOutdated = true;
        cached.fontWeight = fontWeight;
      }
      if (cached.fontSize !== fontSize) {
        penaltyBoxIsOutdated = true;
        cached.fontSize = fontSize;
        cached.parsedFontSize = parseFloat(fontSize);
      }
      if (cached.fontFamily !== fontFamily) {
        penaltyBoxIsOutdated = true;
        cached.fontFamily = fontFamily;
      }
      if (cached.wordSpacing !== wordSpacing) {
        penaltyBoxIsOutdated = true;
        cached.wordSpacing = wordSpacing;
      }
      if (cached.hyphens !== hyphens) {
        penaltyBoxIsOutdated = true;
        cached.hyphens = hyphens;
      }
      if (cached.WebkitHyphens !== WebkitHyphens) {
        penaltyBoxIsOutdated = true;
        cached.WebkitHyphens = WebkitHyphens;
      }
      if (cached.MozHyphens !== MozHyphens) {
        penaltyBoxIsOutdated = true;
        cached.MozHyphens = MozHyphens;
      }
      if (cached.msHyphens !== msHyphens) {
        penaltyBoxIsOutdated = true;
        cached.msHyphens = msHyphens;
      }
    }

    const cached = cachedStyles[0];
    const {
      textAlign,
      textIndent,
      fontSize,
      lineHeight,
      width
    } = computedStyles[0];

    if (cached.textAlign !== textAlign) {
      penaltyBoxIsOutdated = true;
      cached.textAlign = textAlign;
    }
    if (cached.textIndent !== textIndent) {
      penaltyBoxIsOutdated = true;
      cached.textIndent = textIndent;
      cached.parsedTextIndent = parseFloat(textIndent);
    }

    // if there have been any changes to the inline fonts, we must
    // rebuild the nodes object with appropriate measurements.
    // likewise if the penaltyBox has been wiped out by incoming children in
    // componentWillReceiveProps()
    if (penaltyBoxIsOutdated) this.penaltyBox =
      buildPenaltyBox(tree, computedStyles);
    
    let breaksAreOutdated = this.breaks === undefined;

    if (cached.width !== width) {
      cached.width = width;
      cached.parsedWidth = parseFloat(width);
      breaksAreOutdated = true;
    }

    if (penaltyBoxIsOutdated || breaksAreOutdated) {
      this.breaks = linebreak(this.penaltyBox, [cached.parsedWidth], {tolerance: 2});
      this.forceUpdate();
    }

    // check for styles that don't impact linebreaking but require a
    // redraw anyway
    if (cached.lineHeight !== lineHeight) {
      cached.lineHeight = lineHeight;
      // blink will report lineHeight as 'normal' in computed styles
      // instead of a calculated value in px.
      cached.parsedLineHeight = (lineHeight === 'normal') ?
        cached.parsedFontSize * 1.14 :
        parseFloat(lineHeight);

      this.forceUpdate();
    }

  }

  render() {
    const { breaks, penaltyBox, decoratedTree, cachedStyles } = this;
    if (breaks && !breaks.error) {
      // console.log('rendering breaks')
      return renderWithBreaks(
        penaltyBox,
        decoratedTree,
        breaks,
        cachedStyles
      );
    } else {
      // console.log('rendering decorated tree')
      return decoratedTree.tree;
    }

  }

}

Paragraph.propTypes = {
  poll: PropTypes.bool
};
