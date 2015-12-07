import { Children, cloneElement } from 'react';

const ROOT_NODE_ID = 0;

export default function decorateVirtualDOMTreeWithRefs(rootNode) {
  const computedStyles = [];
  const virtualDOMNodes = [];
  let i = ROOT_NODE_ID; // wide scope

  function recur(virtualDOMNode) {
    if (typeof virtualDOMNode === 'string') return virtualDOMNode;
    const uniqueNodeId = i++; // side effect
    const decoratedVirtualDOMNode = cloneElement(
      virtualDOMNode,
      {
        ...virtualDOMNode.props,
        uniqueNodeId,
        ref: element => computedStyles[uniqueNodeId] = window.getComputedStyle(element)
      },
      Children.map(virtualDOMNode.props.children, recur)
    );
    virtualDOMNodes[uniqueNodeId] = decoratedVirtualDOMNode;
    return decoratedVirtualDOMNode;
  }

  const decoratedNode = recur(rootNode);
  return {
    rootId: ROOT_NODE_ID,
    length: i,
    computedStyles,
    virtualDOMNodes
  };
}
