import { aTimeout, expect, fixture, fixtureCleanup, html } from '@open-wc/testing';
import {
  FormControlMixin,
  maxLengthValidator,
  minLengthValidator,
  patternValidator,
  programmaticValidator,
  requiredValidator,
  validationMessageCallback,
  Validator
} from '../src';

describe('The FormControlMixin using HTMLElement', () => {
  let form: HTMLFormElement;
  let el: ValidatedEl;

  beforeEach(async () => {
    form = await fixture<HTMLFormElement>(html`
      <form>
        <validated-el
          name="formControl"
        ></validated-el>
      </form>
    `);

    el = form.querySelector<ValidatedEl>('validated-el')!;
  });

  afterEach(fixtureCleanup);

  describe('requiredValidator', () => {
    it('will not affect validity if the required attribute is missing', async () => {
      expect(el.validity.valid).to.be.true;
    });

    it('will invalidate the control if required and no value', async () => {
      expect(el.validity.valid).to.be.true;
      expect(el.validity.valueMissing).to.be.false;
      el.toggleAttribute('required', true);
      expect(el.validity.valid).to.be.false;
      expect(el.validity.valueMissing).to.be.true;
      expect(el.internals.validationMessage).to.equal('Please fill out this field');
    });

    it('will respond to value setting', async () => {
      expect(el.validity.valid).to.be.true;
      expect(el.validity.valueMissing).to.be.false;
      el.toggleAttribute('required', true);
      expect(el.validity.valid).to.be.false;
      expect(el.validity.valueMissing).to.be.true;
      el.value = 'foo';
      expect(el.validity.valid).to.be.true;
      expect(el.validity.valueMissing).to.be.false;
    });
  });

  describe('programmaticValidator', () => {
    it('will not have an effect unless error is set', () => {
      expect(el.validity.valid).to.be.true;
    });

    it('will respond to changes to the error property', () => {
      expect(el.validity.valid).to.be.true;
      expect(el.validity.customError).to.be.false;
      el.error = 'Foo bar';
      expect(el.validity.valid).to.be.false;
      expect(el.validity.customError).to.be.true;
      expect(el.internals.validationMessage).to.equal('Foo bar');
    });
  });

  describe('minLengthValidator', () => {
    it('will not affect the element unless minLength is set', async () => {
      expect(el.validity.valid).to.be.true;
      expect(el.validity.tooShort).to.be.false;
    });

    it('will invalidate element when value length is less than minLength', async () => {
      expect(el.validity.valid).to.be.true;
      expect(el.validity.tooShort).to.be.false;
      el.minLength = 3;
      el.value = 'ab';
      expect(el.validity.valid).to.be.false;
      expect(el.validity.tooShort).to.be.true;
      expect(el.internals.validationMessage).to.equal(
        'Please use at least 3 characters (you are currently using 2 characters).'
      );
    });

    it('will validate element when value length is equal to minLength', async () => {
      expect(el.validity.valid).to.be.true;
      expect(el.validity.tooShort).to.be.false;
      el.minLength = 3;
      el.value = 'abc';
      expect(el.validity.valid).to.be.true;
      expect(el.validity.tooShort).to.be.false;
    });

    it('will validate element when value length is greater than minLength', async () => {
      expect(el.validity.valid).to.be.true;
      expect(el.validity.tooShort).to.be.false;
      el.minLength = 3;
      el.value = 'abcd';
      expect(el.validity.valid).to.be.true;
      expect(el.validity.tooShort).to.be.false;
    });
  });

  /** maxLengthValidator */
  describe('maxLengthValidator', () => {
    it('will not affect the element unless maxLength is set', async () => {
      expect(el.validity.valid).to.be.true;
      expect(el.validity.tooLong).to.be.false;
    });

    it('will invalidate controls where value is longer than maxLength', async () => {
      expect(el.validity.valid).to.be.true;
      expect(el.validity.tooLong).to.be.false;
      el.maxLength = 3;
      el.value = 'abcd';
      expect(el.validity.valid).to.be.false;
      expect(el.validity.tooLong).to.be.true;
      expect(el.internals.validationMessage).to.equal(
        'Please use no more than 3 characters (you are currently using 4 characters).'
      );
    });

    it('will validate controls where value is equal to maxLength', async () => {
      expect(el.validity.valid).to.be.true;
      expect(el.validity.tooLong).to.be.false;
      el.maxLength = 3;
      el.value = 'abcd';
      expect(el.validity.valid).to.be.false;
      expect(el.validity.tooLong).to.be.true;
      expect(el.internals.validationMessage).to.equal(
        'Please use no more than 3 characters (you are currently using 4 characters).'
      );
      el.value = 'abc';
      expect(el.validity.valid).to.be.true;
      expect(el.validity.tooLong).to.be.false;
    });

    it('will validate controls where value is less than maxLength', async () => {
      expect(el.validity.valid).to.be.true;
      expect(el.validity.tooLong).to.be.false;
      el.maxLength = 3;
      el.value = 'abcd';
      expect(el.validity.valid).to.be.false;
      expect(el.validity.tooLong).to.be.true;
      expect(el.internals.validationMessage).to.equal(
        'Please use no more than 3 characters (you are currently using 4 characters).'
      );
      el.value = 'ab';
      expect(el.validity.valid).to.be.true;
      expect(el.validity.tooLong).to.be.false;
    });
  });

  describe('patternValidator', () => {
    it('will have no affect if pattern is not set', async () => {
      expect(el.validity.valid).to.be.true;
      expect(el.validity.patternMismatch).to.be.false;
    });

    it('will invalidate the control if the pattern is set and does not match', async () => {
      expect(el.validity.valid).to.be.true;
      expect(el.validity.patternMismatch).to.be.false;
      el.pattern = 'abc';
      el.value = 'def';
      expect(el.validity.valid).to.be.false;
      expect(el.validity.patternMismatch).to.be.true;
      expect(el.internals.validationMessage).to.equal('Please match the requested format');
    });

    it('will validate the control if the pattern is set and does match', async () => {
      expect(el.validity.valid).to.be.true;
      expect(el.validity.patternMismatch).to.be.false;
      el.pattern = 'abc';
      el.value = 'def';
      expect(el.validity.valid).to.be.false;
      expect(el.validity.patternMismatch).to.be.true;
      expect(el.internals.validationMessage).to.equal('Please match the requested format');
      el.value = 'abc';
      expect(el.validity.valid).to.be.true;
      expect(el.validity.patternMismatch).to.be.false;
    });
  });

  /** maxLengthValidator */
  describe('maxLengthValidator', () => {
    it('will not affect the element unless maxLength is set', async () => {
      expect(el.validity.valid).to.be.true;
      expect(el.validity.tooLong).to.be.false;
    });

    it('will invalidate controls where value is longer than maxLength', async () => {
      expect(el.validity.valid).to.be.true;
      expect(el.validity.tooLong).to.be.false;
      el.maxLength = 3;
      el.value = 'abcd';
      expect(el.validity.valid).to.be.false;
      expect(el.validity.tooLong).to.be.true;
      expect(el.internals.validationMessage).to.equal(
        'Please use no more than 3 characters (you are currently using 4 characters).'
      );
    });

    it('will validate controls where value is equal to maxLength', async () => {
      expect(el.validity.valid).to.be.true;
      expect(el.validity.tooLong).to.be.false;
      el.maxLength = 3;
      el.value = 'abcd';
      expect(el.validity.valid).to.be.false;
      expect(el.validity.tooLong).to.be.true;
      expect(el.internals.validationMessage).to.equal(
        'Please use no more than 3 characters (you are currently using 4 characters).'
      );
      el.value = 'abc';
      expect(el.validity.valid).to.be.true;
      expect(el.validity.tooLong).to.be.false;
    });

    it('will validate controls where value is less than maxLength', async () => {
      expect(el.validity.valid).to.be.true;
      expect(el.validity.tooLong).to.be.false;
      el.maxLength = 3;
      el.value = 'abcd';
      expect(el.validity.valid).to.be.false;
      expect(el.validity.tooLong).to.be.true;
      expect(el.internals.validationMessage).to.equal(
        'Please use no more than 3 characters (you are currently using 4 characters).'
      );
      el.value = 'ab';
      expect(el.validity.valid).to.be.true;
      expect(el.validity.tooLong).to.be.false;
    });
  });

  /** iterative validation message */
  it('should have only the first invalid message when multiple validators are invalid', async () => {
    el.pattern = '^[A-Z]$';
    el.maxLength = 5;
    el.value = 'aBCDEF';

    // expect the error message to be the maxLength validato message because it is the first one
    // in the array that will return invalid
    expect(el.validationMessage).to.equal((maxLengthValidator.message as validationMessageCallback)(el, el.value));
    expect(el.validity.tooLong).to.be.true;
    expect(el.validity.patternMismatch).to.be.true;


    // change the value so that the maxLength validator returns valid
    el.value = 'aBCDE';

    // expect the error message to be the pattern validator message because it now the first one that will be invalid
    expect(el.validationMessage).to.equal(patternValidator.message);
  });

});

export class NativeFormControl extends FormControlMixin(HTMLElement) {}
export class ValidatedEl extends NativeFormControl {
  static get formControlValidators(): Validator[] {
    return [maxLengthValidator, minLengthValidator, patternValidator, programmaticValidator, requiredValidator];
  }

  _error: string | null = null;

  _maxLength: number | null = null;

  _minLength: number | null = null;

  _pattern: string | null = null;

  _required = false;

  _value: string|null = null;

  get error(): string | null {
    return this._error;
  }

  set error(error: string | null) {
    this._error = error;
    if (error) {
      this.setAttribute('error', error);
    } else {
      this.removeAttribute('error');
    }
  }

  get maxLength(): number | null {
    return this._maxLength;
  }

  set maxLength(maxLength: number | null) {
    this._maxLength = maxLength;
    if (maxLength) {
      this.setAttribute('maxlength', maxLength.toString());
    } else {
      this.removeAttribute('maxlength');
    }
  }

  get minLength(): number | null {
    return this._minLength;
  }

  set minLength(minLength: number | null) {
    this._minLength = minLength;
    if (minLength) {
      this.setAttribute('minlength', minLength.toString());
    } else {
      this.removeAttribute('minlength');
    }
  }

  get pattern(): string | null {
    return this._pattern;
  }

  set pattern(pattern: string | null) {
    this._pattern = pattern;
    if (pattern) {
      this.setAttribute('pattern', pattern);
    } else {
      this.removeAttribute('pattern');
    }
  }

  get required() {
    return this._required;
  }

  set required(required: boolean) {
    this._required = required;
    this.toggleAttribute('required', required);
  }

  get value(): string|null {
    return this._value;
  }

  set value(_value) {
    this._value = _value;
    this.setValue(_value);
  }

  constructor() {
    super();
    const root = this.attachShadow({ mode: 'open' });
    const validationTarget = document.createElement('div');
    validationTarget.tabIndex = 0;
    root.append(validationTarget);
  }

  get validationTarget(): HTMLDivElement {
    return this.shadowRoot?.querySelector<HTMLDivElement>('div')!;
  }
}

window.customElements.define('validated-el', ValidatedEl);
