import './complex-demo';
import './switch';
import './async-validator-demo';
import { css, html, LitElement } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { FormControlMixin, Validator } from '../src';

@customElement('test-el')
class TestEl extends FormControlMixin(LitElement) {
  static styles = css`:host {display:block}`
  static formControlValidators: Validator[] = [{
    key: 'customError',
    message: 'Oops',
    isValid(instance: TestEl, value: string): boolean {
      console.log(value === 'foo')
      return value === 'foo'
    }
  }];

  static shadowRootOptions: ShadowRootInit = {
    mode: 'open',
    delegatesFocus: true
  }

  @query('input')
  validationTarget!: HTMLInputElement;

  @property()
  error = ''

  firstUpdated() {
    this.setValue('');
    this.tabIndex = 0;
  }

  render() {
    return html`<input @input=${this.onInput}>${this.error}`
  }

  onInput(event: Event & { target: HTMLInputElement }) {
    this.setValue(event.target.value);
  }

  validationMessageCallback(message: string): void {
    this.error = message;
  }
}
