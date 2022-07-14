import { aTimeout, expect, fixture, fixtureCleanup, html } from '@open-wc/testing';
import {
  AsyncValidator,
  FormControlMixin,
  FormValue,
  Validator
} from '../src';

let abortCount = 0;

describe('The FormControlMixin using HTMLElement', () => {
  let form: HTMLFormElement;
  let el: AsyncValidatorEl;

  beforeEach(async () => {
    form = await fixture<HTMLFormElement>(html`
      <form>
        <async-validator-el
          name="formControl"
        ></async-validator-el>
      </form>
    `);

    el = form.querySelector<AsyncValidatorEl>('async-validator-el')!;
  });

  afterEach(fixtureCleanup);
  afterEach(() => {
    abortCount = 0;
  });

  it('will process the element as initially invalid as the element resolves', async () => {
    expect(el.validity.valid).to.be.true;
    await aTimeout(100);
    expect(el.validity.valid).to.be.false;
  });

  it('will alert the user to a change in the validator state using validationComplete', async () => {
    expect(el.validity.valid).to.be.true;
    await el.validationComplete;
    expect(el.validity.valid).to.be.false;
  });

  it('will validate after success criteria is met', async () => {
    expect(el.validity.valid).to.be.true;
    await el.validationComplete;
    expect(el.validity.valid).to.be.false;
    el.value = 'foo';
    await el.validationComplete;
    expect(el.validity.valid).to.be.true;
  });

  it('will cancel validations using the abort signal', async () => {
    expect(el.validity.valid).to.be.true;
    await el.validationComplete;
    expect(el.validity.valid).to.be.false;
    el.value = 'f';
    el.value = 'fo';
    expect(abortCount).to.equal(2); // It will abort the initial set as well as 'f'
  });
});

const sleepValidator: AsyncValidator = {
  message: 'Hello world',
  isValid(instance: AsyncValidatorEl, value: FormValue, signal: AbortSignal): Promise<boolean|void> {
    let id: ReturnType<typeof setTimeout>;

    return new Promise(resolve => {
      signal.addEventListener('abort', () => {
        clearTimeout(id);
        console.log(`abort for value ${value}`);
        abortCount += 1;
        resolve();
      });

      id = setTimeout(() => {
        resolve(value === 'foo');
      }, 100);
    });
  }
}

export class NativeFormControl extends FormControlMixin(HTMLElement) {}
export class AsyncValidatorEl extends NativeFormControl {
  static get formControlValidators(): Validator[] {
    return [sleepValidator];
  }

  constructor() {
    super();
    const root = this.attachShadow({ mode: 'open' });
    this.validationTarget = document.createElement('button');
    root.append(this.validationTarget);
  }

  private _value = '';

  get value() {
    return this._value;
  }

  set value(value: string) {
    this._value = value;
    this.setValue(value);
  }
}

window.customElements.define('async-validator-el', AsyncValidatorEl);
