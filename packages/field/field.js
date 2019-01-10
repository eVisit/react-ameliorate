import { utils as U, validators }       from 'evisit-js-utils';
import React                            from 'react';
import { componentFactory, PropTypes }  from '@base';
import { View }                         from '../view';
import styleSheet                       from './field-styles';
import { Hoverable }                    from '@mixins/hoverable';

const Field = componentFactory('Field', ({ Parent, componentName }) => {
  return class Field extends Parent {
    static styleSheet = styleSheet;

    static propTypes = {
      style: PropTypes.any,
      defaultValue: PropTypes.any,
      value: PropTypes.any,
      field: PropTypes.string,
      caption: PropTypes.string,
      validate: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
      onFocus: PropTypes.func,
      onBlur: PropTypes.func,
      onChange: PropTypes.func,
      onValueChange: PropTypes.func,
      onFormatValue: PropTypes.func,
      options: PropTypes.oneOfType([
        PropTypes.arrayOf(PropTypes.shape({
          caption: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.bool, PropTypes.func]),
          value: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.bool, PropTypes.func])
        })),
        PropTypes.arrayOf(PropTypes.string),
        PropTypes.arrayOf(PropTypes.number),
        PropTypes.arrayOf(PropTypes.bool),
        PropTypes.object,
        PropTypes.func
      ]),
      optionMatcher: PropTypes.func,
      maxOptions: PropTypes.number,
      fieldState: PropTypes.number,
      skipFormRegistration: PropTypes.bool
    }

    onPropUpdated_options(value) {
      if (typeof value === 'function')
        return this.setState({ options: [] });

      this.setState({ options: this.formatOptions((value == null) ? [] : value) });
    }

    onPropUpdated_value() {
      this.setState({ value: this.getDefaultValue() });
    }

    onPropUpdated_defaultValue() {
      this.setState({ value: this.getDefaultValue() });
    }

    componentDidMount() {
      super.componentDidMount();

      if (this.props.skipFormRegistration)
        return;

      var parentForm = this.getParentForm();
      if (parentForm)
        parentForm.registerField(this);
    }

    componentWillUnmount() {
      super.componentWillUnmount();

      var parentForm = this.getParentForm();
      if (parentForm)
        parentForm.unregisterField(this);
    }

    getParentForm() {
      return this.context._raParentForm;
    }

    getParentField() {
      return this.context._raParentField;
    }

    provideContext() {
      return {
        _raParentField: this
      };
    }

    getFieldID() {
      return this.getComponentID();
    }

    // Force "value", "field", and "caption" to "resolve" if they are functions
    getResolvableProps(...args) {
      return super.getResolvableProps({ value: true, field: true, caption: true }, ...args);
    }

    resolveProps(props, prevProps, extraProps) {
      var props = super.resolveProps(props, prevProps, extraProps);
      if (props.field == null)
        props.field = ('' + props.caption).replace(/\W+/g, '_').toLowerCase();

      props.caption = U.prettify(props.caption, true);

      return props;
    }

    resolveState({ props }) {
      return {
        ...super.resolveState.apply(this, arguments),
        ...this.getState({
          value: this.getDefaultValue(props),
          errorMessage: null,
          options: [],
          filteredOptions: null
        })
      };
    }

    _formatValue(currentValue, newValue, op, opts) {
      var formatterArgs = Object.assign({}, this.getState(), {
        currentValue,
        newValue
      }, (opts || {}), this.getComponentFlagsAsObject());

      return this.formatValue(currentValue, newValue, op, formatterArgs);
    }

    formatValue(currentValue, newValue, op, args) {
      var formatterFunc = this.getProvidedCallback('onFormatValue');
      if (typeof formatterFunc !== 'function')
        return newValue;

      return formatterFunc(newValue, op, args);
    }

    getDefaultValue(_props) {
      var props = _props || this.props,
          value = props.defaultValue;

      if (props.value !== undefined)
        value = props.value;

      var currentValue = this.getState('value');
      if (currentValue === undefined)
        currentValue = null;

      if (value === undefined)
        value = null;

      value = this._formatValue(currentValue, value, 'unformat');

      return (value === undefined) ? null : value;
    }

    setErrorState(message) {
      this.setComponentFlagsFromObject({ error: (message != null) });
      this.setState({ errorMessage: message });
    }

    // Called every time the value is set, but only when it is set by the user
    onChange({ event, value }) {
      this.setErrorState(null);
      return this.callProvidedCallback('onChange', { event, value });
    }

    // Called every time the value is set
    onValueChange({ event, value }) {
      return this.callProvidedCallback('onValueChange', { event, value });
    }

    onFocus({ event }) {
      this.setCurrentlyFocussedField(this);
      this.setComponentFlagsFromObject({ focus: true });

      // Run formatters
      this.value(this.value());

      this.callProvidedCallback('onFocus', { event, value: this.value() });
    }

    onBlur({ event }) {
      if (this.getCurrentlyFocussedField() === this)
        this.setCurrentlyFocussedField(null);

      this.setComponentFlagsFromObject({ focus: false });

      // Run formatters
      this.value(this.value());

      this.callProvidedCallback('onBlur', { event, value: this.value() });
    }

    value(_set, opts = {}) {
      var set = _set,
          value = this.getState('value'),
          formatType = opts.format;

      if (value === undefined)
        value = null;

      // set is undefined, so this is actually a get
      if (set === undefined)
        return (formatType) ? this._formatValue(value, value, formatType, opts) : value;

      var oldValue = value;

      // Unformat (get the raw value) the value and call event callbacks
      value = this._formatValue(value, set, (formatType) ? formatType : 'unformat', opts);
      if (value === undefined)
        value = null;

      if (oldValue !== value) {
        if (opts.userInitiated)
          this.onChange({ event: opts.event, value, _value: oldValue });

        this.onValueChange({ event: opts.event, value, _value: oldValue });

        this.setState({ value });
      }

      return value;
    }

    async validate(_value, args) {
      var validate = this.props.validate;
      if (!validate)
        return;

      var value = _value;
      if (value === undefined)
        value = this.value();

      var validatorFunc = validators.validatorFunction(validate),
          validatorArgs = Object.assign({}, this.getState(), {
            props: this.props,
            component: this,
            validator: validatorFunc,
            value
          }, (args || {})),
          ret;

      try {
        ret = await validatorFunc.call(this, value, 'validate', validatorArgs);
      } catch (e) {
        var thisError = e.error || e;
        ret = Object.assign({ type: 'error', message: thisError.message }, thisError);
        this.setErrorState(ret.message);
      }

      return ret;
    }

    areSame(field) {
      return (field === this || (field && field.getFieldID() === this.getFieldID()));
    }

    getNativeFieldReference() {
      return this._nativeFieldReference;
    }

    setNativeFieldReference(_reference) {
      var reference = ((_reference && _reference.reference) || _reference);
      this._nativeFieldReference = reference;
      this.callProvidedCallback('inputRef', { reference });
    }

    focus() {
      var field = this.getNativeFieldReference();
      if (this.callProvidedCallback('onFocus', { field }) === false)
        return false;

      if (field && typeof field.focus === 'function')
        field.focus();

      return true;
    }

    blur() {
      var field = this.getNativeFieldReference();
      if (this.callProvidedCallback('onBlur', { field }) === false)
        return false;

      if (field && typeof field.blur === 'function')
        field.blur();

      return true;
    }

    onSubmitEditing({ event }) {
      var value = this.value();

      if (this.callProvidedCallback('onSubmit', { event, value }) === false)
        return;

      var parentForm = this.getParentForm();
      if (parentForm && typeof parentForm.focusNext === 'function')
        parentForm.focusNext(this);
    }

    getAllOptions() {
      return this.getState('options', this.props.options);
    }

    getOptionByIndex(index, _options) {
      var options = (_options) ? _options : this.getAllOptions();
      if (options == null)
        return;

      return options[index];
    }

    getOptionIndex(option, _options) {
      var options = (_options) ? _options : this.getAllOptions();
      if (!options)
        return;

      if (!(options instanceof Array))
        return (options.hasOwnProperty(option)) ? option : undefined;

      for (var i = 0, il = options.length; i < il; i++) {
        var thisOption = options[i];
        if (option === thisOption || (thisOption && thisOption.value === option))
          return i;
      }
    }

    getOption(option, _options) {
      var options = (_options) ? _options : this.getAllOptions(),
          index = this.getOptionIndex(option, options);

      if (index == null)
        return;

      var foundOption = this.getOptionByIndex(index, options);
      if (foundOption == null)
        return;

      return {
        option: foundOption,
        index,
        options
      };
    }

    getOptionCaption(_option, _options) {
      var option = this.getOption(_option, _options);
      if (option == null)
        return '';

      var thisOption = option.option,
          caption = this.callProvidedCallback('getOptionCaption', option, thisOption.caption || thisOption);

      return (caption == null) ? '' : ('' + caption);
    }

    getSelectedOptionCaption() {
      return this.getOptionCaption(this.value());
    }

    iterateOptions(cb, _config) {
      const abort = () => abort;

      var config = _config || {},
          options = config.options,
          maxOptions = config.maxOptions;

      if (!options)
        options = this.getState('filteredOptions');

      if (U.noe(options))
        options = this.getAllOptions();

      if (!options)
        return;

      var rets    = [],
          keys    = Object.keys(options),
          isArray = (options instanceof Array);

      for (var i = 0, il = keys.length; i < il; i++) {
        if (maxOptions != null && isFinite(maxOptions) && i >= maxOptions)
          break;

        var key     = keys[i],
            option  = (isArray) ? options[key] : key,
            value   = (isArray) ? option : key,
            caption = this.getOptionCaption(option, options),
            ret = cb.call(this, { caption, value: (value && value.value) || value }, i, abort);

        if (ret === abort)
          break;

        rets.push(ret);
      }

      return rets;
    }

    async fetchOptions(_searchStr) {
      const searchStr = (_searchStr || '').toLowerCase();

      try {
        if (typeof this.props.options === 'function') {
          var options = await this.props.options(searchStr);
          this.setState({ options });
          return options;
        }

        if (U.noe(searchStr))
          return this.getAllOptions();

        var items = this.iterateOptions((option, index) => {
          var caption = option.caption.toLowerCase();

          if (typeof this.props.optionMatcher === 'function') {
            if (this.props.optionMatcher(option, index))
              return option;

            return;
          }

          if (caption.indexOf(searchStr) >= 0)
            return option;
        }, { options: this.props.options }).filter(Boolean);

        return items;
      } catch (e) {
        return [];
      }
    }

    formatOptions(options) {
      if (options == null)
        return [];

      if (U.instanceOf(options, 'string', 'boolean', 'number'))
        return [options];

      return options;
    }

    async filterOptions(_searchStr) {
      this.setState({ waiting: true });

      var searchStr = _searchStr || '',
          options = this.formatOptions(await this.fetchOptions(searchStr));

        if (U.noe(options))
          options = undefined;

      this.callProvidedCallback('onOptionsFetched', { searchStr, options });
      this.setState({ waiting: false, filteredOptions: options, focussedOption: null, hoveredOption: null });
    }

    getSelectedOptionContainerRef() {
      return this.selectedOptionContainerRef;
    }

    setSelectedOptionContainerRef(elem) {
      this.selectedOptionContainerRef = elem;
    }

    render(children) {
      var flags = this.getComponentFlagsAsObject();

      return (
        <View
          className={this.getRootClassName(componentName, flags)}
          style={this.style('rootContainer', this.props.style)}
          onMouseOver={this.onMouseOver}
          onMouseOut={this.onMouseOut}
          tooltip={this.props.tooltip}
          tooltip-side={this.props.tooltipSide || 'bottom'}
        >
          {this.getChildren(children)}
        </View>
      );
    }

    getCaption() {
      return this.props.caption;
    }

    getField() {
      return this.props.field;
    }
  };
}, { mixins: [ Hoverable ] });

export { Field };