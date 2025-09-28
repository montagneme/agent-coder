import React from 'react';
import ReactDOM from 'react-dom';
import * as requestContext from './requestContext';
import * as dependContext from './dependContext';
import useGlobalState from './stateContext';
import { loadScript, loadStylesheet } from '../utils';
import dayjs from 'dayjs';
declare global {
  interface Window {
    context?: any;
    loadScript: (url: string) => Promise<void>;
    loadStylesheet: (url: string) => Promise<void>;
    dayjs: typeof dayjs;
  }
}

function injectContext() {
  window.React = React;
  window.ReactDOM = ReactDOM;
  window.loadScript = loadScript;
  window.loadStylesheet = loadStylesheet;
  window.dayjs = dayjs;
  window.context = {
    request: requestContext,
    depend: dependContext,
    state: useGlobalState
  };
};
export default injectContext;