// © 2015 April Arcus

class Counter {

  constructor() {
    this.bag = {};
  }

  count(string) {
    var bag = this.bag;
    bag[string] = bag[string] || 0;
    var count = bag[string];
    bag[string] = bag[string] + 1;
    return count;
  }

}


import React, { PropTypes, Component, Children, cloneElement } from 'react';
import { linebreak } from 'typeset';

import decorateTree from './decorateTree';
import { childrenEqual, shallowEqual } from './equality'
import { buildPenaltyBox, OPEN_SCOPE, CLOSE_SCOPE } from './buildPenaltyBox';

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
    const { width } = this.containerStyles;
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
    const { cachedStyles, containerStyles } = this;
    const { length, computedStyles, tree } = this.decoratedTree;

    for (let id = 0; id < length; id++) {
      if (cachedStyles[id] === undefined) cachedStyles[id] = {};
      const cached = cachedStyles[id];
      const next = computedStyles[id];
      const { fontStyle, fontVariant, fontWeight, fontSize, fontFamily } =
        next;
      let dirty = false;
      if (cached.fontStyle !== fontStyle) {
        dirty = true;
        cached.fontStyle = fontStyle
      }
      if (cached.fontVariant !== fontVariant) {
        dirty = true;
        cached.fontVariant = fontVariant;
      }
      if (cached.fontWeight !== fontWeight) {
        dirty = true;
        cached.fontWeight = fontWeight;
      }
      if (cached.fontSize !== fontSize) {
        dirty = true;
        cached.fontSize = fontSize;
        cached.parsedFontSize = parseFloat(fontSize);
      }
      if (cached.fontFamily !== fontFamily) {
        dirty = true;
        cached.fontFamily = fontFamily;
      }
      if (dirty === true) {
        penaltyBoxIsOutdated = true;
        // Gecko will not report a font shorthand string, so we'll help
        // it out. We omit lineHeight because Canvas will ignore it anyway
        // (see buildPenaltyBox.js and measureText.js for implementation
        // details)
        cached.font = next.font ||
          `${fontStyle} ${fontVariant} ${fontWeight} ${fontSize} ${fontFamily}`
      }
    }

    const rootStyles = cachedStyles[0];
    const { textAlign, textIndent, fontSize, lineHeight } = computedStyles[0];
    const { width } = containerStyles;

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
      buildPenaltyBox(tree, computedStyles);
    
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
        rootStyles.parsedFontSize * 1.14 :
        parseFloat(lineHeight);

      this.forceUpdate();
    }

  }

  renderWithBreaks() {
    const {
      penaltyBox,
      decoratedTree,
      cachedStyles,
      breaks: {
        positions,
        ratios
      }
    } = this;

    const { parsedFontSize, parsedLineHeight } = cachedStyles[0];
    let line = 0;
    let x = 0;
    // const halfLeading = (parsedLineHeight - parsedFontSize) / 2
    // let y = parsedFontSize + halfLeading - (parsedFontSize * 0.2)
    // simplifies to:
    let y = parsedFontSize * 0.3 + parsedLineHeight * 0.5;

    const stack = [{
      node: decoratedTree.tree,
      cursor: 0,
      children: [],
      counter: new Counter()
    }];
    console.log(positions);

    let breakIndex = positions[line];
    let ratio = ratios[line];
    for (let i = 1; i < penaltyBox.length; i++) {
      if (i > breakIndex) {
        line += 1;
        breakIndex = positions[line];
        ratio = ratios[line];
        x = 0;
        y += parsedLineHeight;
      }

      const e = penaltyBox[i];
      if (e === OPEN_SCOPE) {
        const thisFrame = stack[stack.length - 1];

        const children = thisFrame.node.props.children;
        const count = Children.count(children);

        let nextNode;
        if (count === 1) {
          nextNode = children;
        } else {
          do {
            nextNode = children[thisFrame.cursor];
            thisFrame.cursor++;
          } while (typeof nextNode !== 'object')
        }

        const nextFrame = {
          node: nextNode,
          cursor: 0,
          children: [], 
          counter: new Counter()
        };



      } else if (e === CLOSE_SCOPE) {

        const thisFrame = stack.pop();

        if (stack.length !== 0) {
          const lastFrame = stack[stack.length - 1];

          let key = thisFrame.node.type;
          key += lastFrame.counter.count(key);

          lastFrame.children.push(
            <tspan key={key}
                   style={{...cachedStyles[thisFrame.node.props.uniqueNodeId]}}>
              {thisFrame.children}
            </tspan>
          );
        } else {
          return (
            <text style={{...cachedStyles[0]}}>
              {thisFrame.children}
            </text>
          );
        }

      } else {
        if (e.Penalty) continue;
        const { counter, children } = stack[stack.length - 1];

        const textNode = e.Box ? e.value : ' ';
        let key = textNode;
        key += counter.count(key);

        children.push(
          <tspan key={key}
                 x={x}
                 y={y}>
            {textNode}
          </tspan>
        );

        x += e.width;
        if (e.Glue) x += ratio * (ratio < 0 ? e.shrink : e.stretch);

      }
    }
  }

  render() {
    const rootStyles = this.decoratedTree.computedStyles[0];
    return (
      <div ref={element => {
        // Okay, this is weird. I wrap the decorated tree in a div with
        // {display: none} to suppress visual presentation of the original
        // markup but leave it in place in the DOM so that
        // updateComputedStyles() can check on its computed styles during
        // requestAnimationFrame (this lets us monitor and respond to CSS
        // animations which are otherwise invisible to us in JavaScript).
        // However, {display: none} prevents the DOM from calculating a width
        // for the decorated tree's container element. Therefore, we monitor
        // the width on this container element instead, propagating any inline
        // width styles forward, if we find them.
        //
        // TODO: The guard clause on this ref callback seems to be necessary in
        // Chrome and Firefox, but not in Safari. Investigate.
        if (element) {
          this.containerStyles = window.getComputedStyle(element);
        }
      }}
           style={
            this.props.style && this.props.style.width ?
              {width: this.props.style.width} :
              {}
      }>
        <div style={
          // TODO: Not sure why I can't use this conditional to switch the
          // value between 'none' and 'normal'.
          (this.breaks && !this.breaks.error) ? {display: 'none'} : {}
        }>
          {
            this.breaks && this.breaks.error &&
            <div style={
              {
                fontFamily: 'monospace',
                backgroundColor: 'red'
              }
            }>
              {this.breaks.error.message}
            </div>
          }
          { this.decoratedTree.tree }
        </div>
        {
          this.breaks && !this.breaks.error &&
          <svg style={
            {
              width: rootStyles.width === 'auto' ? '100%' : rootStyles.width,
              height: this.cachedStyles[0].parsedLineHeight * this.breaks.positions.length,
              marginTop: rootStyles.marginTop,
              marginRight: rootStyles.marginRight,
              marginBottom: rootStyles.marginBottom,
              marginLeft: rootStyles.marginLeft,
              borderTop: rootStyles.borderTop,
              borderRight: rootStyles.borderRight,
              borderBottom: rootStyles.borderBottom,
              borderLeft: rootStyles.borderLeft,
              paddingTop: rootStyles.paddingTop,
              paddingRight: rootStyles.paddingRight,
              paddingBottom: rootStyles.paddingBottom,
              paddingLeft: rootStyles.paddingLeft
            }
          }>
            { this.renderWithBreaks() }
          </svg>
        }
      </div>
    );
    // if (this.breaks) {
    //   console.log('rendering breaks')
    //   return this.renderWithBreaks();
    // } else {
    //   console.log('rendering decorated tree')
    //   return this.decoratedTree.tree;
    // }
  }

}

Paragraph.propTypes = {
  poll: PropTypes.bool
};
