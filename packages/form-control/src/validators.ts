import { Validator } from './index';
import { FormControlInterface, FormValue } from './types';

export const requiredValidator: Validator = {
  attribute: 'required',
  key: 'valueMissing',
  message: 'Please fill out this field.',
  callback(instance: HTMLElement & { required: boolean }, value: FormValue): boolean {
    let valid = true;

    if ((instance.hasAttribute('required') || instance.required) && !value) {
      valid = false;
    }

    return valid;
  }
};

export const programmaticValidator: Validator = {
  attribute: 'error',
  message(instance: HTMLElement & { error: string }): string {
    return instance.error;
  },
  callback(instance: HTMLElement & { error: string }): boolean {
    return !instance.error;
  }
};

export const minLengthValidator: Validator = {
  attribute: 'minlength',
  key: 'rangeUnderflow',
  message(instance: FormControlInterface & { minLength: number }): string {
    const value = instance.value as string || '';
    return `Please use at least ${instance.minLength} characters (you are currently using ${value.length} characters).`;
  },
  callback(instance: HTMLElement & { minLength: number }, value: string): boolean {
    /** If no value is provided, this validator should return true */
    if (!value) {
      return true;
    }

    if (!!value && instance.minLength > value.length) {
      return false;
    }

    return true;
  }
};

export const maxLengthValidator: Validator = {
  attribute: 'maxlength',
  key: 'rangeOverflow',
  message(
    instance: FormControlInterface & { maxLength: number }
  ): string {
    const value = instance.value as string || '';
    return `Please use no more than ${instance.maxLength} characters (you are currently using ${value.length} characters).`;
  },
  callback(
    instance: HTMLElement & { maxLength: number },
    value: string
  ): boolean {
    /** If maxLength isn't set, this is valid */
    if (!instance.maxLength) {
      return true;
    }

    if (!!value && instance.maxLength < value.length) {
      return false;
    }

    return true;
  }
};

export const patternValidator: Validator = {
  attribute: 'pattern',
  key: 'patternMismatch',
  message: 'Please match the requested format.',
  callback(instance: HTMLElement & { pattern: string }, value: string): boolean {
    /** If no value is provided, this validator should return true */
    if (!value || !instance.pattern) {
      return true;
    }

    const regExp = new RegExp(instance.pattern);
    return !!regExp.exec(value);
  }
};

type DefaultErrorMessages = Partial<Record<keyof ValidityState, string | ((instance: HTMLInputElement) => string)>>;

export const internalInputValidators = (defaultErrorMessages: DefaultErrorMessages = {}): Validator[] => {
  const validityStates: DefaultErrorMessages = {
    valueMissing: () => 'Please fill out this field.',
    badInput: () => 'Please enter a valid value.',
    tooShort: (validationTarget: HTMLInputElement) => `Please enter at least ${validationTarget.minLength} characters.`,
    tooLong: (validationTarget: HTMLInputElement) => `Please enter no more than ${validationTarget.maxLength} characters.`,
    rangeOverflow: (validationTarget: HTMLInputElement) => `Please enter a value less than ${validationTarget.max}.`,
    rangeUnderflow: (validationTarget: HTMLInputElement) => `Please enter a value greater than ${validationTarget.min}.`,
    patternMismatch: (validationTarget: HTMLInputElement) => `Please match the requested format: ${validationTarget.pattern}.`,
    stepMismatch: (validationTarget: HTMLInputElement) => `Please enter a value that is evenly divisible by ${validationTarget.step}.`,
    typeMismatch: (validationTarget: HTMLInputElement) => `Please enter a value that corresponds to type: ${validationTarget.type}`,
  };

  return (Object.entries(validityStates) as [keyof ValidityState, Function][]).map(([validityState, ourErrorMessage]): Validator => ({
    key: validityState,
    message(instance: HTMLElement & { validationTarget: HTMLInputElement}) {

      const theirErrorMessage = defaultErrorMessages[validityState] instanceof Function ?
        (defaultErrorMessages[validityState] as Function)(instance.validationTarget) :
        defaultErrorMessages[validityState];

      return theirErrorMessage || ourErrorMessage(instance.validationTarget);
    },
    callback(instance: HTMLElement & { validationTarget: HTMLInputElement}) {
      return instance.validationTarget ? !instance.validationTarget.validity[validityState] : true;
    }
  }));
};
