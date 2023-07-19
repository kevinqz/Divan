// store.js
import { writable } from 'svelte/store';

const createPersistentStore = (key, startValue) => {
  const storedValue = localStorage.getItem(key);
  const store = writable(storedValue === null ? startValue : JSON.parse(storedValue));

  store.subscribe(value => {
    localStorage.setItem(key, JSON.stringify(value));
  });

  return store;
};

// initial value is empty or you can add a default value
export const whisperAPIKey = createPersistentStore('whisperAPIKey', '');
