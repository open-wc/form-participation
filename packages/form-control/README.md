# @open-wc/form-control

A standardized mixin for creating form-associated custom elements using a standardized validation function pattern.

## Install

```sh
# npm
npm install @open-wc/form-control

# yarn
yarn add @open-wc/form-control
```

## Usage

After importing, create a web component class that extends the mixin, and provide your desired base class as the input to `FormControlMixin`.

> The `FormControlMixin` has been tested with both [LitElement](https://lit.dev/) and `HTMLElement`, so `LitElement` is not required, but all examples in this documentation will show `LitElement` web component syntax and decorators.

```typescript
// custom web component class that extends FormControlMixin

import { LitElement, html } from 'lit';
import { customElement, query, property } from 'lit/decorators.js'
import { live } from 'lit/directives/live.js';

import { FormControlMixin } from '@open-wc/form-control';

@customElement('demo-form-control')
class DemoFormControl extends FormControlMixin(LitElement) {
  @property({ type: String })
  value = '';

  render() {
    return html`
      <label for="input"><slot></slot></label>
      <input
        id="input"
        .value="${live(this.value)}"
        @input="${this.#onInput}"
      >
    `;
  }

  #onInput({ target }: { target: HTMLInputElement }): void {
    this.value = target.value;
  }
}
```

Now, the `demo-form-control` custom element will participate as if it was a native element in an HTML form.

```html
<form>
  <demo-form-control
    name="demo"
    value="Hello world"
  >Demo form element</demo-form-control>

  <button type="submit">Submit</button>
</form>

<script>
  const form = document.querySelector('form');
  form.addEventListener('submit', event => {
    /** Prevent the page from reloading */
    event.preventDefault();

    /** Get form data object via built-in API */
    const data = new FormData(event.target);
    console.log('demo-form-control value:', data.get('demo'));
  });
</script>
```

### ElementInternals

This library makes use of [ElementInternals](https://developer.mozilla.org/en-US/docs/Web/API/ElementInternals) features. As of the time of writing `ElementInternals` features are fully supported in Chrome, partially supported in Firefox and being strongly considered by Webkit.

In order to make these features work in all browsers you will need to include the [element-internals-polyfill](https://www.npmjs.com/package/element-internals-polyfill). Refer to the `element-internals-polyfill` documentation for installation and usage instructions.

### `Value` & `checked`

Any component that uses the `FormControlMixin` will have a `value` property that the element will apply to the parent form. If the element also has a `checked` property on the prototype (think checkbox or radio button) the element's value will only be applied to the parent form when the `checked` property is truthy (like native checkboxes and radio buttons behave).

## Validation

The `FormControlMixin` includes an API for constraint validations and a set of common validators for validity states like `required`, `minlength`, `maxlength` and `pattern`.

```typescript
import { LitElement, html } from 'lit';
import { customElement, query, property } from 'lit/decorators.js'
import { live } from 'lit/directives/live.js';

import { FormControlMixin, requiredValidator } from '@open-wc/form-control';

@customElement('demo-form-control')
class DemoFormControl extends FormControlMixin(LitElement) {
  static formControlValidators = [requiredValidator];

  @property({ type: Boolean, reflect: true })
  required = false;

  @property({ type: String })
  value = '';

  render() {
    return html`
      <label for="input"><slot></slot></label>
      <input
        id="input"
        .value="${live(this.value)}"
        @input="${this.#onInput}"
      >
    `;
  }

  #onInput({ target }: { target: HTMLInputElement }): void {
    this.value = target.value;
  }
}
```

Including the `requiredValidator` adds a validation function attached to the `valueMissing` validity state to the component instance.

> Note, this does require the element's prototype to actually have a `required` property defined.

### Validation Target

Every `FormControlMixin` element will need a public `validationTarget` which must be a focusable DOM element in the custom element's `shadowRoot`. In the event a control becomes invalid, this item will be focused on form submit for accessibility purposes. Failure to do so will cause an error to throw.

### Validators

This package contains a few standardized validators, though more could be added for various unconsidered use cases. So far, there are validators for:

- **required** (valueMissing) : fails when the element's `value` is falsy while the element's `required` property equals `true`
- **minlength** (rangeUnderflow) : fails if the length of the element's value is less than the defined `minLength`
- **maxlength** (rangeOverflow) : fails if the length of the element's value is greater than the defined `maxLength`
- **programmatic** (customError) : Allows setting a completely custom error state and message as a string.

If you have an idea for another standardized validator, please [Submit an issue](/../../issues) (preferred so that we can discuss) or [Send a PR](/../../pulls) with your ideas.

### Creating a custom validator

It is possible to create a custom validator object using the `Validator` interface:

```typescript
export interface Validator {
  attribute?: string;
  key?: string;
  message: string | ((instance: any, value: any) => string);
  callback(instance: HTMLElement, value: any): boolean;
}
```

| Property  | Type                                                | Required | Description                                                                                                                                                                                                                                                                                    |
| --------- | --------------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| attribute | `string`                                            | true     | If defined, adds the specified attribute to the element's `observedAttributes` and the validator will run when the provided attribute changed                                                                                                                                                  |
| key       | `string`                                            | -        | String name of one of the fields in the `ValidityState` object to override on validator change. If `key` is not set, it is assumed to be `customError`.                                                                                                                                        |
| message   | `string \| ((instance: any, value: any) => string)` | true     | When set to a string, the `message` will equal the string passed in. If set to a function, the validation message will be the returned value from the callback. The message callback takes two arguments, the element instance and the control's form value (not the element's value property) |
| callback  | `(instance: any, value: any) => boolean`            | true     | When `callback` returns `true`, the validator is considered to be in a valid state. When the callback returns `false` the validator is considered to be in an invalid state.                                                                                                                   |

#### Example custom validator

So, a validator that would key off an `error` attribute to attach a programatic validation to an input might look like this:

```typescript
export const programaticValidator: Validator = {
  attribute: 'error',
  message(instance: HTMLElement & { error: string }): string {
    return instance.error;
  },
  callback(instance: HTMLElement & { error: string }): boolean {
    return !instance.error;
  }
};
```

### Validating a control as a group

It is possible to evaluate the validity of a set of controls as a group (similar to a radio button) where if one control in the group doesn't meet some criteria the validation fails. To enable this behavior, you need to set the components static property `formControlValidationGroup` to `true`. The following example emulates how the native `required` property interacts with `input[type="radio"]`.

```typescript
import { FormControlMixin } from '@open-wc/form-control';
import { LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('fc-radio')
class FcRadio extends FormControlMixin(LitElement) {
  /** Enable group validation behavior */
  static formControlValidationGroup = true;

  /** Custom validator logic */
  static formControlValidators = [
    {
      attribute: 'required',
      key: 'valueMissing',
      message: 'Please select an item', 
      callback(instance, value) {
        const rootNode = instance.getRootNode();
        const selector = `${instance.localName}[name="${instance.getAttribute('name')}"]`;
        const group = Array.from(rootNode.querySelectorAll(selector));
        const isChecked = group.some(instance => instance.checked);
        const isRequired = group.some(instance => instance.required);
        
        if (isRequired && !isChecked) {
          return false;
        }
        
        return true;
      }
    }
  ];
}
```