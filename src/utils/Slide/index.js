// @flow
import React from "react";
import styled from "styled-components";

import defaultTheme from "../../defaultTheme";

import type { Props, State } from "./index";

const getMaxHeight = ({ maxHeight }) => {
  if (maxHeight === 0) return `0px`;
  if (!maxHeight) return undefined;
  return `${maxHeight}px`;
};

export const StyledSlide = styled.div`
  width: 100%;
  max-height: ${getMaxHeight};
  ${({ expanded }) => !expanded && `overflow: hidden`};
  transition: max-height ${({ theme }) => theme.orbit.durationFast} linear;
`;

StyledSlide.defaultProps = {
  theme: defaultTheme,
};

class Slide extends React.Component<Props, State> {
  state = {
    maxHeight: 0,
  };

  componentDidMount() {
    this.setMaxHeight();
  }

  componentDidUpdate(prevProps: Props, prevState: State, snapshot: null | true) {
    if (snapshot) {
      if (this.props.expanded) {
        this.setMaxHeight();
        this.expandTimeout = setTimeout(this.expandCallback, 150);
      } else {
        if (this.state.maxHeight !== this.props.maxHeight) {
          this.setMaxHeight();
        }
        this.collapseTimeout = setTimeout(this.collapseCallback, 1);
      }
    }
  }

  componentWillUnmount() {
    if (typeof clearTimeout === "function") {
      if (this.expandTimeout) {
        clearTimeout(this.expandTimeout);
      }
      if (this.collapseTimeout) {
        clearTimeout(this.collapseTimeout);
      }
    }
  }

  getSnapshotBeforeUpdate(prevProps: Props) {
    if (this.props.expanded === prevProps.expanded) return null;
    return true;
  }

  setMaxHeight = () => {
    const { maxHeight } = this.props;
    this.setState({
      maxHeight,
    });
  };

  expandCallback = () => {
    this.setState({
      maxHeight: null,
    });
  };

  collapseCallback = () => {
    this.setState({
      maxHeight: 0,
    });
  };

  expandTimeout: TimeoutID;

  collapseTimeout: TimeoutID;

  render() {
    const { children, expanded = false } = this.props;

    return (
      <StyledSlide maxHeight={this.state.maxHeight} expanded={expanded} aria-hidden={expanded}>
        {children}
      </StyledSlide>
    );
  }
}

export default Slide;
