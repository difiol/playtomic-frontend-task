import localforage from 'localforage'

export const authLocalStorage = localforage.createInstance({ name: 'my-app-auth' })
