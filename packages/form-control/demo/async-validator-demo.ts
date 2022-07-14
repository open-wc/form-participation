import { css, LitElement, html, TemplateResult, PropertyValueMap } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { AsyncValidator, FormControlMixin, FormValue, requiredValidator } from '../src';

const sleepValidator: AsyncValidator = {
  message: 'Hello world',
  isValid(instance: AsyncValidatorDemo, value: FormValue, signal: AbortSignal): Promise<boolean> {
    return new Promise(resolve => {
      setTimeout(() => {
        if (signal.aborted) {
          console.log(`abort for value ${value}`);
          return;
        }
        resolve(value === 'foo');
      }, 5000);
    })
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
    return html`<input @input="${this._onInput}" ?required="${this.required}">`;
  }

  private _onInput(event: KeyboardEvent & { target: HTMLInputElement }): void {
    this.value = event.target.value;
  }

  protected updated(changed: PropertyValueMap<this>): void {
    if (changed.has('value')) {
      this.setValue(this.value);
    }
  }

  valueChangedCallback(value: FormValue): void {
    console.log({value}, this.validationComplete)
    this.validationComplete.then(() => {
      console.log('validations complete', value);
    })
  }
}
