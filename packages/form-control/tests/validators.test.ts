import { LitElement } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { live } from 'lit/directives/live.js';
import { sendKeys } from '@web/test-runner-commands';
import { elementUpdated, expect, fixture, fixtureCleanup, html } from '@open-wc/testing';
import {
  FormControlMixin,
  maxLengthValidator,
  minLengthValidator,
  patternValidator,
  programmaticValidator,
  requiredValidator,
  internalInputValidators,
  Validator,
  DefaultErrorMessages
} from '../src';

const getValidator = (validatorKey: string) => internalInputValidators().filter((validator) => validator.key === validatorKey)[0];
const testDefaultErrorMessages: DefaultErrorMessages = {
  valueMissing: 'some fake error message',
  badInput: 'some badInput message',
  tooLong: 'some tooLong message',
  tooShort: 'some tooShort message',
  rangeOverflow: (target) => `some rangeOverflow message ${target.name}`,
  rangeUnderflow: 'some rangeUnderflow message',
  patternMismatch: 'some pattern message',
  stepMismatch: 'some step message',
  typeMismatch: 'some type message',
};

const validatorMessage = (message: string | ((instance: HTMLInputElement) => string), target: HTMLInputElement) => message instanceof Function ? message(target) : message;


describe('Validators', () => {
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
      expect(el.internals.validationMessage).to.equal('Please fill out this field.');
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
      expect(el.validity.rangeUnderflow).to.be.false;
    });

    it('will invalidate element when value length is less than minLength', async () => {
      expect(el.validity.valid).to.be.true;
      expect(el.validity.rangeUnderflow).to.be.false;
      el.minLength = 3;
      el.value = 'ab';
      expect(el.validity.valid).to.be.false;
      expect(el.validity.rangeUnderflow).to.be.true;
      expect(el.internals.validationMessage).to.equal(
        'Please use at least 3 characters (you are currently using 2 characters).'
      );
    });

    it('will validate element when value length is equal to minLength', async () => {
      expect(el.validity.valid).to.be.true;
      expect(el.validity.rangeUnderflow).to.be.false;
      el.minLength = 3;
      el.value = 'abc';
      expect(el.validity.valid).to.be.true;
      expect(el.validity.rangeUnderflow).to.be.false;
    });

    it('will validate element when value length is greater than minLength', async () => {
      expect(el.validity.valid).to.be.true;
      expect(el.validity.rangeUnderflow).to.be.false;
      el.minLength = 3;
      el.value = 'abcd';
      expect(el.validity.valid).to.be.true;
      expect(el.validity.rangeUnderflow).to.be.false;
    });
  });

  /** maxLengthValidator */
  describe('maxLengthValidator', () => {
    it('will not affect the element unless maxLength is set', async () => {
      expect(el.validity.valid).to.be.true;
      expect(el.validity.rangeOverflow).to.be.false;
    });

    it('will invalidate controls where value is longer than maxLength', async () => {
      expect(el.validity.valid).to.be.true;
      expect(el.validity.rangeOverflow).to.be.false;
      el.maxLength = 3;
      el.value = 'abcd';
      expect(el.validity.valid).to.be.false;
      expect(el.validity.rangeOverflow).to.be.true;
      expect(el.internals.validationMessage).to.equal(
        'Please use no more than 3 characters (you are currently using 4 characters).'
      );
    });

    it('will validate controls where value is equal to maxLength', async () => {
      expect(el.validity.valid).to.be.true;
      expect(el.validity.rangeOverflow).to.be.false;
      el.maxLength = 3;
      el.value = 'abcd';
      expect(el.validity.valid).to.be.false;
      expect(el.validity.rangeOverflow).to.be.true;
      expect(el.internals.validationMessage).to.equal(
        'Please use no more than 3 characters (you are currently using 4 characters).'
      );
      el.value = 'abc';
      expect(el.validity.valid).to.be.true;
      expect(el.validity.rangeOverflow).to.be.false;
    });

    it('will validate controls where value is less than maxLength', async () => {
      expect(el.validity.valid).to.be.true;
      expect(el.validity.rangeOverflow).to.be.false;
      el.maxLength = 3;
      el.value = 'abcd';
      expect(el.validity.valid).to.be.false;
      expect(el.validity.rangeOverflow).to.be.true;
      expect(el.internals.validationMessage).to.equal(
        'Please use no more than 3 characters (you are currently using 4 characters).'
      );
      el.value = 'ab';
      expect(el.validity.valid).to.be.true;
      expect(el.validity.rangeOverflow).to.be.false;
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
      expect(el.internals.validationMessage).to.equal('Please match the requested format.');
    });

    it('will validate the control if the pattern is set and does match', async () => {
      expect(el.validity.valid).to.be.true;
      expect(el.validity.patternMismatch).to.be.false;
      el.pattern = 'abc';
      el.value = 'def';
      expect(el.validity.valid).to.be.false;
      expect(el.validity.patternMismatch).to.be.true;
      expect(el.internals.validationMessage).to.equal('Please match the requested format.');
      el.value = 'abc';
      expect(el.validity.valid).to.be.true;
      expect(el.validity.patternMismatch).to.be.false;
    });
  });

  /** maxLengthValidator */
  describe('maxLengthValidator', () => {
    it('will not affect the element unless maxLength is set', async () => {
      expect(el.validity.valid).to.be.true;
      expect(el.validity.rangeOverflow).to.be.false;
    });

    it('will invalidate controls where value is longer than maxLength', async () => {
      expect(el.validity.valid).to.be.true;
      expect(el.validity.rangeOverflow).to.be.false;
      el.maxLength = 3;
      el.value = 'abcd';
      expect(el.validity.valid).to.be.false;
      expect(el.validity.rangeOverflow).to.be.true;
      expect(el.internals.validationMessage).to.equal(
        'Please use no more than 3 characters (you are currently using 4 characters).'
      );
    });

    it('will validate controls where value is equal to maxLength', async () => {
      expect(el.validity.valid).to.be.true;
      expect(el.validity.rangeOverflow).to.be.false;
      el.maxLength = 3;
      el.value = 'abcd';
      expect(el.validity.valid).to.be.false;
      expect(el.validity.rangeOverflow).to.be.true;
      expect(el.internals.validationMessage).to.equal(
        'Please use no more than 3 characters (you are currently using 4 characters).'
      );
      el.value = 'abc';
      expect(el.validity.valid).to.be.true;
      expect(el.validity.rangeOverflow).to.be.false;
    });

    it('will validate controls where value is less than maxLength', async () => {
      expect(el.validity.valid).to.be.true;
      expect(el.validity.rangeOverflow).to.be.false;
      el.maxLength = 3;
      el.value = 'abcd';
      expect(el.validity.valid).to.be.false;
      expect(el.validity.rangeOverflow).to.be.true;
      expect(el.internals.validationMessage).to.equal(
        'Please use no more than 3 characters (you are currently using 4 characters).'
      );
      el.value = 'ab';
      expect(el.validity.valid).to.be.true;
      expect(el.validity.rangeOverflow).to.be.false;
    });
  });
});

describe('Internal Input Validators', () => {
  let form: HTMLFormElement;
  let el: ValidatedNativeFormControl;

  beforeEach(async () => {
    form = await fixture<HTMLFormElement>(html`
      <form>
        <validated-native-el
          name="formControl"
        ></validated-native-el>
      </form>
    `);
    await elementUpdated(form);
    el = form.querySelector<ValidatedNativeFormControl>('validated-native-el')!;
  });

  afterEach(fixtureCleanup);

  it('returns valueMissing validity and message', async () => {
    el.required = true;
    await elementUpdated(el);

    el.validationTarget.dispatchEvent( new CustomEvent('change'));

    expect(el.validationMessage).to.equal((getValidator('valueMissing').message as Function)(el.validationTarget));
  });

  it('returns badInput validity', async () => {
    el.type = 'number';

    // +,-, and e are all 'numeric' characters that arent numbers
    el.validationTarget.focus();
    await sendKeys({ type: '+'});
    await sendKeys({ press: 'Tab'});

    await elementUpdated(el);

    expect(el.validationMessage).to.equal((getValidator('badInput').message as Function)(el));
    expect(el.validity.valid).to.equal(false);
  });

  it('returns typeMismatch validity', async () => {
    el.type = 'email';

    // +,-, and e are all 'numeric' characters that arent numbers
    el.validationTarget.focus();
    await sendKeys({ type: 'a'});
    await sendKeys({ press: 'Tab'});

    await elementUpdated(el);

    expect(el.validity.typeMismatch).to.equal(true);
    expect(el.validationMessage).to.equal((getValidator('typeMismatch').message as Function)(el));
    expect(el.validity.valid).to.equal(false);
  });

  it('returns tooShort validity', async () => {
    el.minLength = '5';
    await elementUpdated(el);

    // send a value that is less characters than the minLength
    el.validationTarget.focus();
    await sendKeys({ type: 'abc'});
    await sendKeys({ press: 'Tab'});

    await elementUpdated(el);

    expect(el.validity.tooShort).to.equal(true);
    expect(el.validationMessage).to.equal((getValidator('tooShort').message as Function)(el));
    expect(el.validity.valid).to.equal(false);
  });

  it('returns tooLong validity', async () => {
    el.maxLength = '3';
    el.value = 'abcdef';
    await elementUpdated(el);

    // maxlength is tricky because the browser wont let you type more than the maxlength
    // BUT, validity isnt updated until typing into an input
    // so you can set the value to a way long value, then send Backspace to delete one character
    // the resulting value is still too long and validity is updated.
    el.validationTarget.focus();
    await sendKeys({ press: 'Backspace'});
    await sendKeys({ press: 'Tab'});

    await elementUpdated(el);

    expect(el.validity.tooLong).to.equal(true);
    expect(el.validationMessage).to.equal((getValidator('tooLong').message as Function)(el));
    expect(el.validity.valid).to.equal(false);
  });

  it('returns rangeOverflow validity', async () => {
    el.type = 'number';
    el.max = '10';

    // send a value that is more than the max
    el.validationTarget.focus();
    await sendKeys({ type: '12'});
    await sendKeys({ press: 'Tab'});

    await elementUpdated(el);

    expect(el.validity.rangeOverflow).to.equal(true);
    expect(el.validationMessage).to.equal((getValidator('rangeOverflow').message as Function)(el));
    expect(el.validity.valid).to.equal(false);
  });

  it('returns rangeUnderflow validity', async () => {
    el.type = 'number';
    el.min = '10';

    // send a value that is less than the min
    el.validationTarget.focus();
    await sendKeys({ type: '5'});
    await sendKeys({ press: 'Tab'});

    await elementUpdated(el);

    expect(el.validity.rangeUnderflow).to.equal(true);
    expect(el.validationMessage).to.equal((getValidator('rangeUnderflow').message as Function)(el));
    expect(el.validity.valid).to.equal(false);
  });

  it('returns stepMismatch validity', async () => {
    el.type = 'number';
    el.step = '10';

    // send a value that isn't evenly divisible by el.step
    el.validationTarget.focus();
    await sendKeys({ type: '5'});
    await sendKeys({ press: 'Tab'});

    await elementUpdated(el);

    expect(el.validity.stepMismatch).to.equal(true);
    expect(el.validationMessage).to.equal((getValidator('stepMismatch').message as Function)(el));
    expect(el.validity.valid).to.equal(false);
  });

  it('returns patternMismatch validity', async () => {
    el.pattern = '[A-Z]+'; // only and at least 1 capital letter

    el.validationTarget.focus();
    await sendKeys({ type: 'a'});
    await sendKeys({ press: 'Tab'});

    await elementUpdated(el);

    expect(el.validity.patternMismatch).to.equal(true);
    expect(el.validationMessage).to.equal((getValidator('patternMismatch').message as Function)(el));
    expect(el.validity.valid).to.equal(false);
  });

});

describe('Internal Input Validators with custom default error messages', () => {
  let form: HTMLFormElement;
  let el: ValidatedNativeFormControl;

  beforeEach(async () => {
    form = await fixture<HTMLFormElement>(html`
      <form>
        <validated-native-el2></validated-native-el2>
      </form>
    `);
    await elementUpdated(form);
    el = form.querySelector<ValidatedNativeFormControl>('validated-native-el2')!;
  });

  afterEach(fixtureCleanup);

  it('returns valueMissing validity and message', async () => {
    el.required = true;
    await elementUpdated(el);

    el.validationTarget.dispatchEvent( new CustomEvent('change'));

    expect(el.validationMessage).to.equal(validatorMessage((testDefaultErrorMessages.valueMissing as any), el.validationTarget));
  });

  it('returns badInput validity', async () => {
    el.type = 'number';

    // +,-, and e are all 'numeric' characters that arent numbers
    el.validationTarget.focus();
    await sendKeys({ type: '+'});
    await sendKeys({ press: 'Tab'});

    await elementUpdated(el);

    expect(el.validationMessage).to.equal(validatorMessage((testDefaultErrorMessages.badInput as any), el.validationTarget));
  });

  it('returns typeMismatch validity', async () => {
    el.type = 'email';

    // +,-, and e are all 'numeric' characters that arent numbers
    el.validationTarget.focus();
    await sendKeys({ type: 'a'});
    await sendKeys({ press: 'Tab'});

    await elementUpdated(el);

    expect(el.validationMessage).to.equal(validatorMessage((testDefaultErrorMessages.typeMismatch as any), el.validationTarget));
  });

  it('returns tooShort validity', async () => {
    el.minLength = '5';
    await elementUpdated(el);

    // send a value that is less characters than the minLength
    el.validationTarget.focus();
    await sendKeys({ type: 'abc'});
    await sendKeys({ press: 'Tab'});

    await elementUpdated(el);

    expect(el.validationMessage).to.equal(validatorMessage((testDefaultErrorMessages.tooShort as any), el.validationTarget));
  });

  it('returns tooLong validity', async () => {
    el.maxLength = '3';
    el.value = 'abcdef';
    await elementUpdated(el);

    // maxlength is tricky because the browser wont let you type more than the maxlength
    // BUT, validity isnt updated until typing into an input
    // so you can set the value to a way long value, then send Backspace to delete one character
    // the resulting value is still too long and validity is updated.
    el.validationTarget.focus();
    await sendKeys({ press: 'Backspace'});
    await sendKeys({ press: 'Tab'});

    await elementUpdated(el);

    expect(el.validationMessage).to.equal(validatorMessage((testDefaultErrorMessages.tooLong as any), el.validationTarget));
  });

  it('returns rangeOverflow validity', async () => {
    el.type = 'number';
    el.max = '10';

    // send a value that is more than the max
    el.validationTarget.focus();
    await sendKeys({ type: '12'});
    await sendKeys({ press: 'Tab'});

    await elementUpdated(el);

    expect(el.validationMessage).to.equal(validatorMessage((testDefaultErrorMessages.rangeOverflow as any), el.validationTarget));
  });

  it('returns rangeUnderflow validity', async () => {
    el.type = 'number';
    el.min = '10';

    // send a value that is less than the min
    el.validationTarget.focus();
    await sendKeys({ type: '5'});
    await sendKeys({ press: 'Tab'});

    await elementUpdated(el);

    expect(el.validationMessage).to.equal(validatorMessage((testDefaultErrorMessages.rangeUnderflow as any), el.validationTarget));
  });

  it('returns stepMismatch validity', async () => {
    el.type = 'number';
    el.step = '10';

    // send a value that isn't evenly divisible by el.step
    el.validationTarget.focus();
    await sendKeys({ type: '5'});
    await sendKeys({ press: 'Tab'});

    await elementUpdated(el);

    expect(el.validationMessage).to.equal(validatorMessage((testDefaultErrorMessages.stepMismatch as any), el.validationTarget));
  });

  it('returns patternMismatch validity', async () => {
    el.pattern = '[A-Z]+'; // only and at least 1 capital letter

    el.validationTarget.focus();
    await sendKeys({ type: 'a'});
    await sendKeys({ press: 'Tab'});

    await elementUpdated(el);

    expect(el.validationMessage).to.equal(validatorMessage((testDefaultErrorMessages.patternMismatch as any), el.validationTarget));
  });

});

export class NativeFormControl extends FormControlMixin(HTMLElement) {}
export class ValidatedEl extends NativeFormControl {
  static get formControlValidators(): Validator[] {
    return [maxLengthValidator, minLengthValidator, patternValidator, programmaticValidator, requiredValidator];
  }

  #error: string | null = null;

  #maxLength: number | null = null;

  #minLength: number | null = null;

  #pattern: string | null = null;

  #required = false;

  get error(): string | null {
    return this.#error;
  }

  set error(error: string | null) {
    this.#error = error;
    if (error) {
      this.setAttribute('error', error);
    } else {
      this.removeAttribute('error');
    }
  }

  get maxLength(): number | null {
    return this.#maxLength;
  }

  set maxLength(maxLength: number | null) {
    this.#maxLength = maxLength;
    if (maxLength) {
      this.setAttribute('maxlength', maxLength.toString());
    } else {
      this.removeAttribute('maxlength');
    }
  }

  get minLength(): number | null {
    return this.#minLength;
  }

  set minLength(minLength: number | null) {
    this.#minLength = minLength;
    if (minLength) {
      this.setAttribute('minlength', minLength.toString());
    } else {
      this.removeAttribute('minlength');
    }
  }

  get pattern(): string | null {
    return this.#pattern;
  }

  set pattern(pattern: string | null) {
    this.#pattern = pattern;
    if (pattern) {
      this.setAttribute('pattern', pattern);
    } else {
      this.removeAttribute('pattern');
    }
  }

  get required() {
    return this.#required;
  }

  set required(required: boolean) {
    this.#required = required;
    this.toggleAttribute('required', required);
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

@customElement('validated-native-el')
class ValidatedNativeFormControl extends FormControlMixin(LitElement) {
  static get formControlValidators(): Validator[] {
    return [
      ...internalInputValidators()
    ];
  }

  @property() value!: string;
  @property() type: string = 'text';
  @property() required!: boolean;
  @property() min!: string;
  @property() max!: string;
  @property() maxLength!: string;
  @property() minLength!: string;
  @property() pattern!: string;
  @property() step!: string;

  @query('input') validationTarget!: HTMLInputElement;

  // to trigger validation
  #handleInput(event: Event) {
    this.value = (event.target as HTMLInputElement).value;
  }

  render() {
    return html`
      <input
        type="${this.type}"
        ?required="${this.required}"
        .value="${live(this.value)}"
        min="${ifDefined(this.min)}"
        max="${ifDefined(this.max)}"
        minlength="${ifDefined(this.minLength)}"
        maxlength="${ifDefined(this.maxLength)}"
        step="${ifDefined(this.step)}"
        pattern="${ifDefined(this.pattern)}"
        @input="${this.#handleInput}"
        @change="${this.#handleInput}"
      />
    `
  }
}


@customElement('validated-native-el2')
class ValidatedNativeFormControl2 extends FormControlMixin(LitElement) {
  static get formControlValidators(): Validator[] {
    return [
      ...internalInputValidators(testDefaultErrorMessages)
    ];
  }

  @property() name: string = 'test';
  @property() value!: string;
  @property() type: string = 'text';
  @property() required!: boolean;
  @property() min!: string;
  @property() max!: string;
  @property() maxLength!: string;
  @property() minLength!: string;
  @property() pattern!: string;
  @property() step!: string;

  @query('input') validationTarget!: HTMLInputElement;

  // to trigger validation
  #handleInput(event: Event) {
    this.value = (event.target as HTMLInputElement).value;
  }

  render() {
    return html`
      <input
        type="${this.type}"
        ?required="${this.required}"
        .value="${live(this.value)}"
        min="${ifDefined(this.min)}"
        max="${ifDefined(this.max)}"
        minlength="${ifDefined(this.minLength)}"
        maxlength="${ifDefined(this.maxLength)}"
        step="${ifDefined(this.step)}"
        pattern="${ifDefined(this.pattern)}"
        @input="${this.#handleInput}"
        @change="${this.#handleInput}"
      />
    `
  }
}


