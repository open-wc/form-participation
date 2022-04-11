import { Constructor, CustomValidityState, FormControlInterface, FormValue, IControlHost, Validator } from './types';

export function FormControlMixin<
  TBase extends Constructor<HTMLElement & IControlHost> & { observedAttributes?: string [] }
>(SuperClass: TBase) {
  class FormControl extends SuperClass {
    /** Wires up control instances to be form associated */
    static get formAssociated(): boolean {
      return true;
    }

    /**
     * A list of Validator objects that will be evaluated when a control's form
     * value is modified or optionally when a given attribute changes.
     *
     * When a Validator's callback returns false, the entire form control will
     * be set to an invalid state.
     */
    declare static formControlValidators: Validator[];

     /**
     * If set to true the control described should be evaluated and validated
     * as part of a group. Like a radio, if any member of the group's validity
     * changes the the other members should update as well.
     */
    declare static formControlValidationGroup: boolean;

    private static get validators(): Validator[] {
      return this.formControlValidators || [];
    }

    /**
     * Allows the FormControl instance to respond to Validator attributes.
     * For instance, if a given Validator has a `required` attribute, that
     * validator will be evaluated whenever the host's required attribute
     * is updated.
     */
     static get observedAttributes(): string[] {
      const validatorAttributes = this.validators.map((validator) => validator.attribute);

      const observedAttributes = super.observedAttributes || [];

      /** Make sure there are no duplicates inside the attributes list */
      const attributeSet = new Set([...observedAttributes, ...validatorAttributes]);
      return [...attributeSet] as string[];
    }

    /**
     * Return the validator associated with a given attribute. If no
     * Validator is associated with the attribute, it will return null.
     */
    static getValidator(attribute: string): Validator | null {
      return this.validators.find((validator) => validator.attribute === attribute) || null;
    }

    /** The ElementInternals instance for the control. */
    internals = this.attachInternals();

    /**
     * Keep track of if the control has focus
     * @private
     */
    #focused = false;

    /**
     * Exists to control when an error should be displayed
     * @private
     */
    #forceError = false;

    /**
     * Toggles to true whenever the element has been focused. This property
     * will reset whenever the control's formResetCallback is called.
     * @private
     */
    #touched = false;

    /** All of the controls within a root with a matching local name and form name */
    get #formValidationGroup(): NodeListOf<FormControl> {
      const rootNode = this.getRootNode() as HTMLElement;
      const selector = `${this.localName}[name="${this.getAttribute('name')}"]`;
      return rootNode.querySelectorAll<FormControl>(selector);
    }

    /**
     * Acts as a cache for the current value so the value can be re-evaluated
     * whenever an attribute changes or on some other event.
     */
    #value: FormValue = '';

    /**
     * Set this[touched] and this[focused]
     * to true when the element is focused
     * @private
     */
    #onFocus = (): void => {
      this.#touched = true;
      this.#focused = true;
      this.#shouldShowError();
    };

    /**
     * Reset this[focused] on blur
     * @private
     */
    #onBlur = (): void => {
      this.#focused = false;

      this.#validate(this.shouldFormValueUpdate() ? this.#value : '');

      /**
       * Set forceError to ensure error messages persist until
       * the value is changed.
       */
      if (!this.validity.valid && this.#touched) {
        this.#forceError = true;
      }
      const showError = this.#shouldShowError();
      if (this.validationMessageCallback) {
        this.validationMessageCallback(showError ? this.internals.validationMessage : '');
      }
    };

    /**
     * For the show error state on invalid
     * @private
     */
    #onInvalid = (): void => {
      this.#forceError = true;
      this.#shouldShowError();
      this?.validationMessageCallback?.(this.showError ? this.internals.validationMessage : '');
    };

    /** Return a reference to the control's form */
    get form(): HTMLFormElement {
      return this.internals.form;
    }

    /**
     * Will return true if it is recommended that the control shows an internal
     * error. If using this property, it is wise to listen for 'invalid' events
     * on the element host and call preventDefault on the event. Doing this will
     * prevent browsers from showing a validation popup.
     */
    get showError(): boolean {
      return this.#shouldShowError();
    }

    /**
     * Forward the internals checkValidity method
     * will return the valid state of the control.
     */
    checkValidity(): boolean {
      return this.internals.checkValidity();
    }

    /** The element's validity state */
    get validity(): ValidityState {
      return this.internals.validity;
    }

    /**
     * The validation message shown by a given Validator object. If the control
     * is in a valid state this should be falsy.
     */
    get validationMessage(): string {
      return this.internals.validationMessage;
    }

    /* eslint-disable  @typescript-eslint/no-explicit-any */
    constructor(...args: any[]) {
      super(...args);
      this.addEventListener('focus', this.#onFocus);
      this.addEventListener('blur', this.#onBlur);
      this.addEventListener('invalid', this.#onInvalid);
      this.setValue(null);
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string): void {
      super.attributeChangedCallback?.(name, oldValue, newValue);

      /**
       * Check to see if a Validator is associated with the changed attribute.
       * If one exists, call control's validate function which will perform
       * control validation.
       */
      const proto = this.constructor as typeof FormControl;
      const validator = proto.getValidator(name);

      if (validator && this.validationTarget) {
        this.setValue(this.#value);
      }
    }

    /** PUBLIC LIFECYCLE METHODS */

    /**
     * Sets the control's form value if the call to `shouldFormValueUpdate`
     * returns `true`.
     * @param value {FormValue} - The value to pass to the form
     */
    setValue(value: FormValue): void {
      this.#forceError = false;
      this.validationMessageCallback?.('');
      this.#value = value;
      const valueShouldUpdate = this.shouldFormValueUpdate();
      const valueToUpdate = valueShouldUpdate ? value : null;
      this.internals.setFormValue(valueToUpdate as string);
      this.#validate(valueToUpdate);
      this.#shouldShowError();
    }

    /**
     * This method can be overridden to determine if the control's form value
     * should be set on a call to `setValue`. An example of when a user might want
     * to skip this step is when implementing checkbox-like behavior, first checking
     * to see if `this.checked` is set to a truthy value. By default this returns
     * `true`.
     */
    shouldFormValueUpdate(): boolean {
      return true;
    }

    /** DECLARED INSTANCE METHODS AND PROPERTIES*/

    /**
     * Resets a form control to its initial state
     */
    declare resetFormControl: () => void;

    /**
     * This method is used to override the controls' validity message
     * for a given Validator key. This has the highest level of priority when
     * setting a validationMessage, so use this method wisely.
     *
     * The returned value will be used as the validationMessage for the given key.
     * @param validationKey {string} - The key that has returned invalid
     */
    declare validityCallback: (validationKey: string) => string | void;

     /**
      * Called when the control's validationMessage should be changed
      * @param message { string } - The new validation message
      */
    declare validationMessageCallback: (message: string) => void;

    /**
     * A callback for when the controls' form value changes. The value
     * passed to this function should not be confused with the control's
     * value property, this is the value that will appear on the form.
     *
     * In cases where `checked` did not exist on the control's prototype
     * upon initialization, this value and the value property will be identical;
     * in cases where `checked` is present upon initialization, this will be
     * effectively `this.checked && this.value`.
     */
    declare valueChangedCallback: (value: FormValue) => void;

    /**
     * The element that will receive focus when the control's validity
     * state is reported either by a form submission or via API
     *
     * We use declare since this is optional and we don't particularly
     * care how the consuming component implements this (as a field, member
     * or getter/setter)
     */
    declare validationTarget: HTMLElement | null;

    /** PRIVATE LIFECYCLE METHODS */

    /**
     * Check to see if an error should be shown. This method will also
     * update the internals state object with the --show-error state
     * if necessary.
     * @private
     */
    #shouldShowError(): boolean {
      if (this.hasAttribute('disabled')) {
        return false;
      }

      const showError = this.#forceError || (this.#touched && !this.validity.valid && !this.#focused);

      /**
       * At the time of writing Firefox doesn't support states
       * TODO: Remove when check for states when fully support is in place
       */
      if (showError && this.internals.states) {
        this.internals.states.add('--show-error');
      } else if (this.internals.states) {
        this.internals.states.delete('--show-error');
      }

      return showError;
    }

     /**
     * Call all the Validators on the control
     * @private
     */
    #validate(value: FormValue): void {
      const proto = this.constructor as typeof FormControl;
      const validity: CustomValidityState = {};

      let validationMessage = '';
      let controlIsValid = true;

      proto.validators.forEach((validator) => {
        /** A validator should only be evaluated if that key isn't currently in an invalid state */
        if (validity[validator.key || 'customError'] !== true) {
          /** Get data oof the Validator */
          const { message, isValid } = validator;

          /** If a key is not set, use `customError` as a catch-all */
          const key = validator.key || 'customError';

          /** Invoke the Validator isValid callback with the instance and the value */
          const valid = isValid(this, value);

          /**
           * Invert the validity because we are setting the new property
           * on the new ValidityState object
           */
          validity[key] = !valid;

          if (valid === false && validationMessage === '') {
            controlIsValid = false;
            let messageResult = '';

             /**
             * The Validator interfaces allows for the message property
             * to be either a string or a function. If it is a function,
             * we want to get the returned value to use when calling
             * ElementInternals.prototype.setValidity.
             *
             * If the Validator.message is a string, use it directly. However,
             * if a control has a ValidityCallback, it can override the error
             * message for a given validity key.
             */
            if (this.validityCallback && this.validityCallback(key)) {
              messageResult = this.validityCallback(key) as string;
            } else if (message instanceof Function) {
              messageResult = message(this, value);
            } else if (typeof message === 'string') {
              messageResult = message;
            }

            validationMessage = messageResult;
          }
        }
      });

      /**
       * In some cases, the validationTarget might not be rendered
       * at this point, if the validationTarget does exist, proceed
       * with a call to internals.setValidity. If the validationTarget
       * is still not set, we essentially wait a tick until it is there.
       *
       * If the validityTarget does not exist even after the setTimeout,
       * this will throw.
       */
      if (controlIsValid) {
        this.internals.setValidity({});

        /** If the element is part of a formControlValidationGroup, reset those values */
        if (proto.formControlValidationGroup === true) {
          this.#formValidationGroup.forEach(control => {
            /** Don't duplicate effort */
            if (control !== this) {
              control.internals.setValidity({});
            }
          });
        }
      } else if (this.validationTarget) {
        this.internals.setValidity(validity, validationMessage, this.validationTarget);
      } else {
        /**
         * If the validationTarget is not set, the user can decide how they would
         * prefer to handle focus when the field is validated.
         */
        this.internals.setValidity(validity, validationMessage);

        /**
         * It could be that a give component hasn't rendered by the time it is first
         * validated. If it hasn't been, wait a bit and add the validationTarget
         * to the setValidity call.
         *
         * TODO: Document the edge case that an element doesn't have a validationTarget
         * and must be focusable some other way
         */
        let tick = 0;
        const id = setInterval(() => {
          if (tick >= 100 || this.validity.valid) {
            clearInterval(id);
          } else if (this.validationTarget) {
            this.internals.setValidity(this.validity, validationMessage, this.validationTarget);
            clearInterval(id);
          }
          tick += 1;
        }, 0);
      }
    }

     /** Reset control state when the form is reset */
    formResetCallback() {
      this.#touched = false;
      this.#forceError = false;
      this.#shouldShowError();
      this.resetFormControl?.();

      this.validationMessageCallback?.(
        this.#shouldShowError() ? this.validationMessage : ''
      );
    }
  }

  return FormControl as Constructor<FormControlInterface> & TBase;
}
