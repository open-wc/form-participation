import { aTimeout, expect, fixture, fixtureCleanup, html } from '@open-wc/testing';
import sinon from 'sinon';
import { FormControlMixin, Validator } from "../src";

describe('The FormControlMixin using HTMLElement', () => {
  let form: HTMLFormElement;
  let el: DelayedTarget;

  beforeEach(async () => {
    form = await fixture<HTMLFormElement>(html`
      <form>
        <delayed-target
          name="formControl"
        ></delayed-target>
      </form>
    `);

    el = form.querySelector<DelayedTarget>('delayed-target')!;
  });

  afterEach(fixtureCleanup);

  it('will wait for the validaitonTarget to be set', async () => {
    expect(el.validationTarget).to.be.undefined;
    expect(el.validity.valid).to.be.false;
    await aTimeout(100);
    form.requestSubmit();
    expect(document.activeElement?.shadowRoot?.activeElement).to.equal(el.validationTarget);
  });
});

export class NativeFormControl extends FormControlMixin(HTMLElement) {}
export class DelayedTarget extends NativeFormControl {
  static get formControlValidators(): Validator[] {
    return [{
      key: 'customError',
      message: 'always invalid',
      callback(): boolean {
        return false;
      }
    }];
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
    super.connectedCallback();
    this.tabIndex = 0;
    setTimeout(() => {
      this.validationTarget = this.shadowRoot?.querySelector('div');
    });
  }
}

window.customElements.define('delayed-target', DelayedTarget);
