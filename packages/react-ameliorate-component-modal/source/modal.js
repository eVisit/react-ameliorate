import React                            from 'react';
import { componentFactory, PropTypes }  from '@react-ameliorate/core';
import { View }                         from '@react-ameliorate/native-shims';
import { Paper }                        from '@react-ameliorate/component-paper';
import styleSheet                       from './modal-styles';

export const Modal = componentFactory('Modal', ({ Parent, componentName }) => {
  return class Modal extends Parent {
    static styleSheet = styleSheet;
    static propTypes = [Paper.propTypes, {
      autoClose: PropTypes.bool,
      disallowReposition: PropTypes.bool,
      inline: PropTypes.bool,
      calculateParentContainerStyle: PropTypes.func
    }];

    static defaultProps = {
      autoClose: true
    };

    constructor(...args) {
      super(...args);

      Object.defineProperties(this, {
        '_closing': {
          writable: true,
          enumerable: false,
          configurable: true,
          value: false
        }
      });
    }

    provideContext() {
      var parentContext = (typeof super.provideContext === 'function') ? super.provideContext.apply(this, arguments) : {};

      return {
        ...parentContext,
        masterLayoutContext: 'modal'
      };
    }

    componentUmounting() {
      this._closing = true;
      this.callProvidedCallback('onClose', { event: null, result: -2 });
    }

    async close(_args) {
      if (this._closing)
        return;

      var args = _args || {};

      this._closing = true;

      var result = await this.callProvidedCallback((args.eventName) ? args.eventName : 'onClose', args);
      if (result === false) {
        this._closing = false;
        return false;
      }

      this.setState({ visible: false });

      return result;
    }

    resolveState() {
      return {
        ...super.resolveState.apply(this, arguments),
        ...this.getState({
          visible: true
        })
      };
    }

    renderModal(children) {
      return (
        <View className={this.getRootClassName(componentName)} style={this.style('container', this.props.style, (!this.props.disallowReposition) ? this.getState('modalPositionStyle') : null)}>
          {this.getChildren(children)}
        </View>
      );
    }

    render(children) {
      if (this.props.inline === true && !this.getState('visible'))
          return super.render(null);

      if (this.context._raModalManager || this.props.inline === true)
        return super.render(this.renderModal(children));

      return super.render(
        <Paper
          {...this.passProps(this.props)}
          id={this.props.id}
          className={this.getRootClassName(componentName)}
        >
          {this.renderModal(children)}
        </Paper>
      );
    }
  };
});

export { styleSheet as modalStyles };
