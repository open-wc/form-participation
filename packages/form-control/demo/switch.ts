import { LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { FormControlMixin } from '../src';
import styles from './switch.style';

@customElement('demo-switch')
export class DemoSwitch extends FormControlMixin(LitElement) {
  static styles: CSSStyleSheet = styles;

  @property({ type: Boolean, reflect: false })
  checked = false;

  @property({ type: String })
  value: string = '';

  protected firstUpdated(_changedProperties: Map<string | number | symbol, unknown>): void {
    this.checked = this.hasAttribute('checked');
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

  shouldFormValueUpdate(): boolean {
    return this.checked === true;
  }

  resetFormControl(): void {
    this.checked = this.hasAttribute('checked');
  }

  protected updated(changed: Map<string, unknown>): void {
    const checked: any = 'checked';
    if (changed.has('value') || changed.has(checked)) {
      this.setValue(this.value);
    }
    if (changed.has(checked)) {
      const states = this.internals.states;
      if(this.checked) {
        try {
          states.add(checked);
        } catch {
          states.add(`--${checked}`);
        }
      } else {
        states.delete(checked);
        states.delete(`--${checked}`);
      }
    }
  }
}
