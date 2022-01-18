const form = document.getElementById('form') as HTMLFormElement;
const litControl = document.querySelector('lit-control');

form!.addEventListener('submit', (event: Event) => {
  event.preventDefault();
  const data = new FormData(event.target as HTMLFormElement);
  console.log({
    litControl: data.get('lit-control'),
    legacyDemo: data.get('legacy-demo'),
    vanillaDemo: data.get('vanilla-demo'),
    switch: data.get('switch'),
    demoEl: data.get('demo-el')
  });
});

// litControl!.addEventListener('input', (event: Event) => {
//     if (event.target.value === 'fooo') {
//         event.target.error = 'That is a silly response';
//     }
// });
