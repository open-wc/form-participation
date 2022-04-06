import { aTimeout, expect, fixture, fixtureCleanup, html, should } from '@open-wc/testing';
import sinon from 'sinon';
import { FormControlMixin } from '../src';


describe('The FormControlMixin using HTMLElement', () => {
  let form: HTMLFormElement;
  let el: NativeControlDemo;
  let shouldUpdateEl: ShouldUpdateDemo;

  beforeEach(async () => {
    form = await fixture<HTMLFormElement>(html`<form>
      <native-control-demo name="control"></native-control-demo>
      <should-update-demo name="should-update"></should-update-demo>
    </form>`);
    el = form.querySelector<NativeControlDemo>('native-control-demo')!;
    shouldUpdateEl = form.querySelector<ShouldUpdateDemo>('should-update-demo')!;
  });

  afterEach(fixtureCleanup);

  it('will keep track of the parent form', async () => {
    expect(el.form).to.equal(form);
  });

  it('can reset an element value on non-checked controls', async () => {
    const spy = sinon.spy(el, 'resetFormControl');
    el.value = 'foo';
    let data = new FormData(form);
    expect(data.get('control')).to.equal('foo');
    form.reset();
    data = new FormData(form);
    expect(spy.called).to.be.true;
    expect(data.get('control')).to.equal('');
    spy.restore();
  });

  it('will call and evaluate shouldFormaValueUpdate', async () => {
    const spy = sinon.spy(shouldUpdateEl, 'shouldFormValueUpdate');
    let data = new FormData(form);
    shouldUpdateEl.value = 'abc';
    expect(spy.lastCall.returnValue).to.be.false;
    expect(data.get('should-update')).to.equal(null);
    shouldUpdateEl.checked = true;
    expect(spy.called).to.be.true;
    expect(spy.lastCall.returnValue).to.be.true;
    data = new FormData(form);
    expect(data.get('should-update')).to.equal('abc');
    spy.restore();
  })
});

const FormControl = FormControlMixin(HTMLElement);
class NativeControlDemo extends FormControl {
  #value = '';
  validationTarget = document.createElement('input');

  constructor() {
    super();
    this.setValue('');

    const root = this.attachShadow({ mode: 'open' });
    root.append(this.validationTarget);
  }

  get value(): string {
    return this.#value;
  }

  set value(value: string) {
    this.setValue(value);
    this.#value = value;
  }

  resetFormControl(): void {
    this.value = '';
  }
}

class ShouldUpdateDemo extends NativeControlDemo {
  private _checked = false;

  get checked() {
    return this._checked;
  }

  set checked(checked: boolean) {
    this._checked = checked;
    this.setValue(this.checked ? this.value : '');
  }

  shouldFormValueUpdate(): boolean {
    return this.checked;
  }
}

customElements.define('native-control-demo', NativeControlDemo);
customElements.define('should-update-demo', ShouldUpdateDemo);
