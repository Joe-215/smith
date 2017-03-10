import React from 'react';
import ReactDOM from 'react-dom';
import { Router, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ThemeProvider } from 'styled-components';
import Helmet from 'react-helmet';
import history from './helpers/history';
import { initStore } from './store';
import * as firebase from 'firebase';
import FIREBASE_CONFIG from './config/FirebaseConfig';
import { Body } from './App/style';
import Root from './Root';
import { loadStorage, saveStorage, clearStorage } from './helpers/localStorage';
import { debounce } from './helpers/utils';

const fbconfig = {
  apiKey: FIREBASE_CONFIG.API_KEY,
  authDomain: FIREBASE_CONFIG.AUTH_DOMAIN,
  databaseURL: FIREBASE_CONFIG.DB_URL,
  storageBucket: FIREBASE_CONFIG.STORAGE_BUCKET,
  messagingSenderId: FIREBASE_CONFIG.MESSAGING_SENDER_ID,
};

firebase.initializeApp(fbconfig);
let store;
// In production load previously saved data from localStorage
if (process.env.NODE_ENV === 'production') {
  let localStorageState = loadStorage();
  store = initStore(localStorageState);

  // sync the store with localstorage
  let state = store.getState();
  store.subscribe(
    debounce(
      saveStorage({
        user: state.user,
        frequencies: state.frequencies,
        stories: state.stories,
      }),
      1000,
    ),
  );
} else {
  store = initStore({});
}

// This is globally available in styled-components when interpolating a function like so:
// ${(props) => props.theme}
// Or using import { withTheme } from 'styled-components';
const theme = {
  brand: {
    default: '#3818E5',
    alt: '#7B16FF',
  },
  space: {
    dark: '#0F015E',
    light: '#031957',
  },
  warn: {
    default: '#E3353C',
    alt: '#E2197A',
  },
  success: {
    default: '#00C383',
    alt: '#03AAFB',
  },
  bg: {
    default: '#FFFFFF',
    reverse: '#171A21',
    wash: '#f6f7f8',
  },
  text: {
    default: '#171A21',
    alt: '#747E8D',
    reverse: '#FFFFFF',
    placeholder: '#B2B9C6',
  },
  generic: {
    default: '#E6ECF7',
    alt: '#F6FBFF',
  },
  inactive: '#D6E0EE',
  border: {
    default: '#DFE7EF',
  },
  social: {
    facebook: {
      default: '#3b5998',
      alt: '#5A85DF',
    },
    twitter: {
      default: '#00aced',
      alt: '#53D0FF',
    },
  },
};

const render = () => {
  ReactDOM.render(
    <Provider store={store}>
      <Router history={history}>
        <ThemeProvider theme={theme}>
          <Body>
            <Helmet
              title="Spectrum"
              meta={[
                {
                  name: 'description',
                  content: 'Like a forum but for Mars colonists.',
                },
                // Open Graph
                { name: 'og:title', content: 'Spectrum' },
                {
                  name: 'og:description',
                  content: 'Like a forum but for Mars colonists.',
                },
                { name: 'og:url', content: 'https://spectrum.chat' },
                { name: 'og:type', content: 'website' },
                { name: 'og:image', content: '/img/media.png' },
                { name: 'og:site_name', content: 'Spectrum' },
                // Twitter
                { name: 'twitter:card', content: 'summary_large_image' },
                { name: 'twitter:site', content: '@withspectrum' },
                { name: 'twitter:title', content: 'Spectrum' },
                {
                  name: 'twitter:description',
                  content: 'Like a forum but for Mars colonists.',
                },
                { name: 'twitter:image', content: '/img/media.png' },
                {
                  name: 'twitter:image:alt',
                  content: 'Like a forum but for Mars colonists.',
                },
              ]}
            />

            <Route exact path="/(\~?):frequency?/:story?" component={Root} />
          </Body>
        </ThemeProvider>
      </Router>
    </Provider>,
    document.querySelector('#root'),
  );
};

try {
  render();
} catch (err) {
  clearStorage();
  render();
}
