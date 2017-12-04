// @flow
/**
 * The entry point for the server, this is where everything starts
 */
console.log('Server starting...');
const compression = require('compression');
const debug = require('debug')('iris');
debug('logging with debug enabled!');
import path from 'path';
import { createServer } from 'http';
import express from 'express';
import Loadable from 'react-loadable';
import Raven from 'shared/raven';
import { init as initPassport } from './authentication.js';
const IS_PROD = process.env.NODE_ENV === 'production';
const PORT = 3001;

// Initialize authentication
initPassport();

// API server
const app = express();

// Send all responses as gzip
app.use(compression());

import middlewares from './routes/middlewares';
app.use(middlewares);

import authRoutes from './routes/auth';
app.use('/auth', authRoutes);

import apiRoutes from './routes/api';
app.use('/api', apiRoutes);

// Use express to server-side render the React app
if (IS_PROD || process.env.SSR) {
  const renderer = require('./renderer').default;
  app.use(
    express.static(path.resolve(__dirname, '..', 'build'), { index: false })
  );
  app.get('*', renderer);
  console.log(
    `Web server running at http://localhost:${PORT} (server-side rendering enabled)`
  );
} else {
  console.log('Server-side rendering disabled for development');
}

const server = createServer(app);

const boot = () => {
  // Start webserver
  server.listen(PORT);

  // Start database listeners
  console.log(`GraphQL server running at http://localhost:${PORT}/api`);
};

import type { Loader } from './loaders/types';
export type GraphQLContext = {
  user: Object,
  loaders: {
    [key: string]: Loader,
  },
};

process.on('unhandledRejection', async err => {
  console.error('Unhandled rejection', err);
  try {
    await Raven.captureException(err);
  } catch (err) {
    console.error('Raven error', err);
  } finally {
    process.exit(1);
  }
});

process.on('uncaughtException', async err => {
  console.error('Uncaught exception', err);
  try {
    await Raven.captureException(err);
  } catch (err) {
    console.error('Raven error', err);
  } finally {
    process.exit(1);
  }
});

if (IS_PROD || process.env.SSR) {
  Loadable.preloadAll()
    .then(boot)
    .catch(async err => {
      try {
        await Raven.captureException(err);
      } catch (err) {
        console.error('Raven error', err);
      }
    });
} else {
  boot();
}
