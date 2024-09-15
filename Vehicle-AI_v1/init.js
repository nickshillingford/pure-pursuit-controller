import { Application } from './Application.js';

paper.setup(document.getElementById('paper-canvas'));

fetch('./data.json')
    .then(response => response.json())
    .then(data => {
      new Application(data);
    })
    .catch(error => {
      console.error('Error:', error);
    });
