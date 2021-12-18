import { FormControlMixin } from "../src";

export class NativeFormControl extends FormControlMixin(HTMLElement) {}

export class ValueSet extends NativeFormControl {  
  constructor() {
    super();
    const root = this.attachShadow({ mode: 'open' });
    const validationTarget = document.createElement('div');
    validationTarget.tabIndex = 0;
    root.append(validationTarget);
  }

  get validationTarget(): HTMLDivElement {
    return this.shadowRoot!.querySelector<HTMLDivElement>('div')!;
  }
}

export class ValueSetChecked extends ValueSet {
  checked = false;
}