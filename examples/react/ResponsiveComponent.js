import React, { PropTypes, Component } from 'react';

function styleEqual(objA, objB) {
  if (!objA) return false;
  for (let key in objA) if (objA[key] !== objB[key]) return false;
  return true;
}

export class ResponsiveComponent extends Component {

  constructor() {
    super();
    this.updateComputedStyle = this.updateComputedStyle.bind(this);
    this.state = { computedStyle: undefined };
    this.requestID = undefined;
  }

  updateComputedStyle() {
    const { computedStyle } = this.state;
    const nextComputedStyle = { ...getComputedStyle(this.refs.me) };

    if (!styleEqual(computedStyle, nextComputedStyle)) {
      this.setState({ computedStyle: nextComputedStyle });
    }
    if (this.props.responsive) {
      this.requestID =
        requestAnimationFrame(this.updateComputedStyle);
    } else {
      cancelAnimationFrame(this.requestID);
      this.requestID = undefined;
    }
  }

  componentDidMount() {
    this.updateComputedStyle();
  }

  componentDidUpdate() {
    if (!this.requestID) this.updateComputedStyle();
  }

  renderWithoutComputedStyle() {
    return 'Default';
  }

  renderWithComputedStyle(computedStyle) {
    return computedStyle.width;
  }

  render() {
    const { computedStyle } = this.state;
    return (
      <p ref="me">
        {computedStyle ?
          this.renderWithComputedStyle(computedStyle) :
          this.renderWithoutComputedStyle()}
      </p>
    );
  }

}

ResponsiveComponent.propTypes = {
  responsive: PropTypes.bool
};
