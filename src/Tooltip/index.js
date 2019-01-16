// @flow
import * as React from "react";
import styled, { css } from "styled-components";

import defaultTokens from "../defaultTokens";
import media from "../utils/mediaQuery";
import {
  ALIGNS,
  POSITIONS,
  SIZE_OPTIONS,
  TOOLTIP_ARROW_SIZE,
  TOOLTIP_TOTAL_PADDING,
} from "./consts";
import { StyledText } from "../Text";
import { Item } from "../List/ListItem";
import Portal from "../Portal";
import resolveContainerPosition from "./helpers/resolveContainerPosition";
import resolveContainerAlign from "./helpers/resolveContainerAlign";
import resolveTooltipArrowAlign from "./helpers/resolveTooltipArrowAlign";
import resolveTooltipArrowPosition from "./helpers/resolveTooltipArrowPosition";
import tooltipArrowStyle from "./helpers/tooltipArrowStyle";
import tooltipSize from "./helpers/tooltipSize";
import Button from "../Button";
import {
  isHorizontal,
  isPositionBottom,
  isPositionLeft,
  isPositionRight,
  isPositionTop,
  isVertical,
} from "./helpers/isPosition";
import { isAlignCenter, isAlignEnd, isAlignStart } from "./helpers/isAlign";
import { DEVICES } from "../utils/mediaQuery/consts";

import type { Props, State, Aligns, Positions } from "./index";

const StyledTooltipChildren = styled.span`
  ${({ block }) =>
    block &&
    css`
      display: block;
      width: 100%;
    `};
  &:focus {
    outline: none;
  }
`;

const StyledTooltip = styled.div`
  width: 100%;
`;

const StyledTooltipWrapper = styled.div`
  display: block;
  position: fixed;
  width: 100%;
  box-sizing: border-box;
  border-top-left-radius: 9px;
  border-top-right-radius: 9px;
  background-color: ${({ theme }) => theme.orbit.paletteWhite}; // TODO: use token backgroundTooltip
  box-shadow: ${({ theme }) => theme.orbit.boxShadowElevatedLevel1};
  padding: ${({ theme }) => theme.orbit.spaceMedium}; // TODO: create token paddingTooltip
  visibility: ${({ shownMobile }) => (shownMobile ? "visible" : "hidden")};
  opacity: ${({ shownMobile }) => (shownMobile ? "1" : "0")};
  transition: opacity ${({ theme }) => theme.orbit.durationFast} ease-in-out,
    visibility ${({ theme }) => theme.orbit.durationFast} ease-in-out;
  z-index: 3; // TODO: use some good value
  bottom: 0;
  left: 0;
  right: 0;
  
  ${media.largeMobile(css`
    width: ${tooltipSize};
    border-radius: ${({ theme }) => theme.orbit.borderRadiusNormal};
    padding: ${({ theme }) => theme.orbit.spaceSmall}; // TODO: create token paddingTooltip
    background-color: ${({ theme }) =>
      theme.orbit.paletteBlueDark}; // TODO: use token backgroundTooltip
    visibility: ${({ shown }) => (shown ? "visible" : "hidden")};
    opacity: ${({ shown }) => (shown ? "1" : "0")};

    // prevent position
    top: unset;
    right: unset;
    bottom: unset;
    left: unset;

    // tooltip positions
    ${resolveContainerPosition};
    ${resolveContainerAlign};
  `)};

  &::after {
    width: 0;
    height: 0;
    border-style: solid;
    content: " ";
    display: none;
    position: absolute;

    ${tooltipArrowStyle};
    
    ${resolveTooltipArrowPosition};
    ${resolveTooltipArrowAlign};
    
    ${media.largeMobile(css`
      display: block;
    `)};
      
`;

StyledTooltipWrapper.defaultProps = {
  theme: defaultTokens,
};

const StyledTooltipContent = styled.div`
  font-family: ${({ theme }) => theme.orbit.fontFamily};
  font-size: ${({ theme }) => theme.orbit.fontSizeTextNormal};
  font-weight: ${({ theme }) => theme.orbit.fontWeightNormal};
  line-height: ${({ theme }) => theme.orbit.lineHeightText};
  color: ${({ theme }) => theme.orbit.paletteInkNormal};
  margin-bottom: 16px;

  & ${StyledText}, ${Item} {
    font-size: ${({ theme }) => theme.orbit.fontSizeTextNormal};
    font-weight: ${({ theme }) => theme.orbit.fontWeightNormal};
    color: ${({ theme }) => theme.orbit.paletteInkNormal};
  }

  ${media.largeMobile(css`
    color: ${({ theme }) => theme.orbit.paletteWhite};
    font-size: ${({ theme }) => theme.orbit.fontSizeTextSmall};
    font-weight: ${({ theme }) => theme.orbit.fontWeightMedium};
    margin-bottom: 0;

    & ${StyledText}, ${Item} {
      color: ${({ theme }) => theme.orbit.paletteWhite};
      font-weight: ${({ theme }) => theme.orbit.fontWeightMedium};
    }
  `)};
`;

StyledTooltipContent.defaultProps = {
  theme: defaultTokens,
};

const StyledTooltipClose = styled.div`
  ${media.largeMobile(css`
    display: none;
    visibility: hidden;
  `)}
`;

StyledTooltipClose.defaultProps = {
  theme: defaultTokens,
};

const StyledTooltipOverlay = styled.div`
  position: fixed;
  display: ${({ shownMobile }) => (shownMobile ? "block" : "none")};
  width: 100%;
  height: 100%;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background-color: rgba(23, 27, 30, 0.6); // TODO: token
  z-index: 2; // TODO: use some good value
  opacity: ${({ shownMobile }) => (shownMobile ? "1" : "0")};
  transition: opacity ${({ theme }) => theme.orbit.durationFast} ease-in-out,
    display ${({ theme }) => theme.orbit.durationFast} linear
      ${({ theme }) => theme.orbit.durationFast};

  ${media.largeMobile(css`
    display: none;
    visibility: hidden;
  `)};
`;

StyledTooltipOverlay.defaultProps = {
  theme: defaultTokens,
};

class Tooltip extends React.PureComponent<Props, State> {
  state = {
    position: POSITIONS.RIGHT,
    align: ALIGNS.CENTER,
    shown: false,
    shownMobile: false,
  };

  getDimensions = () => {
    // maybe it can be statics not states
    if (this.container && this.tooltip && typeof window !== "undefined") {
      const containerDimensions = this.container.current.getBoundingClientRect();
      const tooltipDimensions = this.tooltip.current.getBoundingClientRect();

      // container positions and dimensions for calculation
      const containerTop = containerDimensions.top;
      const containerLeft = containerDimensions.left;
      const containerHeight = containerDimensions.height;
      const containerWidth = containerDimensions.width;

      // tooltip dimensions for calculation
      const tooltipHeight = tooltipDimensions.height;
      const tooltipWidth = tooltipDimensions.width;

      // window dimensions for calculation
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      this.containerTop = containerTop;
      this.containerLeft = containerLeft;
      this.containerHeight = containerHeight;
      this.containerWidth = containerWidth;
      this.tooltipHeight = tooltipHeight;
      this.tooltipWidth = tooltipWidth;
      this.windowWidth = windowWidth;
      this.windowHeight = windowHeight;
    }
  };

  setPosition = (desiredPositions: Positions[]) => {
    const {
      containerTop,
      containerLeft,
      containerHeight,
      containerWidth,
      tooltipWidth,
      tooltipHeight,
      windowWidth,
      windowHeight,
    } = this;

    const canBePositionLeft = containerLeft - tooltipWidth - TOOLTIP_ARROW_SIZE > 0;
    const canBePositionRight =
      containerLeft + containerWidth + tooltipWidth + TOOLTIP_ARROW_SIZE < windowWidth;
    const canBePositionTop = containerTop - tooltipHeight > 0;
    const canBePositionBottom = containerTop + containerHeight + tooltipHeight < windowHeight;

    // returns the position name if the position can be set
    const isInside = (p: Positions) => {
      if (isPositionTop(p) && canBePositionTop) {
        return POSITIONS.TOP;
      } else if (isPositionRight(p) && canBePositionRight) {
        return POSITIONS.RIGHT;
      } else if (isPositionBottom(p) && canBePositionBottom) {
        return POSITIONS.BOTTOM;
      } else if (isPositionLeft(p) && canBePositionLeft) {
        return POSITIONS.LEFT;
      }
      return false;
    };

    const possiblePositions = desiredPositions
      .map(p => isInside(p))
      // filter all non string values
      .filter(p => typeof p === "string");

    // set the first valid position
    // ordering in POSITIONS const is important
    const position = possiblePositions[0];
    if (typeof position === "string" && this.state.position !== position) {
      this.setState({ position });
      this.setAlign(position);
    }
  };

  setAlign = (position: Positions) => {
    const {
      containerLeft,
      containerTop,
      containerHeight,
      containerWidth,
      tooltipWidth,
      tooltipHeight,
      windowWidth,
      windowHeight,
    } = this;

    const canBeVerticalStart =
      containerLeft + containerWidth / 2 - TOOLTIP_TOTAL_PADDING > 0 &&
      containerLeft + containerWidth / 2 - TOOLTIP_TOTAL_PADDING + tooltipWidth < windowWidth;
    const canBeVerticalCenter =
      containerLeft + containerWidth / 2 - tooltipWidth / 2 > 0 &&
      containerLeft + containerWidth / 2 + tooltipWidth / 2 < windowWidth;
    const canBeVerticalEnd =
      containerLeft + containerWidth + TOOLTIP_TOTAL_PADDING < windowWidth &&
      containerLeft + containerWidth / 2 + TOOLTIP_TOTAL_PADDING - tooltipWidth > 0;

    const canBeHorizontalStart =
      containerTop + containerHeight / 2 - TOOLTIP_TOTAL_PADDING > 0 &&
      containerTop + containerHeight / 2 + (tooltipHeight - TOOLTIP_TOTAL_PADDING) < windowHeight;
    const canBeHorizontalCenter =
      containerTop + containerHeight / 2 - tooltipHeight / 2 > 0 &&
      containerTop + containerHeight / 2 + tooltipHeight / 2 < windowHeight;
    const canBeHorizontalEnd =
      containerTop + containerHeight + TOOLTIP_TOTAL_PADDING - tooltipHeight > 0 &&
      containerTop + containerHeight / 2 + TOOLTIP_TOTAL_PADDING < windowHeight;

    const isInside = (p: Positions, a: Aligns) => {
      if (isVertical(p)) {
        if (isAlignStart(a) && canBeVerticalStart) {
          return ALIGNS.START;
        } else if (isAlignCenter(a) && canBeVerticalCenter) {
          return ALIGNS.CENTER;
        } else if (isAlignEnd(a) && canBeVerticalEnd) {
          return ALIGNS.END;
        }
      } else if (isHorizontal(p)) {
        if (isAlignStart(a) && canBeHorizontalStart) {
          return ALIGNS.START;
        } else if (isAlignCenter(a) && canBeHorizontalCenter) {
          return ALIGNS.CENTER;
        } else if (isAlignEnd(a) && canBeHorizontalEnd) {
          return ALIGNS.END;
        }
      }
      return false;
    };

    const getAlign = (p: Positions) =>
      // https://github.com/facebook/flow/issues/2221
      Object.keys(ALIGNS)
        .map(a => isInside(p, ALIGNS[a]))
        // filter all non string values
        .filter(a => typeof a === "string");
    const possibleAligns = getAlign(position);
    if (
      possibleAligns.length > 0 &&
      typeof possibleAligns[0] === "string" &&
      this.state.align !== possibleAligns[0]
    ) {
      this.setState({ align: possibleAligns[0] });
    }
  };

  handleIn = () => {
    this.getDimensions();
    // https://github.com/facebook/flow/issues/2221
    this.setPosition(Object.keys(POSITIONS).map(k => POSITIONS[k]));
    this.setState({ shown: true });
  };

  handleOut = () => {
    this.setState({ shown: false });
  };

  handleOpen = () => {
    this.getDimensions();
    if (this.windowWidth <= DEVICES.largeMobile) {
      this.setState({ shownMobile: true });
    }
  };

  handleClose = () => {
    this.setState({ shownMobile: false });
  };

  container: { current: any | HTMLDivElement } = React.createRef();
  tooltip: { current: any | HTMLDivElement } = React.createRef();

  containerTop: number = 0;
  containerLeft: number = 0;
  containerHeight: number = 0;
  containerWidth: number = 0;
  tooltipWidth: number = 0;
  tooltipHeight: number = 0;
  windowWidth: number = 0;
  windowHeight: number = 0;

  render() {
    const {
      content,
      children,
      block = false,
      size = SIZE_OPTIONS.SMALL,
      closeText = "Close",
    } = this.props;
    const { shown, shownMobile, position, align } = this.state;
    const {
      containerTop,
      containerLeft,
      containerHeight,
      containerWidth,
      tooltipHeight,
      tooltipWidth,
    } = this;

    return (
      <React.Fragment>
        <StyledTooltipChildren
          onClick={this.handleOpen}
          onMouseEnter={this.handleIn}
          onMouseLeave={this.handleOut}
          onFocus={this.handleIn}
          onBlur={this.handleOut}
          ref={this.container}
          block={block}
        >
          {children}
        </StyledTooltipChildren>
        <Portal element="tooltips">
          <StyledTooltip role="tooltip">
            <StyledTooltipOverlay onClick={this.handleClose} shownMobile={shownMobile} />
            <StyledTooltipWrapper
              shown={shown}
              shownMobile={shownMobile}
              position={position}
              align={align}
              size={size}
              ref={this.tooltip}
              onMouseEnter={this.handleIn}
              onMouseLeave={this.handleOut}
              containerTop={containerTop}
              containerLeft={containerLeft}
              containerHeight={containerHeight}
              containerWidth={containerWidth}
              tooltipHeight={tooltipHeight}
              tooltipWidth={tooltipWidth}
            >
              <StyledTooltipContent>{content}</StyledTooltipContent>
              <StyledTooltipClose>
                <Button type="secondary" block onClick={this.handleClose}>
                  {closeText}
                </Button>
              </StyledTooltipClose>
            </StyledTooltipWrapper>
          </StyledTooltip>
        </Portal>
      </React.Fragment>
    );
  }
}

export default Tooltip;
