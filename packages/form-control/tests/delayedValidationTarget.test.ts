import { aTimeout, expect, fixture, fixtureCleanup, html } from '@open-wc/testing';
import { FormControlMixin, Validator } from '../src';

describe('The FormControlMixin using HTMLElement', () => {
  let form: HTMLFormElement;
  let el: DelayedTarget | NoTarget;

  describe('the no validationTarget scenario', () => {
    beforeEach(async () => {
      form = await fixture<HTMLFormElement>(html`
        <form>
          <no-target
            name="formControl"
          ></no-target>
        </form>
      `);

      el = form.querySelector<NoTarget>('no-target')!;
    });

    afterEach(fixtureCleanup);

    it('not set the validation target', async () => {
      expect(el.validationTarget).to.be.undefined;
      expect(el.validity.valid).to.be.false;
      await aTimeout(500);
      form.requestSubmit();
      expect(document.activeElement?.shadowRoot?.activeElement).to.be.undefined;
    });
  });
});

export class NativeFormControl extends FormControlMixin(HTMLElement) {}
export class DelayedTarget extends NativeFormControl {
  static get formControlValidators(): Validator[] {
    return [
      {
        key: 'customError',
        message: 'always invalid',
        isValid(): boolean {
          return false;
        }
      }
    ];
  }

  constructor() {
    super();
    const root = this.attachShadow({ mode: 'open' });
    const validationTarget = document.createElement('div');
    validationTarget.style.height = '100px';
    validationTarget.style.width = '100px';
    validationTarget.contentEditable = 'true';
    validationTarget.tabIndex = 0;
    root.append(validationTarget);
  }

  connectedCallback(): void {
    this.tabIndex = 0;
    setTimeout(() => {
      this.validationTarget = this.shadowRoot?.querySelector('div');
    });
  }
}

export class NoTarget extends NativeFormControl {
  static get formControlValidators(): Validator[] {
    return [
      {
        key: 'customError',
        message: 'always invalid',
        isValid(): boolean {
          return false;
        }
      }
    ];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  private _value: string|null = null;

  get value(): string|null {
    return this._value;
  }

  set value(_value: string|null) {
    this._value = _value;
    this.setValue(_value);
  }
}

window.customElements.define('delayed-target', DelayedTarget);
window.customElements.define('no-target', NoTarget);
