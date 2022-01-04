import { aTimeout, expect, fixture, fixtureCleanup, html } from '@open-wc/testing';
import { submit } from '../src';

let submitted = false;
const submitCallback = (event: Event) => {
  event.preventDefault();
  submitted = true;
};

describe('The submit form helper', () => {
  let form: HTMLFormElement;

  beforeEach(async () => {
    form = await fixture<HTMLFormElement>(html`<form @submit="${submitCallback}">
      <input>
    </form>`);
    submitted = false;
  });

  afterEach(fixtureCleanup);

  it('will submit a form that is valid', async () => {
    submit(form);
    await aTimeout(0);
    expect(submitted).to.be.true;
  });

  it('will not submit a form that is invalid', async () => {
    const input = form.querySelector<HTMLInputElement>('input')!;
    input.required = true;
    submit(form);
    expect(submitted).to.be.false;
  });
});
