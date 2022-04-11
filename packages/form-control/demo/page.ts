import 'element-internals-polyfill';

const form = document.getElementById('form') as HTMLFormElement;
const litControl = document.querySelector('lit-control');

form!.addEventListener('submit', (event: Event) => {
  event.preventDefault();
  const data = new FormData(event.target as HTMLFormElement);
  console.log({
    switch: data.get('switch'),
    complex: data.get('complex-demo')
  });
});
