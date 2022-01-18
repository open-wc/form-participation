import { aTimeout, elementUpdated, expect, fixture, fixtureCleanup, html } from '@open-wc/testing';
import { LitElement, TemplateResult } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { live } from 'lit/directives/live.js';
import { sendKeys } from '@web/test-runner-commands';
import { FormControlMixin, requiredValidator, Validator } from '../src';

describe('The FormControlMixin using LitElement', () => {
  let form: HTMLFormElement;
  let el: LitControl;

  beforeEach(async () => {
    form = await fixture(html`
      <form>
        <lit-control name="formControl"></lit-control>
      </form>
    `);
    el = form.querySelector<LitControl>('lit-control')!;
  });

  afterEach(fixtureCleanup);

  it('respects the lit update cycle', async () => {
    el.focus();
    el.validationTarget?.focus();
    await sendKeys({ type: 'Hello world' });
    await elementUpdated(el);
    const data = new FormData(form);
    expect(el.value).to.equal('Hello world');
    expect(data.get(el.name)).to.equal(el.value);
  });

  it('will validate with lit', async () => {
    expect(el.validity.valid).to.be.true;
    el.required = true;
    await elementUpdated(el);
    expect(el.validity.valid).to.be.false;
    expect(el.validity.valueMissing).to.be.true;
    expect(el.internals.validationMessage).to.equal('value missing');
  });
});

@customElement('lit-control')
export class LitControl extends FormControlMixin(LitElement) {
  static get formControlValidators(): Validator[] {
    return [requiredValidator];
  }

  @property({ type: String })
  name = '';

  @property({ type: Boolean, reflect: true })
  required = false;

  @property({ type: String, reflect: false })
  value = '';

  @query('input')
  validationTarget?: HTMLElement | null | undefined;

  protected firstUpdated(_changedProperties: Map<string | number | symbol, unknown>): void {
    this.tabIndex = 0;
  }

  render(): TemplateResult {
    return html`<input
      @input="${this.#onInput}"
      ?required="${live(this.required)}"
      .value="${live(this.value)}"
    >`;
  }

  #onInput(event: KeyboardEvent & { target: HTMLInputElement }) {
    this.value = event.target.value;
  }

  validityCallback(validationKey: string): string | void {
    return 'value missing';
  }
}
