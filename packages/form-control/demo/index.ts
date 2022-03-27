import './switch';
import { FormControlMixin } from '../src/FormControl';
import { LitElement, html } from 'lit';

import { property, customElement, query } from 'lit/decorators.js';
import { live } from 'lit/directives/live.js';

@customElement('new-thing')
export class NewThing extends FormControlMixin(HTMLElement) {
  get checked(): boolean {
    return this.validationTarget.checked;
  }

  set checked(_checked: boolean) {
    this.validationTarget.checked = _checked;
    this.toggleAttribute('checked', _checked);
    this.setValue!(this.value);
  }

  get value(): string {
    return this.getAttribute('value') || '';
  }

  set value(_value: string) {
    this.setAttribute('value', _value);
    this.setValue!(_value);
  }

  get validationTarget(): HTMLInputElement {
    return this.shadowRoot?.querySelector<HTMLInputElement>('input')!;
  }

  resetFormControl(): void {
    this.checked = false;
  }

  constructor() {
    super();
    const root = this.attachShadow({ mode: 'open' });
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.addEventListener('change', this._onInput);
    root.append(input);
  }

  shouldFormValueUpdate(): boolean {
    return !!this.checked;
  }

  private _onInput = (event: Event): void => {
    this.checked = (event.target as HTMLInputElement).checked;
  }
}
