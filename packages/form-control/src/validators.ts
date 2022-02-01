import { Validator } from './index';
import { FormControlInterface, FormValue } from './types';

export const requiredValidator: Validator = {
  attribute: 'required',
  key: 'valueMissing',
  message: 'Please fill out this field',
  callback(instance: HTMLElement & { required: boolean }, value: FormValue): boolean {
    let valid = true;

    if ((instance.hasAttribute('required') || instance.required) && !value) {
      valid = false;
    }

    return valid;
  }
};

export const requiredCheckedValidator: Validator = {
  attribute: 'required',
  key: 'valueMissing',
  message: 'Please fill out this field',
  callback(instance: HTMLElement & { required: boolean, checked: boolean }): boolean {
    let valid = true;

    if (instance.hasAttribute('required') && !instance.checked) {
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
  message: 'Please match the requested format',
  callback(instance: HTMLElement & { pattern: string }, value: string): boolean {
    /** If no value is provided, this validator should return true */
    if (!value || !instance.pattern) {
      return true;
    }

    const regExp = new RegExp(instance.pattern);
    return !!regExp.exec(value);
  }
};
