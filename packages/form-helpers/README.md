# @open-wc/form-utils
A collection of form control related utilities for working with forms.


## Install

```sh
# npm
npm install @open-wc/form-helpers

# yarn
yarn add @open-wc/form-helpers
```

### Implicit form submit
The `submit` helper is a useful helper for firing the forms `submit` event – as a preventable event – only when the form's validity reports back as truthy (meaning the form has all valid values in its inputs) and calling the provided form's `submit()` method if the submit event is not `defaultPrevented`.
```html
<form id="someForm" @submit="${submitHandler}">
  <input required>
</form>
```
```js
import { submit } from '@open-wc/form-helpers';

let submitted = false;
const form = document.querySelector('#someForm');
const input = document.querySelector('input');

input.addEventListener( 'keypress', ($event) => {
  if($event.keyCode === 13) { // Enter key
    submit(form); // submit event is emitted, and form's submit() method is called if the `submit` event is not `defaultPrevented`
    console.log(submitted) // submitted will be false if the input doesn't have a value AND is required
  }
});

function submitHandler(event) {
  // the event is not prevented, so the form will be submitted
  submitted = true;
};
```

### Parse form values
The `formValues` helper is a useful function for parsing out the values of a form's inputs in an object format.

```js
import { formValues } from '@open-wc/form-helpers';
```

Given a form like:
```html
<form>
  <input name="foo" value="one">
  <input name="bar" value="two">
  <input name="baz" value="1">
  <input name="baz" value="2">
</form>
```

parsing the form's values can be performed as such:

```js
import { formValues } from '@open-wc/form-helpers';

const form = document.querySelector('form');

console.log(formValues(form))

// Output: 
// {
//   foo: 'one', 
//   bar: 'two',
//   baz: ['1', '2']
// }
```

### Parse form object
The `parseFormObject` helper enables deeper nesting and organization of inputs in a form by inspecting the `name` attribute on each input element and analyzing according to dot notation.

```js
import { parseFormAsObject } from '@open-wc/form-helpers';
```

Given a form like
```html
<form>
  <input name="one.a" value="a">
  <input name="one.b" value="b">
  <input name="two" value="2">
  <input name="foo.bar.baz" value="baz">
  <input name="foo.bar.qux" value="qux">
  <input name="three" value="three">
  <input name="three" value="tres">
</form>
```
parsing the form values as a deeply nested object can be perfomed as such:
```js
import { parseFormAsObject } from '@open-wc/form-helpers';

const form = document.querySelector('form');

console.log(parseFormAsObject(form))

// Output: 
// {
//   one: {
//     a: 'a',
//     b: 'b',
//   },
//   two: '2',
//   foo: {
//     bar: {
//       baz: 'baz',
//       qux: 'qux'
//     }
//   },
//   three: ['three', 'tres']
// }
```