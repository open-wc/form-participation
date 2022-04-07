import { IElementInternals } from 'element-internals-polyfill';

/** Generic constructor type */
/* eslint-disable  @typescript-eslint/no-explicit-any */
export type Constructor<T = Record<string, unknown>> = new (...args: any[]) => T;

/** Union type for form values */
export type FormValue = File|FormData|string|null;

/** Interface of exported FormControl behavior */
export interface FormControlInterface {
  checked?: boolean;
  validationTarget?: HTMLElement | null;
  value: FormValue;
  readonly form: HTMLFormElement;
  readonly internals: IElementInternals;
  readonly showError: boolean;
  readonly validationMessage: string;
  readonly validity: ValidityState;
  connectedCallback(): void;
  checkValidity(): boolean;
  formResetCallback(): void;
  resetFormControl(): void;
  valueChangedCallback(value: FormValue): void;
  validityCallback(validationKey: string): string | void;
  validationMessageCallback(message: string): void;
}

/**
 * Generic Validator shape. These objects
 * are used to create Validation behaviors on FormControl
 * instances.
 */
export interface Validator {
  /**
   * If present, the FormControl object will be re-run
   * when this attribute changes. Some validators won't need this
   * like a validator that ensures a given value can be cast
   * to a number.
   */
  attribute?: string;

  /**
   * This key determines which field on the control's validity
   * object will be toggled when a given Validator is run. This
   * property must exist on the global constraint validation
   * (ValidityState) object. Defaults to `customError`.
   */
  key?: keyof ValidityState;

  /**
   * When a control becomes invalid, this property will be set
   * as the control's validityMessage. If the property is of type
   * string it will be used outright. If it is a function, the
   * returned string will be used as the validation message.
   *
   * One thing to be concerned with is that overriding a given
   * Validator's message property via reference will affect
   * all controls that use that validator. If a user wants to change
   * the default message, it is best to clone the validator and
   * change the message that way.
   *
   * Validation messages can also be changed by using the
   * FormControl.prototype.validityCallback, which takes a given
   * ValidityState key as an argument and must return a validationMessage
   * for the given instance.
   */
  message: string | ((instance: any, value: FormValue) => string);

  /**
   * Callback for a given validator. Takes the FormControl instance
   * and the form control value as arguments and returns a
   * boolean to evaluate for that Validator.
   * @param instance {FormControlInterface} - The FormControl instance
   * @param value {FormValue} - The form control value
   * @returns {boolean} - The validity of a given Validator
   */
  callback(instance: HTMLElement, value: FormValue): boolean;
}

/** Generic type to allow usage of HTMLElement lifecycle methods */
export interface IControlHost {
  attributeChangedCallback?(name: string, oldValue: string, newValue: string): void;
  connectedCallback?(): void;
  disconnectedCallback?(): void;
  checked?: boolean;
  disabled?: boolean;
}

export type DefaultErrorMessages = Partial<Record<keyof ValidityState, string | ((instance: HTMLElement & { validationTarget: HTMLInputElement} ) => string)>>;
