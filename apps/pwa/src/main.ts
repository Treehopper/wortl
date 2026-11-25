import { mount } from 'svelte';
import { registerSW } from 'virtual:pwa-register';
import App from './App.svelte';
import './app.css';

// A new version takes over at the next start, without reloading the open page: after such a reload an iPhone
// home-screen app sometimes gets a viewport short by the status bar's height, cutting off the keyboard.
registerSW({ immediate: true, onNeedReload: () => {} });

export default mount(App, { target: document.getElementById('app')! });
