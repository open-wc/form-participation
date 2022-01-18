import { aTimeout, expect, fixture, fixtureCleanup, html } from '@open-wc/testing';
import { FormControlMixin, Validator } from '../src';

let callCount = 0;
let checkedCallCount = 0;

describe('The FormControlMixin using HTMLElement', () => {
  let form: HTMLFormElement;
  let el: ValueSetter;

  beforeEach(async () => {
    form = await fixture<HTMLFormElement>(html`
      <form>
        <value-setter
          name="formControl"
        ></value-setter>
      </form>
    `);

    el = form.querySelector<ValueSetter>('value-setter')!;
  });

  afterEach(fixtureCleanup);
  afterEach(() => {
    callCount = 0;
    checkedCallCount = 0;
  });

  it('will respect getters/setters', async () => {
    el.checked = true;
    expect(checkedCallCount).to.equal(1);
    expect(callCount).to.equal(1);
    el.value = 'foo';
    expect(new FormData(form).get('formControl')).to.equal('foo');
    expect(callCount).to.equal(2);
  });
});

export class NativeFormControl extends FormControlMixin(HTMLElement) {}
export class ValueSetter extends NativeFormControl {
  static get formControlValidators(): Validator[] {
    return [];
  }

  #checked = false;

  _value = '';

  get value(): string {
    return this._value;
  }

  set value(val: string) {
    this._value = val;
    callCount += 1;
  }

  get checked(): boolean {
    return this.#checked;
  }

  set checked(checked: boolean) {
    checkedCallCount += 1;
    this.#checked = checked;
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

window.customElements.define('value-setter', ValueSetter);
