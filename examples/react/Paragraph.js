// © 2015 April Arcus

import React, { PropTypes, Component, Children, cloneElement } from 'react';
import { linebreak } from 'typeset';

import decorateTree from './decorateTree';
import { childrenEqual, shallowEqual } from './equality'
import buildPenaltyBox from './buildPenaltyBox';

export class Paragraph extends Component {

  constructor(props) {
    super();
    this.updateComputedStyle = this.updateComputedStyle.bind(this);
    this.updateComputedWidth = this.updateComputedWidth.bind(this);
    this.renderWithBreaks = this.renderWithBreaks.bind(this);

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
    // prop, so now we consider the case in which props.children passes the
    // deep equality test, but props.style does not.
    } else if (!shallowEqual(props.style, nextProps.style)) {

      // This saves the work of redecorating the tree by updating the style of
      // its root node in place.

      // This time we don't need to explicitly invalidate the penalty box
      // or breaks because we have determiend that no text nodes have changed,
      // and we know that componentDidUpdate() will check to see if any
      // relevant styles have changed in DOM land.

      const { virtualDOMNodes, rootId } = this.state.decoratedTree;
      virtualDOMNodes[rootId] = cloneElement(
        virtualDOMNodes[rootId], { style: nextProps.style }
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
    // don't need to consider the case where cachedStyles[rootId] === undefined
    const { rootId, computedStyles } = this.decoratedTree;
    const rootStyles = cachedStyles[rootId];
    const { width } = computedStyles[rootId];
    if (rootStyles.width !== width) {
      rootStyles.width = width;
      rootStyles.parsedWidth = parseFloat(width);
      // because this is being fired by a callback, I can't be 100% sure that
      // it will not happen in between componentWillReceiveProps() unsetting
      // this.penaltyBox and componentDidUpdate() recomputing it. THe guard
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
    const { cachedStyles } = this;
    const { rootId, length, computedStyles, virtualDOMNodes } =
      this.decoratedTree;

    for (let id = rootId; id < length; id++) {
      const previous = cachedStyles[id];
      const next = computedStyles[id];
      const { fontStyle, fontVariant, fontWeight, fontSize, fontFamily } =
        next;
      if (!previous ||
          previous.fontStyle   !== fontStyle   ||
          previous.fontVariant !== fontVariant ||
          previous.fontWeight  !== fontWeight  ||
          previous.fontSize    !== fontSize    ||
          previous.fontFamily  !== fontFamily) {
        penaltyBoxIsOutdated = true;
        cachedStyles[id] = {
          fontStyle,
          fontVariant,
          fontWeight,
          fontSize,
          fontFamily,
          // Gecko will not report a font shorthand string, so we'll help
          // it out. We omit lineHeight because Canvas will ignore it anyway
          // (see buildPenaltyBox.js and measureText.js for implementation
          // details)
          font: next.font || `${fontStyle} ${fontVariant} ${fontWeight} ${fontSize} ${fontFamily}`
        }
      }
    }

    const rootStyles = cachedStyles[rootId];
    const { textAlign, textIndent, lineHeight, width } =
      computedStyles[rootId];

    if (rootStyles.textAlign !== textAlign) {
      penaltyBoxIsOutdated = true;
      rootStyles.textAlign = textAlign;
    }
    if (rootStyles.textIndent !== textIndent) {
      penaltyBoxIsOutdated = true;
      rootStyles.textIndent = textIndent;
      rootStyles.parsedTextIndent = parseFloat(textIndent);
    }

    // if there have been any changes to the inline fonts, we must
    // rebuild the nodes object with appropriate measurements.
    // likewise if the penaltyBox has been wiped out by incoming children in
    // componentWillReceiveProps()
    if (penaltyBoxIsOutdated) this.penaltyBox =
      buildPenaltyBox(virtualDOMNodes[rootId], computedStyles);
    
    let breaksAreOutdated = this.breaks === undefined;

    if (rootStyles.width !== width) {
      rootStyles.width = width;
      rootStyles.parsedWidth = parseFloat(width);
      breaksAreOutdated = true;
    }

    if (penaltyBoxIsOutdated || breaksAreOutdated) {
      this.breaks = linebreak(this.penaltyBox, [rootStyles.parsedWidth]);
      this.forceUpdate();
    }

    // check for styles that don't impact linebreaking but require a
    // redraw anyway
    if (rootStyles.lineHeight !== lineHeight) {
      rootStyles.lineHeight = lineHeight;
      // blink will report lineHeight as 'normal' in computed styles
      // instead of a calculated value in px.
      rootStyles.parsedLineHeight = (lineHeight === 'normal') ?
        parseFloat(next.fontSize) * 1.14 :
        parseFloat(lineHeight);

      this.forceUpdate();
    }

  }

  renderWithBreaks() {

    const { penaltyBox, decoratedTree } = this;

    let i = 0;
    let lineNumber = 0;
    let x = 0;
    let y = 0;

    function recur() {
      const node = decoratedTree.virtualDOMNodes[penaltyBox[i]];
      i++;
      const children = [];
      const counter = {};
      while (i < penaltyBox.length) {
        const e = penaltyBox[i];
        if (typeof e === 'number' && e !== -1) {
          children.push(recur());
        } else {
          i++;
          if (e === -1) {
            let key = node.type;
            counter[key] = counter[key] || 0; key += counter[key]++;
            return cloneElement(node, {key}, children);
          } else if (e.Box) {
            let key = e.value;
            counter[key] = counter[key] || 0; key += counter[key]++;
            children.push(<span key={key}>{e.value}</span>);
          } else if (e.Glue) {
            let key = ' ';
            counter[key] = counter[key] || 0; key += counter[key]++;
            children.push(<span key={key}>{' '}</span>);
          }
        }
      }

    }
    // console.log(decoratedTree.virtualDOMNodes[decoratedTree.rootId]);
    return recur();

    // console.log(this.breaks);
    return decoratedTree.virtualDOMNodes[decoratedTree.rootId];
  }

  render() {
    if (this.breaks) {
      console.log('rendering breaks')
      return this.renderWithBreaks();
    } else {
      console.log('rendering decorated tree')
      return this.decoratedTree.virtualDOMNodes[this.decoratedTree.rootId];
    }
  }

}

Paragraph.propTypes = {
  poll: PropTypes.bool
};
