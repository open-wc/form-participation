import { LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { FormControlMixin } from '../src';
import styles from './switch.style';

@customElement('demo-switch')
export class DemoSwitch extends FormControlMixin(LitElement) {
  static styles: CSSStyleSheet = styles;

  @property({ type: Boolean, reflect: true })
  checked = false;

  @property({ type: String })
  value: string = '';

  protected firstUpdated(_changedProperties: Map<string | number | symbol, unknown>): void {
    super.firstUpdated(_changedProperties);

    this.addEventListener('click', this.#onClick);
    this.addEventListener('keypress', this.#onKeypress);
    this.setAttribute('role', 'switch');
    this.internals.ariaChecked = this.checked.toString();
    this.setAttribute('tabindex', '0');
  }

  #onClick = (): void => {
    const changeEvent = new Event('change', {
      bubbles: true
    });
    this.checked = !this.checked;
    this.internals.ariaChecked = this.checked.toString();
    this.dispatchEvent(changeEvent);
  };

  #onKeypress = (event: KeyboardEvent): void => {
    if (['Enter', 'Space'].includes(event.code)) {
      this.#onClick();
    }
  };
}
