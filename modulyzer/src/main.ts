import { Appl } from './App';

const app = new Appl();

const el = app.render();

const mountPoint = document.querySelector("#app")!;
mountPoint.appendChild(el);

window["app"] =app;