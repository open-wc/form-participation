import { aTimeout, expect, fixture, fixtureCleanup, html } from '@open-wc/testing';
import * as sinon from 'sinon';
import { submit } from '../src';

let submitted = false;
const submitCallbackPrevented = (event: Event) => {
  event.preventDefault();
  submitted = true;
};
const submitCallback = () => {
  submitted = true;
};

describe('The submit form helper', () => {
  let form: HTMLFormElement;
  let formSubmitStub: sinon.SinonSpy;

  beforeEach(async () => {
    form = await fixture<HTMLFormElement>(html`<form @submit="${submitCallback}">
      <input>
    </form>`);
    formSubmitStub = sinon.stub(form, 'submit').callsFake(() => { return false; });
    submitted = false;
  });

  afterEach(() => {
    sinon.restore();
    fixtureCleanup();
  });

  it('will submit a form that is valid', async () => {
    submit(form);
    await aTimeout(0);
    expect(submitted).to.be.true;
    expect(formSubmitStub.callCount).to.equal(1);
  });

  it('will not fire the submit event for a form that is invalid', async () => {
    const input = form.querySelector<HTMLInputElement>('input')!;
    input.required = true;
    submit(form);
    expect(submitted).to.be.false;
  });

  it('will not submit a form that is invalid', async () => {
    const input = form.querySelector<HTMLInputElement>('input')!;
    input.required = true;
    submit(form);

    expect(formSubmitStub.callCount).to.equal(0);
  });

  it('will not submit a form when the submit event is `defaultPrevented`', async () => {
    form = await fixture<HTMLFormElement>(html`<form @submit="${submitCallbackPrevented}">
      <input>
    </form>`);

    formSubmitStub = sinon.stub(form, 'submit').callsFake(() => { return false; });

    submit(form);

    expect(formSubmitStub.callCount).to.equal(0);
  });


});
