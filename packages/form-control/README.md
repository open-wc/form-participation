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

### Public API

The `FormControlMixin` adds several methods to the element's prototype

#### setValue

`setValue(value: FormData) => void`

The `setValue` method takes an argument of `FormValue` which is equal to `string | FormData | FileData | null`. This the value passed into this method will be attached to the element's parent form using the element's `name` attribute. 

A common use case for this would look something like the following

```typescript
import { FormControlMixin } from '@open-wc/form-control';

class CustomFormControl extends FormControlMixin(HTMLElement) {
  private _value: string;

  set value(newValue: string) {
    this._value = newValue;
    this.setValue(newValue);
  }

  get value(): string {
    return this._value;
  }
}
```

The above example—using `HTMLElement` as the mixed class—will now respond to changes to the element's value property by attaching the element's value to its associated form.

Using `LitElement` the above example might look like:

```typescript
import { LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { FormControlMixin } from '@open-wc/form-control';

export class CustomControlLit extends FormControlMixin(LitElement) {
  @property()
  value: string = '';

  updated(changedProperties: Map<string, unknown>): void {
    if (changedProperties.has('value')) {
      this.setValue(this.value);
    }
  }
}
```

#### shouldFormValueUpdate

`shouldFormValueUpdate() => boolean`

The `shouldFormValueUpdate` method is called internally before a call to `ElementInternals.prototype.setFormValue`. If the method returns `true` the value passed ot `setValue` will be added to the form; otherwise an empty value will be passed. This is useful for emulating behavior like that of a radio or checkbox.

```typescript
import { FormControlMixin } from '@open-wc/form-control';

export class CustomControl extends FormControlMixin(HTMLElement) {
  _checked = false;
  _value = '';

  set checked(newChecked: boolean) {
    this._checked = newChecked;
    this.setValue(this.value);
  }

  get checked(): boolean {
    return this._checked;
  }

  set value(newValue: string) {
    this._value = newValue;
    this.setValue(newValue);
  }

  get value(): string {
    return this._value;
  }

  shouldFormValueUpdate(): boolean {
    return this.checked;
  }
}
```

For `LitElement` this example might look like

```typescript
import { LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { FormControlMixin } from '@open-wc/form-control';

export class CustomControlWithLit extends FormControlMixin(LitElement) {
  @property({ type: Boolean })
  checked = false;

  @property()
  value = '';

  shouldFormValueUpdate(): boolean {
    return this.checked;
  }

  updated(changedValues: Map<string, unknown>): void {
    if (changedProperties.has('checked') || changedProperties.has('value')) {
      this.setValue(this.value);
    }
  }
}
```

Both of the above examples will update the element's form value when either the `checked` or `value` properties are set.

#### resetFormControl

`resetFormControl() => void`

The `resetFormControl` lifecycle method is called when a control's form is reset either via a button or the `HTMLFormElement.prototype.reset` method. This is a place to clean up the form control's values and settings. For example, if creating a custom checkbox or radio button, you might use this method to restore the element's `checked` state.

```typescript
import { FormControlMixin } from '@open-wc/form-control';

export class CustomControl extends FormControlMixin(HTMLElement) {
  /** Built on from the exampels in setValue and shouldFormValueUpdate */

  resetFormControl(): void {
    this.checked = this.hasAttribute('checked');
  }
}
```

#### validityCallback

`validityCallback(key: keyof ValidityState) => string | void`

The `validityCallback` is used to override the controls' validity message for a given Validator key. This has the highest level of priority when setting a validationMessage, so use this method wisely.

To use this method you must also call the the `FormControlMixin`'s validation API. The following example will be the same for both `HTMLElement` and `LitElement` and assumes the built-in `requiredValidator` is used.

```typescript
import { FormControlMixin, requiredValidator } from '@open-wc/form-control';

export class CustomControl extends FormControlMixin(HTMLElement) {
  static formControlValidators = [requiredValidator];

  validityCallback(key: keyof ValidityState): boolean {
    if (key === 'valueMissing') {
      return 'This is a custom error message for valueMissing errors';
    }
  }
}
```

#### validationTarget

The `validationTarget` is required when using the validation API should be an element inside the custom element's shadow root that is capable of receiving focus. Per the DOM spec (and accessibility best practices) the first validation target in source order will receive focus whenever a form is submitted or the element's `requestValidity` method is called.

In the event a control becomes invalid, this item will be focused on form submit for accessibility purposes. Failure to do so will cause an error to throw.

This can be a getter or a property:

```typescript
import { FormControlMixin, requiredValidator } from '@open-wc/form-control';

const template = `<label for="input"><slot></slot></label>
<input id="input">`;

export class CustomControl extends FormControlMixin(HTMLElement) {
  static formControlValidators = [requiredValidator];

  constructor() {
    super();
    const root = this.attachShadow({ mode: 'open' });
    root.append(template.contents.cloneNode(true));
  }

  get validationTarget(): HTMLInputElement {
    return this.shadowRoot.querySelector<HTMLInputElement>('input');
  }
}
```

or in Lit you will likely want to use the `query` decorator

```typescript
import { html, LitElement, TemplateResult } from 'lit';
import { query } from 'lit/decorators.js';
import { FormControlMixin, requiredValidator } from '@open-wc/form-control';

export class CustomControl extends FormControlMixin(LitElement) {
  static formControlValidators = [requiredValidator];

  @query('input')
  validationTarget: HTMLInputElement;

  render(): TemplateResult {
    return html`<label for="input"><slot></slot></label>
    <input type="text" id="input">`;
  }
}
```

#### validationMessageCallback

`validationMessageCallback(validitionMessage: string): void`

The `validationMessageCallback` is an opinionated method that is called when the form control mixin believes a displayed validation message should be changed. This will will clear the message on the host focus and on value changes but will re-introduce the message whenever the element becomes blurred again. 

```typescript
import { FormControlMixin, requiredValidator } from '@open-wc/form-control';

export class CustomControl extends FormControlMixin(HTMLElement) {
  static formControlValidators = [requiredValidator];

  constructor() {
    super();
    const root = this.attachShadow({ mode: 'open' });
    const span = document.createElement('span');
    root.append(span);
  }

  validationMessageCallback(message: string): void {
    this.shadowRoot.querySelector('span').innerText = message;
  }
}
```

This is a partial example but would attach a message to a span element whenever the mixin assumes it should be attached. This might not meet all use cases. Other access to the validationMessage can be accessed directly on `this.internals.validationMessage`.

A more complete example in Lit might look something like 

```typescript
import { css, html, LitElement, TemplateResult } from 'lit';
import { property, query } from 'lit/decorators.js';
import { live } from 'lit/directives/live.js';
import { FormControlMixin, requiredValidator } from '@open-wc/form-control';

export class CustomControl extends FormControlMixin(LitElement) {
  static formControlValidator = [requiredValidator];
  static styles = css`
    /** Custom styles here potentially for a design system */
  `;

  @property({ type: Boolean, reflect: true })
  required = false;

  @property()
  value = '';

  @property()
  validationMessage = '';

  @query('input')
  validationTarget: HTMLInputElement;

  render(): TemplateResult {
    return html`
    <label for="input"><slot></slot></label>
    <input
      aria-describedby="helper-text"
      id="input"
      type="text"
      .required="${live(this.required)}"
      .value="${live(this.value)}"
      @input="${this._onChange}"
    >
    <span id="helper-text">${this.validationMessage}<span>`;
  }

  validationMessageCallback(message: string): void {
    this.validationMessage = message;
  }

  updated(changedProperties: Map<string, unknown>): void {
    if (changedProperties.has('value')) {
      this.setValue(this.value);
    }
  }

  private _onChange(event: Event & { target: HTMLInputElement}): void {
    this.value = event.target.value;
  }
}
```

### ElementInternals

This library makes use of [ElementInternals](https://developer.mozilla.org/en-US/docs/Web/API/ElementInternals) features. As of the time of writing `ElementInternals` features are fully supported in Chrome, partially supported in Firefox and being strongly considered by Webkit.

In order to make these features work in all browsers you will need to include the [element-internals-polyfill](https://www.npmjs.com/package/element-internals-polyfill). Refer to the `element-internals-polyfill` documentation for installation and usage instructions.

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

  updated(changedProperties: Map<string, unknown>): void {
    if (changedProperties.has('value')) {
      this.setValue(this.value);
    }
  }

  #onInput({ target }: { target: HTMLInputElement }): void {
    this.value = target.value;
  }
}
```

Including the `requiredValidator` adds a validation function attached to the `valueMissing` validity state to the component instance.

> Note, this does require the element's prototype to actually have a `required` property defined.

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
  isValid(instance: HTMLElement, value: any): boolean;
}
```

| Property  | Type                                                | Required | Description                                                                                                                                                                                                                                                                                    |
| --------- | --------------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| attribute | `string`                                            | true     | If defined, adds the specified attribute to the element's `observedAttributes` and the validator will run when the provided attribute changed                                                                                                                                                  |
| key       | `string`                                            | -        | String name of one of the fields in the `ValidityState` object to override on validator change. If `key` is not set, it is assumed to be `customError`.                                                                                                                                        |
| message   | `string \| ((instance: any, value: any) => string)` | true     | When set to a string, the `message` will equal the string passed in. If set to a function, the validation message will be the returned value from the callback. The message callback takes two arguments, the element instance and the control's form value (not the element's value property) |
| isValid  | `(instance: any, value: any) => boolean`            | true     | When `isValid` returns `true`, the validator is considered to be in a valid state. When the `isValid` callback returns `false` the validator is considered to be in an invalid state.                                                                                                                   |

#### Example custom validator

So, a validator that would key off an `error` attribute to attach a programatic validation to an input might look like this:

```typescript
export const programaticValidator: Validator = {
  attribute: 'error',
  message(instance: HTMLElement & { error: string }): string {
    return instance.error;
  },
  isValid(instance: HTMLElement & { error: string }): boolean {
    return !instance.error;
  }
};
```

Validators come in two varieties: synchronous and asynchronous. The most common pattern for validators are synchronous. This means that the `isValid` method directly returns the validity of the object in real time. Asynchronous validators, on the other hand return a `Promise<boolean|void>` indicating the validity state of the validator where a `Promise<void>` value has no effect on the validity status. 

Because its possible for an asynchronous validator to run multiple times in rapid succession, the `Validator.isValid` method provides a third argument called an [abort signal](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal). This signal will be aborted during the next validatation run. This allows developers to respond to frequent validation requests and cancel any long-running validatons.

Let's look at an naive example of an async validator:

```typescript
import { AsyncValidator, FormValue } from '@open-wc/form-control';

const sleepValidator: AsyncValidator = {
  message: 'Hello world',
  isValid(instance: AsyncValidatorDemo, value: FormValue, signal: AbortSignal): Promise<boolean|void> {
    if (signal.aborted) {
      return Promise<void>.resolve();
    }

    return new Promise((resolve) => {
      const id = setTimeout(() => {
        resolve(value === 'foo');
      }, 2000);

      signal.addEventListener('abort', () => {
        clearTimeout(id);
        console.log(`abort for value ${value}`);
        resolve();
      });
    });
  }
}
```

Here we can see the `isValid` method returns a `Promise` object that evaluates the `value` and returns sets the control to valid if and only if the value is exactly equal to the string `'foo'`. This validator creates some asynchronous behavior by utilizing the `setTimeout` function which will wait at minimum two seconds before finally validating the control.

When the `signal` dispatches an abort event, the validator cancels its the timeout, logs some information to the developer about the validator not running for the current value and resolves. This will only happen when the validation cycle is kicked off again before all validators in the chain finish.

For more information on `AbortController` and `AbortSignal`, see this post from [@samthor](https://twitter.com/samthor) titled [_AbortController is your friend_](https://whistlr.info/2022/abortcontroller-is-your-friend/).

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
      isValid(instance, value) {
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
