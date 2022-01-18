import { expect, fixture, fixtureCleanup, html } from '@open-wc/testing';
import { FormControlMixin } from '../src';

describe('The FormControlMixin using HTMLElement', () => {
  let form: HTMLFormElement;
  let el: ValueSet;
  let elChecked: ValueSetChecked;

  beforeEach(async () => {
    form = await fixture<HTMLFormElement>(html`
      <form>
        <value-set
          name="formControl"
        ></value-set>
        <value-set-checked
          name="formControlChecked"
        ></value-set-checked>
      </form>
    `);

    el = form.querySelector<ValueSet>('value-set')!;
    elChecked = form.querySelector<ValueSetChecked>('value-set-checked')!;
  });

  afterEach(fixtureCleanup);

  describe('generic behavior', () => {
    it('will keep track of the parent form', async () => {
      expect(el.form).to.equal(form);
    });

    it('can reset an element value on non-checked controls', async () => {
      el.value = 'foo';
      let data = new FormData(form);
      expect(data.get('formControl')).to.equal('foo');
      el.resetFormControl();
      data = new FormData(form);
      expect(data.get('formControl')).to.equal('');
    });

    it('can reset an element value on non-checked controls', async () => {
      elChecked.checked = true;
      let data = new FormData(form);
      expect(data.get('formControlChecked')).to.equal('foo');
      elChecked.resetFormControl();
      data = new FormData(form);
      expect(data.get('formControlChecked')).to.be.null;
    });

    it('will reset the control on form reset', async () => {
      el.value = 'foo';
      elChecked.checked = true;
      let data = new FormData(form);
      expect(data.get('formControl')).to.equal('foo');
      expect(data.get('formControlChecked')).to.equal('foo');
      form.reset();
      data = new FormData(form);
      expect(data.get('formControl')).to.equal('');
      expect(data.get('formControlChecked')).to.be.null;
    });

    it('will update the value of a checked element if checked', async () => {
      elChecked.checked = true;
      let data = new FormData(form);
      expect(data.get('formControlChecked')).to.equal('foo');
      elChecked.value = 'bar';
      data = new FormData(form);
      expect(data.get('formControlChecked')).to.equal('bar');
    });
  });

  describe('no checked prperty', () => {
    it('will intialize without a value', async () => {
      const data = new FormData(form);
      expect(data.get('formControl')).to.be.null;
    });

    it('will set the value on the form when the host value is set', async () => {
      el.value = 'foo';
      const data = new FormData(form);
      expect(data.get('formControl')).to.equal('foo');
    });
  });

  describe('with a checked property', () => {
    it('will intialize without a value', async () => {
      const data = new FormData(form);
      expect(data.get('formControlChecked')).to.be.null;
    });

    it('will not participate if checked is false', async () => {
      elChecked.value = 'foo';
      const data = new FormData(form);
      expect(data.get('formControlChecked')).to.be.null;
    });

    it('will participate if checked is true', async () => {
      elChecked.value = 'foo';
      elChecked.checked = true;
      const data = new FormData(form);
      expect(data.get('formControlChecked')).to.equal('foo');
    });

    it('will toggle value as checked is toggled', async () => {
      elChecked.value = 'foo';
      elChecked.checked = true;
      let data = new FormData(form);
      expect(data.get('formControlChecked')).to.equal('foo');
      elChecked.checked = false;
      data = new FormData(form);
      expect(data.get('formControlChecked')).to.be.null;
    });
  });
});

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

  value = 'foo';
}

window.customElements.define('value-set', ValueSet);
window.customElements.define('value-set-checked', ValueSetChecked);
