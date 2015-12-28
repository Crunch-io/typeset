import React, { Children, cloneElement } from 'react';
import { OPEN_SCOPE, CLOSE_SCOPE } from './buildPenaltyBox';

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

const word = {

  continuation: false,
  value: '',
  empty: true,
  key: null,
  left: null,
  top: null,
  
  continue(syllable, key, left, top) {
    this.empty = false;
    this.value += syllable;
    if (this.key === null) this.key = key;
    if (this.left === null) this.left = left;
    if (this.top === null) this.top = top;
  },

  reset() {
    this.value = '';
    this.empty = true;
    this.key = null;
    this.left = null;
    this.top = null;
  },

  print({continuation, value, key, left, top}) {
    return (
      <span key={`${continuation ? 'c' : 'w'}${key}`}
            style={
              {
                position: 'absolute',
                left,
                top,
                textDecoration: 'inherit',
                hyphens: 'none',
                WebkitHyphens: 'none',
                MozHyphens: 'none',
                msHyphens: 'none',
                wordBreak: 'keep-all'
              }}>
        {value}
      </span>
    );
  },

  break() {
    const saved = {...this};
    this.reset();
    this.continuation = true;
    return this.print(saved);
  },

  complete() {
    const saved = {...this};
    this.reset();
    this.continuation = false;
    return this.print(saved);
  }

}

export default function(penaltyBox, decoratedTree, breaks, cachedStyles) {
  const { tree, computedStyles } = decoratedTree;
  const { positions, ratios } = breaks;
  const rootStyles = cachedStyles[0];
  const fontSize = rootStyles.parsedFontSize;
  const lineHeight = rootStyles.parsedLineHeight;

  let line = 0;
  let breakIndex = positions[line];
  let ratio = ratios[line];
  let left = 0;
  let top = 0;

  let i = 1;

  return (function recur(node, cursor, children, counter, fontSize, key) {

    while (i < penaltyBox.length) {
      if (i > breakIndex) {

        line += 1;
        breakIndex = positions[line];
        ratio = ratios[line];
        left = 0;
        top += lineHeight;

        if (!word.empty) children.push(word.break());

      }

      const e = penaltyBox[i++];

      if (!word.empty && !(e.Penalty || e.Box)) children.push(word.complete());

      if (e === OPEN_SCOPE) {
        const count = Children.count(node.props.children);
        let nextNode;
        if (count === 1) {
          nextNode = node.props.children;
        } else {
          do {
            nextNode = node.props.children[cursor];
            cursor++;
          } while (typeof nextNode !== 'object')
        }
        children.push(
          recur(
            nextNode,
            0,
            [],
            new Counter(),
            cachedStyles[nextNode.props.uniqueNodeId].parsedFontSize,
            `t${nextNode.type}${counter.count(nextNode.type)}`
          )
        );
      } else if (e === CLOSE_SCOPE) {
        const nodeType = node.type;
        return cloneElement(
          node,
          key ?
            { key } :
            {
              style: {
                position: computedStyles[0].position === 'static' ?
                  'relative' :
                  computedStyles[0].position,
                ...node.props.style
              }
            },
          children
        );
      }
      else if (e.Box) {
        word.continue(
          e.value,
          `${e.value}${counter.count(e.value)}`,
          left,
          top + (rootStyles.parsedFontSize - fontSize)
        );
        left += e.width;
      } else if (e.Glue) {

        // children.push(
        //   <span key={' ' + counter.count(' ')}
        //         style={{position: 'absolute', left, top}}>
        //     {' '}
        //   </span>
        // );

        left += e.width + ratio * (ratio < 0 ? e.shrink : e.stretch);
      } else if (e.Penalty) {
        if (i === breakIndex + 1) {

          word.value += e.value + '\u007F';

        }
      }
    }
  })(tree, 0, [], new Counter(), fontSize, undefined);

  // const stack = [{
  //   node: tree,
  //   cursor: 0,
  //   children: [],
  //   counter: new Counter(),
  //   fontSize
  // }];
  // let thisFrame = stack[0];

  // for (let i = 1; i < penaltyBox.length; i++) {
  //   const e = penaltyBox[i];

  //   if (i > breakIndex) {

  //     line += 1;
  //     breakIndex = positions[line];
  //     ratio = ratios[line];
  //     left = 0;
  //     top += lineHeight;

  //     if (!word.empty) thisFrame.children.push(word.break());

  //   }

  //   if (!word.empty && !(e.Penalty || e.Box)) thisFrame.children.push(word.complete());

  //   if (e === OPEN_SCOPE) {
  //     const children = thisFrame.node.props.children;
  //     const count = Children.count(children);

  //     let nextNode;
  //     if (count === 1) {
  //       nextNode = children;
  //     } else {
  //       do {
  //         nextNode = children[thisFrame.cursor];
  //         thisFrame.cursor++;
  //       } while (typeof nextNode !== 'object')
  //     }

  //     thisFrame = {
  //       node: nextNode,
  //       cursor: 0,
  //       children: [], 
  //       counter: new Counter(),
  //       fontSize: cachedStyles[nextNode.props.uniqueNodeId].parsedFontSize
  //     };

  //     stack.push(thisFrame);

  //   } else if (e === CLOSE_SCOPE) {

  //     const completedFrame = stack.pop();
  //     thisFrame = stack[stack.length - 1];

  //     if (thisFrame) {

  //       const nodeType = completedFrame.node.type;

  //       thisFrame.children.push(
  //         cloneElement(
  //           completedFrame.node,
  //           { key: `t${nodeType}${thisFrame.counter.count(nodeType)}` },
  //           completedFrame.children
  //         )
  //       );

  //     } else {

  //       const { position } = computedStyles[0];

  //       return (
  //         cloneElement(
  //           tree,
  //           {
  //             style: {
  //               position: position === 'static' ? 'relative' : position,
  //               ...tree.props.style
  //             }
  //           },
  //           completedFrame.children
  //         )
  //       );

  //     }

  //   } else if (e.Box) {

  //     const { counter } = thisFrame;
  //     word.continue(
  //       e.value,
  //       `${e.value}${counter.count(e.value)}`,
  //       left,
  //       top + (fontSize - thisFrame.fontSize)
  //     );
  //     left += e.width

  //   } else if (e.Glue) {

  //     const { children, counter } = thisFrame;

  //     children.push(
  //       <span key={' ' + counter.count(' ')}
  //             style={{position: 'absolute', left, top}}>
  //         {' '}
  //       </span>
  //     );

  //     left += e.width + ratio * (ratio < 0 ? e.shrink : e.stretch);

  //   } else if (e.Penalty) {

  //     if (i === breakIndex) {

  //       word.value += e.value + '\u007F';

  //     }

  //   }

  // }

}

document.addEventListener('copy', (event) => {
  event.clipboardData.setData(
    'text/plain',
    window.getSelection().toString()
  );
  event.preventDefault();
});
