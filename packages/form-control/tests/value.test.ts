import { expect, fixture, fixtureCleanup, html } from '@open-wc/testing';
import { ValueSet, ValueSetChecked } from './elements';

window.customElements.define('value-set', ValueSet);
window.customElements.define('value-set-checked', ValueSetChecked);

describe('The FormControlMixin using LitElement', () => {
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
