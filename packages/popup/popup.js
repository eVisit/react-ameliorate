import React                            from 'react';
import { componentFactory, PropTypes }  from '@base';
import { capitalize }                   from '@base/utils';
import { View }                         from '../view';
import { Paper }                        from '../paper';
import styleSheet                       from './popup-styles';

const Popup = componentFactory('Popup', ({ Parent, componentName }) => {
  return class Popup extends Parent {
    static styleSheet = styleSheet;
    static propTypes = Paper.propTypes;

    resolveState() {
      return {
        ...super.resolveState.apply(this, arguments),
        ...this.getState({
          sideX: '',
          sideY: '',
          hasArrow: false
        })
      };
    }

    onMounted(args) {
      if (this.callProvidedCallback('onMounted', args) === false)
        return false;

      var { position } = args;
      if (!position || !position.side)
        return;

      var sideX = position.side[0] || '',
          sideY = position.side[1] || '',
          hasArrow = (!sideX || !sideY);

      this.setState({
        sideX: (hasArrow) ? capitalize(sideX) : '',
        sideY: (hasArrow) ? capitalize(sideY) : '',
        hasArrow
      });
    }

    render(children) {
      var { sideX, sideY, hasArrow } = this.getState();

      // TODO: Add arrow

      return super.render(
        <Paper {...this.props} id={this.props.id} onMounted={this.onMounted} className={this.getRootClassName(componentName)}>
          <View style={this.style('container', `container${sideX}`, `container${sideY}`)}>
            <View style={this.style('innerContainer', `innerContainer${sideX}`, `innerContainer${sideY}`)}>
              {this.getChildren(children)}
            </View>

            {/* TODO: Arrow for popups
              <View style={this.style('arrow', `arrow${side}`)}/>
             */}
          </View>
        </Paper>
      );
    }
  };
});

export { Popup };