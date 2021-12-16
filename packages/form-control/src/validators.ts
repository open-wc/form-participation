import { Validator } from './index';

export const requiredValidator: Validator = {
  attribute: 'required',
  key: 'valueMissing',
  message: 'You must include a value',
  callback(instance: HTMLElement & { required: boolean }, value: any): boolean {
    let valid = true;

    if (instance.required && !value) {
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
  message(instance: HTMLElement & { minLength: number }): string {
    return `Value must be at least ${instance.minLength} characters long`;
  },
  callback(instance: HTMLElement & { minLength: number }, value): boolean {
    if (!!value && instance.minLength > value.length) {
      return false;
    }
    return true;
  }
};

export const maxLengthValidator: Validator = {
  attribute: 'maxlength',
  key: 'rangeOverflow',
  message(instance: HTMLElement & { maxLength: number }): string {
    return `Value must not be more than ${instance.maxLength} characters long`;
  },
  callback(instance: HTMLElement & { maxLength: number }, value): boolean {
    if (!!value && instance.maxLength <= value.length) {
      return false;
    }
    return true;
  }
};

export const patternValidator: Validator = {
  attribute: 'pattern',
  key: 'patternMismatch',
  message(): string {
    return `The value does not match the required format`;
  },
  callback(instance: HTMLElement & { pattern: string }, value): boolean {
    const regExp = new RegExp(instance.pattern);
    return !!regExp.exec(value);
  }
};
