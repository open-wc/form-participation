import { css, LitElement, html, TemplateResult, PropertyValueMap } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { live } from 'lit/directives/live.js';
import { AsyncValidator, FormControlMixin, FormValue, requiredValidator } from '../src';

const sleepValidator: AsyncValidator = {
  message: 'Hello world',
  isValid(instance: AsyncValidatorDemo, value: FormValue, signal: AbortSignal): Promise<boolean|void> {
    if (signal.aborted) {
      return Promise<void>.resolve();
    }

    return new Promise((resolve) => {
      const id = setTimeout(() => {
        resolve(value === 'foo');
      }, 2000);

      signal.addEventListener('abort', () => {
        clearTimeout(id);
        console.log(`abort for value ${value}`);
        resolve();
      });
    });
  }
}

@customElement('async-validator')
export class AsyncValidatorDemo extends FormControlMixin(LitElement) {
  static styles = css`:host(:invalid) input {
    background: tomato;
  }`;

  static formControlValidators = [requiredValidator, sleepValidator];

  @property({ type: Boolean, reflect: true })
  required = false;

  @property()
  value = '';

  @query('input')
  validationTarget!: HTMLInputElement;

  render(): TemplateResult {
    return html`<input
      @input="${this._onInput}"
      ?required="${this.required}"
      .value="${live(this.value)}"
    >`;
  }

  formResetCallback(): void {
    this.value = '';
  }

  private _onInput(event: KeyboardEvent & { target: HTMLInputElement }): void {
    this.value = event.target.value;
  }

  protected updated(changed: PropertyValueMap<this>): void {
    if (changed.has('value')) {
      this.setValue(this.value);
    }
  }

  async valueChangedCallback(value: FormValue): Promise<void> {
    await this.validationComplete;
    console.log('validations complete', value);
  }
}
