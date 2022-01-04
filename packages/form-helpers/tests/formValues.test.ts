import { expect, fixture, fixtureCleanup, html } from '@open-wc/testing';
import { formValues, parseFormAsObject } from '../src';

describe('The form values helper', () => {
  let form: HTMLFormElement;

  beforeEach(async () => {
    form = await fixture<HTMLFormElement>(html`<form>
      <input name="foo" value="one">
      <input name="bar" value="two">
      <input name="baz" value="1">
      <input name="baz" value="2">
    </form>`);
  });

  afterEach(fixtureCleanup);

  it('will return an object that reflects the form state', async () => {
    const data = formValues(form);
    expect(data).to.deep.equal({
      foo: 'one',
      bar: 'two',
      baz: ['1', '2']
    });
  });
});

describe('the form as object helper', () => {
  let form: HTMLFormElement;

  beforeEach(async () => {
    form = await fixture<HTMLFormElement>(html`<form>
      <input name="one.a" value="a">
      <input name="one.b" value="b">
      <input name="two" value="2">
      <input name="foo.bar.baz" value="baz">
      <input name="foo.bar.qux" value="qux">
      <input name="three" value="three">
      <input name="three" value="tres">
      <input name="tests.are" value="helpful">
      <input name="tests.are" value="frustrating">
    </form>`);
  });

  it('will parse the form values as an object', async () => {
    const data = parseFormAsObject(form);
    expect(data).to.deep.equal({
      one: {
        a: 'a',
        b: 'b',
      },
      two: '2',
      foo: {
        bar: {
          baz: 'baz',
          qux: 'qux'
        }
      },
      three: ['three', 'tres'],
      tests: {
        are: ['helpful', 'frustrating']
      }
    });
  });
})
