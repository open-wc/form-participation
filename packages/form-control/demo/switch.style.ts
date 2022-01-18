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
:host(:not([checked]):hover), :host(:not([checked]):focus) {
  background: #cccccc;
}
:host(:not([checked]):active) {
  background: #bbbbbb;
}
:host(:hover)::after, :host(:focus)::after {
  background: #f6f6f6;
}
:host(:active)::after {
  background: #eeeeee;
}
:host([checked]) {
  background: ForestGreen;
}
:host([checked]:hover) {
  background: Green;
}
:host([checked]:focus) {
  background: Green;
}
:host([checked]:active) {
  background: DarkGreen;
}
:host(:hover) {

}
:host([checked])::after {
  left: calc(100% - 24px);
}
@media (prefers-reduced-motion: reduce) {
  :host::after {
    transition: none;
  }
}`);
export default sheet;
