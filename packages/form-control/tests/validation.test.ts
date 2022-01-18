import { expect, fixture, fixtureCleanup, html } from '@open-wc/testing';
import { FormControlMixin, Validator } from '../src';

let callCount = 0;
const noopValidator: Validator = {
  key: 'customError',
  message: 'No op',
  callback(instance, value) {
    callCount += 1;
    return value === 'valid';
  }
};

const noopValidatorWithAttribute: Validator = {
  attribute: 'noop',
  ...noopValidator
};

describe('The FormControlMixin using HTMLElement', () => {
  let form: HTMLFormElement;
  let noopEl: NoopValidatorEl | NoopValidatorAttr;

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
    });

    it('has access to the validators array', async () => {
      expect(NoopValidatorEl.formControlValidators.length).to.equal(1);
    });

    it('will default to invalid', async () => {
      expect(noopEl.validity.valid).to.be.false;
      expect(callCount).to.equal(1);
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
      expect(callCount, 'first').to.equal(1);
      noopEl.toggleAttribute('noop', true);
      expect(callCount, 'second').to.equal(2);
    });
  });
});

export class NativeFormControl extends FormControlMixin(HTMLElement) {}
export class NoopValidatorEl extends NativeFormControl {
  static get formControlValidators() {
    return [noopValidator];
  }

  constructor() {
    super();
    const root = this.attachShadow({ mode: 'open' });
    const validationTarget = document.createElement('div');
    validationTarget.tabIndex = 0;
    root.append(validationTarget);
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.setAttribute('tabindex', '0');
  }

  get validationTarget(): HTMLDivElement {
    return this.shadowRoot!.querySelector<HTMLDivElement>('div')!;
  }
}

export class NoopValidatorAttr extends NoopValidatorEl {
  static get formControlValidators() {
    return [noopValidatorWithAttribute];
  }
}

window.customElements.define('no-op-validator-el', NoopValidatorEl);
window.customElements.define('no-op-validator-attr', NoopValidatorAttr);
