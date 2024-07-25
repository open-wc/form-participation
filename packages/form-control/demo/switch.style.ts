import 'construct-style-sheets-polyfill';

const sheet = new CSSStyleSheet();
sheet.replace(`
:host {
  background: ButtonFace;
  border: 1px solid #343434;
  border-radius: 999999px;
  cursor: pointer;
  display: inline-block;
  height: 24px;
  position: relative;
  transition: 0.1s ease-in color;
  width: 48px;
}
:host::after {
  aspect-ratio: 1;
  background: #ffffff;
  border: 1px solid #343434;
  border-radius: 50%;
  content: "";
  display: block;
  height: calc(100% - 4px);
  transition: 0.1s ease-in all;
  position: absolute;
    top: 1px;
    left: 1px;
}
:host(:not(:is(:--checked, :state(checked))):hover), :host(:not(:is(:--checked, :state(checked))):focus) {
  background: #cccccc;
}
:host(:not([state--checked]):hover), :host(:not([state--checked]):focus) {
  background: #cccccc;
}
:host(:not(:is(:--checked, :state(checked))):active) {
  background: #bbbbbb;
}
:host(:not([state--checked]):active) {
  background: #bbbbbb;
}
:host(:hover)::after, :host(:focus)::after {
  background: #f6f6f6;
}
:host(:active)::after {
  background: #eeeeee;
}
:host(:is(:--checked, :state(checked))) {
  background: ForestGreen;
}
:host([state--checked]) {
  background: ForestGreen;
}
:host(:is(:--checked, :state(checked)):hover) {
  background: Green;
}
:host([state--checked]:hover) {
  background: Green;
}
:host(:is(:--checked, :state(checked)):focus) {
  background: Green;
}
:host([state--checked]:focus) {
  background: Green;
}
:host(:is(:--checked, :state(checked)):active) {
  background: DarkGreen;
}
:host([state--checked]:active) {
  background: DarkGreen;
}
:host(:is(:--checked, :state(checked)))::after {
  left: calc(100% - 24px);
}
:host([state--checked])::after {
  left: calc(100% - 24px);
}
@media (prefers-reduced-motion: reduce) {
  :host::after {
    transition: none;
  }
}`);
export default sheet;
