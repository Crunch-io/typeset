import { Children } from 'react';
const hasOwnProperty = Object.prototype.hasOwnProperty;

export function propsEqual(a, b) {
  const aKeys = Object.keys(a);
  const aKeys_length = aKeys.length;
  const bKeys = Object.keys(b);
  if (aKeys_length !== bKeys.length) return false;
  const bHasOwnProperty = hasOwnProperty.bind(b);
  for (let i = 0; i < aKeys_length; i++) {
    const key = aKeys[i];
    if (key === 'style' || key === 'children') continue;
    if (!bHasOwnProperty(key) || a[key] !== b[key]) return false;
  }
  return true;
}

export function shallowEqual(a, b) {
  if (a || b) {
    if (!(a && b)) return false;
    const aKeys = Object.keys(a);
    const aKeys_length = aKeys.length;
    const bKeys = Object.keys(b);
    if (aKeys_length !== bKeys.length) return false;
    const bHasOwnProperty = hasOwnProperty.bind(b);
    for (let i = 0; i < aKeys_length; i++) {
      const key = aKeys[i];
      if (!bHasOwnProperty(key) || b[key] !== a[key]) return false;
    }
  }
  return true;
}

export function nodesEqual(a, b) {
  const typeA = typeof a;
  if (typeA !== typeof b) return false;
  if (typeA === 'string') return a === b;
  const a_props = a.props;
  const b_props = b.props;
  if (!propsEqual(a_props, b_props)) return false;
  if (!shallowEqual(a_props.style, b_props.style)) return false;
  return childrenEqual(a_props.children, b_props.children);
}

export function childrenEqual(a_children, b_children) {
  const a_children_count = Children.count(a_children);
  if (a_children_count !== Children.count(b_children)) return false;
  if (a_children_count === 1) return nodesEqual(a_children, b_children);
  for (let i = 0; i < a_children_count; i++) {
    if (!nodesEqual(a_children[i], b_children[i])) return false;
  }
  return true;
  // return a_children.every((a_child, i) => nodesEqual(a_child, b_children[i]));
}