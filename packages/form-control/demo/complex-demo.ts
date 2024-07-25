import { LitElement, html, css } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { FormControlMixin, FormValue, maxLengthValidator, minLengthValidator, patternValidator, programmaticValidator, requiredValidator } from '../src';
import { submit } from '@open-wc/form-helpers';
import { live } from 'lit/directives/live.js';

export const commonSheet = css`:host {
  display: flex;
  flex-flow: column;
  font-family: Helvetica, Arial, sans-serif;
  font-size: 16px;
  gap: 4px;
}
label {
  font-weight: 600;
}
span {
  font-size: 14px;
}
input {
  border-radius: 4px;
  border: 1px solid #121212;
  font-size: 16px;
  padding: 4px;
}
/** Default invalid state with fallback https://developer.mozilla.org/en-US/docs/Web/API/CustomStateSet#using_a_try...catch_block */
:host(:is(:--show-error, :state(show-error))) input {
  border-color: red;
}
:host(:is(:--show-error, :state(show-error))) span {
  color: red;
}

/** Polyfilled invalid state */
:host([state--show-error]) input {
  border-color: red;
}
:host([state--show-error]) span {
  color: red;
}
`;

abstract class ComplexFormControl extends FormControlMixin(LitElement) {
  static get formControlValidators() {
    return [
      requiredValidator,
      programmaticValidator,
      maxLengthValidator,
      minLengthValidator,
      patternValidator
    ];
  }

  @property({ type: Boolean, reflect: true })
  required = false;

  @property({ type: Number, attribute: 'minlength' })
  minLength: number|null  = null;

  @property({ type: Number, attribute: 'maxlength' })
  maxLength: number|null = null;

  @property({ type: String, reflect: true })
  pattern: string|null = null;

  @property({ reflect: false })
  validationMessage = '';

  @property()
  value = '';

  constructor() {
    super();
    this.addEventListener('keydown', this.onKeydown);
    this.addEventListener('invalid', this.onInvalid);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('keydown', this.onKeydown);
    this.removeEventListener('invalid', this.onInvalid);
  }

  private onInvalid = (event: Event): void => {
    event.preventDefault();
    this.validationTarget!.focus();
  }

  private onKeydown = (event: KeyboardEvent): void => {
    if (event.code === 'Enter') {
      if (this.form) {
        submit(this.form);
      }
    }
  }

  validationMessageCallback(message: string): void {
    this.validationMessage = message;
  }

  protected updated(changed: Map<string, unknown>): void {
    if (changed.has('value')) {
      this.setValue(this.value);
    }
  }
}

@customElement('complex-demo')
export class ComplexDemo extends ComplexFormControl {
  static styles = commonSheet;

  @query('input')
  validationTarget!: HTMLInputElement;

  render() {
    return html`<label for="control"><slot></slot></label>
    <input
      aria-describedby="hint"
      id="control"
      .minLength="${live(this.minLength)}"
      ?required="${this.required}"
      .value="${live(this.value)}"
      @input="${this.onInput}"
    >
    <span id="hint">${this.showError ? this.validationMessage : 'Value must end with the string "lit"'}</span>`;
  }

  onInput({ target }: Event & { target: HTMLInputElement }) {
    this.value = target.value;
  }

  updated(changed: Map<string, unknown>): void {
    if (changed.has('value')) {
      this.setValue(this.value);
    }
  }
}
