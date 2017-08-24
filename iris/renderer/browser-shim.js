// @flow
// Shim some browser stuff we use in the client for server-side rendering
// NOTE(@mxstbr): We should be getting rid of this over time
global.window = {
  location: {
    protocol: 'https:',
    host: 'spectrum.chat',
    hash: '',
  },
};
var localStorage = require('localstorage-memory');
global.localStorage = localStorage;
global.navigator = {
  userAgent: '',
};
