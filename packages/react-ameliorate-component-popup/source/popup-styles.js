import { createStyleSheet } from '@react-ameliorate/styles';

export default createStyleSheet(function(theme) {
  const ARROW_SIZE = theme.DEFAULT_PADDING * 0.45,
        ARROW_SIZE_HALF = ARROW_SIZE * 0.5,
        POPUP_COLOR = theme.GREY02_COLOR,
        ARROW_COLOR = POPUP_COLOR;

  return {
    container: {
      backgroundColor: 'transparent'
    },
    containerRight: {
      paddingLeft: ARROW_SIZE_HALF
    },
    containerLeft: {
      paddingRight: ARROW_SIZE_HALF
    },
    containerTop: {
      paddingBottom: ARROW_SIZE_HALF
    },
    containerBottom: {
      paddingTop: ARROW_SIZE_HALF
    },
    innerContainer: {
      overflow: 'hidden',
      borderRadius: theme.DEFAULT_BORDER_RADIUS,
      padding: theme.DEFAULT_PADDING * 0.2,
      backgroundColor: POPUP_COLOR
    },
    arrow: {
      position: 'absolute',
      backgroundColor: 'transparent',
      borderLeftColor: 'transparent',
      borderRightColor: 'transparent',
      borderBottomColor: 'transparent',
      borderTopColor: 'transparent',
      borderWidth: ARROW_SIZE_HALF,
      borderStyle: 'solid',
      width: ARROW_SIZE,
      height: ARROW_SIZE
    },
    arrowHCenter: {
      left: '50%',
      transform: [
        {
          translateX: '-50%'
        }
      ]
    },
    arrowHLeft: {
      left: theme.DEFAULT_BORDER_RADIUS,
    },
    arrowHRight: {
      right: theme.DEFAULT_BORDER_RADIUS,
    },
    arrowVCenter: {
      top: '50%',
      transform: [
        {
          translateY: '-50%'
        }
      ]
    },
    arrowVTop: {
      top: theme.DEFAULT_BORDER_RADIUS,
    },
    arrowVBottom: {
      bottom: theme.DEFAULT_BORDER_RADIUS,
    },
    arrowDown: {
      bottom: -ARROW_SIZE_HALF,
      borderTopColor: ARROW_COLOR
    },
    arrowUp: {
      top: -ARROW_SIZE_HALF,
      borderBottomColor: ARROW_COLOR
    },
    arrowLeft: {
      left: -ARROW_SIZE_HALF,
      borderRightColor: ARROW_COLOR
    },
    arrowRight: {
      right: -ARROW_SIZE_HALF,
      borderLeftColor: ARROW_COLOR
    }
  };
});
