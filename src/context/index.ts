import * as requestContext from './requestContext';
import * as dependContext from './dependContext';
import useGlobalState from './stateContext';
declare global {
  interface Window {
    context?: any;
  }
}

function injectContext () {
    window.context = {
        request: requestContext,
        depend: dependContext,
        state: useGlobalState
    };
};
export default injectContext;