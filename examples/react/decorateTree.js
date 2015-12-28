import { Children, cloneElement } from 'react';

export default function(rootNode) {
  const computedStyles = [];
  let i = 0; // wide scope

  function recur(node) {
    if (typeof node === 'string') return node;

    const uniqueNodeId = i;
    i++; // side effect

    const decoratedVirtualDOMNode = cloneElement(
      node,
      {
        ...node.props,
        uniqueNodeId,
        key: uniqueNodeId,
        ref: element => {
          if (element) computedStyles[uniqueNodeId] = window.getComputedStyle(element)
        }
      },
      Children.map(node.props.children, recur)
    );
    return decoratedVirtualDOMNode;
  }

  const decoratedNode = recur(rootNode);
  return {
    length: i,
    computedStyles,
    tree: decoratedNode
  };
}
