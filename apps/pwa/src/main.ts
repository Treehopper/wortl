import { mount } from 'svelte';
import { registerSW } from 'virtual:pwa-register';
import App from './App.svelte';
import { isStandalone } from './lib/app.js';
import './app.css';

// An iPhone home-screen app sometimes gets a viewport short by the status bar's height, e.g. after the reload
// that installs an update, leaving a gap below the keyboard. The screen size does not shrink, so size by it.
if (/iPhone|iPod/.test(navigator.userAgent) && isStandalone()) {
  const fit = () =>
    document.documentElement.style.setProperty('--app-height', `${innerWidth < innerHeight ? screen.height : screen.width}px`);
  fit();
  addEventListener('resize', fit);
}

registerSW({ immediate: true });

export default mount(App, { target: document.getElementById('app')! });
