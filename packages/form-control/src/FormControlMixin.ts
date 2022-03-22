import { IElementInternals } from 'element-internals-polyfill';
import { Constructor, FormControlInterface, FormValue, IControlHost, Validator } from './types';

/** Traverse the prototype chain to check for a property descriptor */
function getPropertyDescriptor(object: IControlHost, key: string): PropertyDescriptor|null {
  if (object.constructor === HTMLElement) {
    return null;
  }
  return Object.getOwnPropertyDescriptor(object, key) || getPropertyDescriptor(Object.getPrototypeOf(object), key)
}

export function FormControlMixin<
  TBase extends Constructor<HTMLElement & IControlHost> & { observedAttributes?: string[] }
>(SuperClass: TBase) {
  class FormControl extends SuperClass {
    /** Wires up control instances to be form associated */
    static get formAssociated() {
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
    internals = this.attachInternals() as unknown as IElementInternals;

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

    /** Will return true if the control has a checked property */
    get #isCheckedElement(): boolean {
      return 'checked' in this;
    }

    /** All of the controls within a root with a matching local name and form name */
    get #formValidationGroup(): NodeListOf<FormControl> {
      const rootNode = this.getRootNode() as HTMLElement;
      const selector = `${this.localName}[name="${this.getAttribute('name')}"]`;
      return rootNode.querySelectorAll<FormControl>(selector);
    }

    /**
     * The element that will receive focus when the control's validity
     * state is reported either by a form submission or via API
     *
     * We use declare since this is optional and we don't particularly
     * care how the consuming component implements this (as a field, member
     * or getter/setter)
     */
    declare validationTarget: HTMLElement | null;

    /**
     * The controls' form value. As this property is updated, the form value
     * will be updated. If a given control has a `checked` property, the value
     * will only be set if `checked` is truthy.
     */
    value: FormValue = '';

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

    /**
     * The validation message shown by a given Validator object. If the control
     * is in a valid state this should be falsy.
     */
    get validationMessage(): string {
      return this.internals.validationMessage;
    }

    /**
     * The element's validity state after evaluating the control's Validators.
     * This property implements the same patterns as the built-in constraint
     * validation strategy.
     */
    get validity(): ValidityState {
      return this.internals.validity;
    }

    /* eslint-disable  @typescript-eslint/no-explicit-any */
    constructor(...args: any[]) {
      super(...args);
      this.addEventListener('focus', this.#onFocus);
      this.addEventListener('blur', this.#onBlur);
      this.addEventListener('invalid', this.#onInvalid);
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
        /** Determine the value to validate */
        let valueToValidate: FormValue = this.value;
        if (this.#isCheckedElement && !this.checked) {
          valueToValidate = null;
        }
        this.#validate(valueToValidate);
      }
    }

    connectedCallback() {
      super.connectedCallback?.();

      /** Initialize the form control and perform initial validation */
      this.#initFormControl();
    }

    disconnectedCallback() {
      super.disconnectedCallback?.();

      /**
       * Remove the event listeners that toggles the touched and focused states
       */
      this.removeEventListener('focus', this.#onFocus);
      this.removeEventListener('blur', this.#onBlur);
      this.removeEventListener('invalid', this.#onInvalid);
    }

    /**
     * Initialize the form control
     * @private
     */
    #initFormControl(): void {
      /** Closed over variable to track value changes */
      let value: FormValue = this.value || '';

      /** Look to see if '`checked'` is on the control's prototype */
      const hasChecked = this.#isCheckedElement;

      /**
       * The FormControlMixin writes the value property on the element host
       * this checks to see if some other object in the prototype chain
       * has a getter/setter for value and saves a reference to those.
       *
       * We do this to make sure that we don't overwrite behavior of an object
       * higher in the chain.
       */
      const descriptor = getPropertyDescriptor(this, 'value');

      /** Make sure to defer to the parent */
      const set = descriptor && descriptor.set;
      const get = descriptor && descriptor.get;

      /** Define the FormControl's value property */
      Object.defineProperty(this.hasOwnProperty('value') ? this :  this.constructor.prototype, 'value', {
        get() {
          /** If a getter already exists, make sure to call it */
          if (get) {
            return get.call(this);
          }
          return value;
        },
        set(newValue) {
          /** Save a reference to the new value to use later if necessary */
          value = newValue;

          this.#commitValue(newValue);

          /** If a setter already exists, make sure to call it */
          if (set) {
            set.call(this, newValue);
          }
        },
        // set configurable so that instance props can overwrite
        configurable: true
      });

      /**
       * If checked already exists on a prototype, we need to monitor
       * for changes to that property to ensure the proper value is set on the
       * control's form.
       *
       * TODO: Justin Fagnani cautioned that this might not scale well. Maybe
       * this should be a direct check against the value of checked ...
       */
      if (hasChecked) {
        /**
         * As with value, save a reference to the getter/setter if they already
         * exist in the prototype chain
         */
        const descriptor = getPropertyDescriptor(this, 'checked');
        const get = descriptor && descriptor.get;
        const set = descriptor && descriptor.set;

        /** Close over the initial value to use in the new getter/setter */
        let { checked } = this;

        Object.defineProperty(this, 'checked', {
          get() {
            /** If a getter exists, use it */
            if (get) {
              return get.call(this);
            }
            return checked;
          },
          set(newChecked) {
            /** Updated closure value */
            checked = newChecked;

            /** If a setter exists, use it */
            if (set) {
              set.call(this, newChecked);
            }

            this.#commitValue(this.value);
          },
          // set configurable so that instance props can overwrite
          configurable: true
        });
      }

      this.#commitValue(value);
    }

    /** Reset control state when the form is reset */
    formResetCallback() {
      this.resetFormControl();
    }

    /**
     * A callback for when the controls' form value changes. The value
     * passed to this function should not be confused with the control's
     * value property, this is the value that will appear on the form.
     * In cases where `checked` did not exist on the control's prototype
     * upon initialization, this value and the value property will be identical;
     * in cases where `checked` is present upon initialization, this will be
     * effectively `this.checked && this.value`.
     */
    declare valueChangedCallback: (value: FormValue) => void;

    /**
     * Resets a form control to its initial state
     */
    resetFormControl(): void {
      if (this.#isCheckedElement) {
        this.checked = false;
      } else {
        this.value = '';
      }
      this.#touched = false;
      this.#forceError = false;
      this.#shouldShowError();
    }

    /**
     * If the control has a checked property, make sure that it is
     * truthy before setting the form control value. If it is falsy,
     * remove the form control value.
     */
    #commitValue(value: FormValue): void {
      if (this.#isCheckedElement && !this.checked) {
        this.#setValue(null);
      } else {
        this.#setValue(value);
      }
    }

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

      if (showError) {
        this.internals.states.add('--show-error');
      } else {
        this.internals.states.delete('--show-error');
      }

      return showError;
    }

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
      /**
       * Set forceError to ensure error messages persist until
       * the value is changed.
       */
      if (!this.validity.valid && this.#touched) {
        this.#forceError = true;
      }
      const showError = this.#shouldShowError();
      if (this.validationMessageCallback) {
        this.validationMessageCallback(showError ? this.validationMessage : '');
      }
    };

    /**
     * For the show error state on invalid
     * @private
     */
    #onInvalid = (): void => {
      this.#forceError = true;
      this.#shouldShowError();
      this?.validationMessageCallback?.(this.showError ? this.validationMessage : '');
    };

    /**
     * Sets the control's value when updated and invokes the valueChangedCallback
     * for the element. Once the value has been set, invoke the Validators.
     * @private
     */
    #setValue(value: FormValue): void {
      this.#forceError = false;
      this.internals.setFormValue(value as string); /** Typed to string to work with polyfill */
      if (this.valueChangedCallback) {
        this.valueChangedCallback(value);
      }
      this.#validate(value);
      const showError = this.#shouldShowError();
      if (this.validationMessageCallback) {
        this.validationMessageCallback(showError ? this.validationMessage : '');
      }
    }

    /**
     * Call all the Validators on the control
     * @private
     */
    #validate(value: FormValue): void {
      const proto = this.constructor as typeof FormControl;
      const validity: Partial<Record<keyof ValidityState, boolean>> = {};
      let validationMessage = '';
      let isValid = true;

      proto.validators.forEach((validator) => {
        /** Get data off the Validator */
        const { message, callback } = validator;

        /** If a key is not set, use `customError` as a catch-all */
        const key = validator.key || 'customError';

        /** Invoke the Validator callback with the instance and the value */
        const valid = callback(this, value);

        /**
         * Invert the validity because we are setting the new property
         * on the new ValidityState object
         */
        validity[key] = !valid;

        if (valid === false) {
          isValid = false;
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
      if (isValid) {
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
          if (tick >= 100) {
            clearInterval(id);
          } else if (this.validity.valid) {
            clearInterval(id);
          } else if (this.validationTarget) {
            this.internals.setValidity(this.validity, this.validationMessage, this.validationTarget);
            clearInterval(id);
          }
          tick += 1;
        }, 0);
      }
    }

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
  }

  return FormControl as Constructor<FormControlInterface> & TBase;
}
