import { expect, fixture, fixtureCleanup, html } from '@open-wc/testing';
import sinon, { SinonSpy } from 'sinon';
import { FormControlMixin, FormValue } from '../src';
import { Validator } from '../src/types';

let callCount = 0;
const noopValidator: Validator = {
  key: 'customError',
  message: 'No op',
  isValid(instance: HTMLElement, value: FormValue) {
    callCount += 1;
    return value === 'valid';
  }
};

const multiAttributeValidator: Validator = {
  attributes: ['foo', 'bar'],
  message: 'foo',
  isValid() {
    return true;
  }
};

const noopValidatorWithAttribute: Validator = {
  attribute: 'noop',
  ...noopValidator
};

describe('The FormControlMixin using HTMLElement', () => {
  let form: HTMLFormElement;
  let noopEl: NoopValidatorEl | NoopValidatorAttr;
  let isValidSpy = sinon.spy(noopValidator, 'isValid');

  describe('validator with no attributes', () => {
    beforeEach(async () => {
      form = await fixture<HTMLFormElement>(html`
        <form>
          <no-op-validator-el
            name="formControl"
          ></no-op-validator-el>
        </form>
      `);

      noopEl = form.querySelector<NoopValidatorEl>('no-op-validator-el')!;
    });

    afterEach(fixtureCleanup);
    afterEach(() => {
      callCount = 0;
      isValidSpy.restore();
    });

    it('has access to the validators array', async () => {
      expect(NoopValidatorEl.formControlValidators.length).to.equal(1);
    });

    it('will default to invalid', async () => {
      expect(noopEl.validity.valid).to.be.false;
      expect(isValidSpy.called).to.be.true;
      expect(isValidSpy.callCount).to.equal(1);
    });

    it('call the validationMessageCallback on invalid', async () => {
      const validationMessageCallbackSpy = sinon.spy(noopEl, 'validationMessageCallback');
      expect(noopEl.validity.valid).to.be.false;
      noopEl.dispatchEvent(new Event('invalid'));
      expect(validationMessageCallbackSpy.called).to.be.true;
      validationMessageCallbackSpy.restore();
    });

    it('will call the callback after every entry', async () => {
      expect(noopEl.validity.valid).to.be.false;
      expect(callCount).to.equal(1);
      noopEl.value = 'valid';
      expect(callCount).to.equal(2);
    });

    it('can toggle the validity to true', async () => {
      expect(noopEl.validity.valid).to.be.false;
      noopEl.value = 'valid';
      expect(noopEl.validity.valid).to.be.true;
    });

    it('will toggle showError on focus state', async () => {
      expect(noopEl.validity.valid).to.be.false;
      expect(noopEl.showError).to.be.false;
      noopEl.focus();
      noopEl.blur();
      expect(noopEl.showError, 'showError should be true').to.be.true;
    });

    it('will always recommend against showing error if disabled', async () => {
      expect(noopEl.validity.valid).to.be.false;
      expect(noopEl.showError).to.be.false;
      noopEl.focus();
      noopEl.blur();
      expect(noopEl.showError, 'showError should be true').to.be.true;
      noopEl.toggleAttribute('disabled', true);
      expect(noopEl.showError, 'showError should be true').to.be.false;
    });

    it('will recommend showing error on invalid events', async () => {
      expect(noopEl.validity.valid).to.be.false;
      expect(noopEl.showError).to.be.false;
      noopEl.dispatchEvent(new Event('invalid'));
      expect(noopEl.showError).to.be.true;
    });

    it('has a checkValidity method', async () => {
      expect(noopEl.validity.valid).to.be.false;
      expect(noopEl.checkValidity()).to.equal(noopEl.validity.valid);
      noopEl.value = 'valid';
      expect(noopEl.validity.valid).to.be.true;
      expect(noopEl.checkValidity()).to.equal(noopEl.validity.valid);
    });
  });

  describe('validator with attributes', () => {
    beforeEach(async () => {
      form = await fixture<HTMLFormElement>(html`
        <form>
          <no-op-validator-attr
            name="formControl"
          ></no-op-validator-attr>
        </form>
      `);

      noopEl = form.querySelector<NoopValidatorEl>('no-op-validator-attr')!;
    });

    afterEach(fixtureCleanup);
    afterEach(() => {
      callCount = 0;
    });

    it('will add the attribute to the observed attributes', async () => {
      const constructor = noopEl.constructor as unknown as NoopValidatorAttr & { observedAttributes: string[] };
      expect(constructor.observedAttributes).to.deep.equal(['noop']);
    });

    it('will call the validator on attribute change', async () => {
      expect(callCount).to.equal(1);
      noopEl.toggleAttribute('noop', true);
      expect(callCount).to.equal(2);
    });
  });

  describe('Multi-attribute validators', () => {
    let callbackSpy: SinonSpy;

    beforeEach(() => {
      callbackSpy = sinon.spy(multiAttributeValidator, 'isValid');
    });

    afterEach(() => {
      callbackSpy.restore();
    });

    it('will be evaluated on each attribute change', async () => {
      const el = new MultiAttributeValidator();
      /** Called when the element is constructed */
      expect(callbackSpy.callCount).to.equal(1);

      /** Called when the first attribute changes */
      el.setAttribute('foo', 'foo');
      expect(callbackSpy.callCount).to.equal(2);

      /** Called when the first attribute changes */
      el.setAttribute('bar', 'bar');
      expect(callbackSpy.callCount).to.equal(3);
    })
  });

  // describe('validators in a group', () => {
  //   it('will validate as a group', async () => {
  //     const form = await fixture<HTMLFormElement>(html`<form>
  //       <no-op-validator-attr-group name="one"></no-op-validator-attr-group>
  //       <no-op-validator-attr-group name="two"></no-op-validator-attr-group>
  //     </form>`);

  //     let [el1, el2] = form.querySelectorAll<NoopValidatorAttrGroup>('no-op-validator-attr-group');
  //     el1.value = 'foo';
  //     el2.value = 'bar';

  //     expect(el1.validity.valid).to.be.false;
  //     expect(el2.validity.valid).to.be.false;
  //   });
  // });
});

export class MultiAttributeValidator extends FormControlMixin(HTMLElement) {
  static get formControlValidators() {
    return [multiAttributeValidator];
  }

  constructor() {
    super();
    const root = this.attachShadow({ mode: 'open' });
    const btn = document.createElement('button');
    root.append(btn);
    this.validationTarget = btn;
  }
}
export class NativeFormControl extends FormControlMixin(HTMLElement) {}
export class NoopValidatorEl extends NativeFormControl {
  static get formControlValidators() {
    return [noopValidator];
  }

  _value: string|null = '';
  message = '';

  constructor() {
    super();
    const root = this.attachShadow({ mode: 'open' });
    const validationTarget = document.createElement('div');
    validationTarget.tabIndex = 0;
    root.append(validationTarget);
  }

  connectedCallback(): void {
    this.setAttribute('tabindex', '0');
  }

  get validationTarget(): HTMLDivElement {
    return this.shadowRoot?.querySelector<HTMLDivElement>('div')!;
  }

  get value() {
    return this._value;
  }

  set value(_value) {
    this._value = _value;
    this.setValue(_value);
  }

  validationMessageCallback(message: string): void {
    return;
  }
}

export class NoopValidatorAttr extends NoopValidatorEl {
  static get formControlValidators() {
    return [noopValidatorWithAttribute];
  }
}

window.customElements.define('no-op-validator-el', NoopValidatorEl);
window.customElements.define('no-op-validator-attr', NoopValidatorAttr);
window.customElements.define('multi-attribute-validator-el', MultiAttributeValidator);
