import Controller from '../../lib/controller';
import Registry from '../../lib/registry';
import {
  Result,
  BrowserRequest,
  Request,
  Source,
  AsyncAction,
  AsyncRequest,
  SyncAction,
  AsyncMiddlewareAction,
  SyncMiddlewareAction
} from '../../lib/model';
import { Event } from '../../lib/events';

declare let window: any;

const registry = new Registry();
const controller = new Controller(registry);

const DEFAULT_TIMEOUT = 1000;

if (window.vrpchandler === undefined) {
  window.vrpchandler = {};
}

window.vrpchandler.noreply = (request: AsyncRequest) => controller.noReply(request);

window.vrpchandler.creply = (request: Request) => {
  if (request === undefined || request === null) {
    return;
  }

  controller.reply(request, (result: Result) => mp.trigger(Event.Client.ReceiveFromBrowser, JSON.stringify(result)));
};

window.vrpchandler.sreply = (request: Request) => {
  if (request === undefined || request === null) {
    return;
  }

  controller.reply(request, (result: Result) => mp.trigger(Event.Client.RedirectBrowserToServer, JSON.stringify(result)));
};

window.vrpchandler.ccallback = (result: Result) => {
  if (result === undefined || result === null) {
    return;
  }

  controller.receive(result);
};

window.vrpchandler.scallback = (result: Result) => {
  if (result === undefined || result === null) {
    return;
  }

  controller.receive(result);
};

/**
 * Register an asynchronous procedure
 *
 * @param name The name of the procedure
 * @param method The procedure method
 */
export function registerAsyncProcedure(name: string, method: AsyncAction): void {
  registry.registerAsyncProcedure(
    name,
    method
  );
}

/**
 * Register a synchronous procedure
 *
 * @param name The name of the procedure
 * @param method The procedure method
 */
export function registerSyncProcedure(name: string, method: SyncAction): void {
  registry.registerSyncProcedure(
    name,
    method
  );
}

/**
 * Call an asynchronous procedure on the client
 *
 * @param name The name of the procedure
 * @param args The arguments to pass to the procedure
 */
export function callClientAsync<TArgs>(name: string, args?: TArgs): void {
  controller.callAsync<TArgs | undefined>(
    name,
    (request) => mp.trigger(Event.Noreply, JSON.stringify(request)),
    args
  );
}

/**
 * Call an asynchronous procedure on the server
 *
 * @param name The name of the procedure
 * @param args The arguments to pass to the procedure
 */
export function callServerAsync<TArgs>(name: string, args?: TArgs): void {
  controller.callAsync<TArgs | undefined>(
    name,
    (request) => mp.trigger(Event.Client.RedirectNoreplyToBrowser, JSON.stringify(request)),
    args
  );
}

/**
 * Call a synchronous procedure on the client
 *
 * @param name The name of the procedure
 * @param args The arguments to pass to the procedure
 * @param timeout The maximum waiting time for the call
 */
export function callClientSync<TResult, TArgs = undefined>(
  name: string,
  args?: TArgs,
  timeout: number = DEFAULT_TIMEOUT
): Promise<TResult> {
  if (window.vrpchandler.uid === undefined) {
    return new Promise<TResult>((_, r) => r('no uid defined'));
  }

  return controller.callSync<TArgs | undefined, TResult>(
    name,
    timeout,
    Source.Cef,
    (request) => mp.trigger(Event.Client.ReplyToBrowser, JSON.stringify({
                   Name: request.Name,
                   Id: request.Id,
                   BrowserId: window.vrpchandler.uid as number,
                   Source: Source.Cef,
                   Args: request.Args,
                 } as BrowserRequest)),
    args
  );
}

/**
 * Call a synchronous procedure on the server
 *
 * @param name The name of the procedure
 * @param args The arguments to pass to the procedure
 * @param timeout The maximum waiting time for the call
 */
export function callServerSync<TResult, TArgs = undefined>(
  name: string,
  args?: TArgs,
  timeout: number = DEFAULT_TIMEOUT
): Promise<TResult> {
  if (window.vrpchandler.uid === undefined) {
    return new Promise<TResult>((_, r) => r('no uid defined'));
  }

  return controller.callSync<TArgs | undefined, TResult>(
    name,
    timeout,
    Source.Cef,
    (request) => mp.trigger(Event.Client.RedirectBrowserToServer, JSON.stringify({
                   Name: request.Name,
                   Id: request.Id,
                   BrowserId: window.vrpchandler.uid as number,
                   Source: Source.Cef,
                   Args: request.Args,
                 } as BrowserRequest)),
    args
  );
}

/**
 * Register a middleware for async incoming requests.
 */
export function registerAsyncMiddleware(mw: AsyncMiddlewareAction): void {
  controller.registerAsyncMiddleware(mw);
}

/**
 * Register a middleware for sync incoming requests.
 */
export function registerSyncMiddleware(mw: SyncMiddlewareAction): void {
  controller.registerSyncMiddleware(mw);
}

export default {
  registerAsyncProcedure,
  registerSyncProcedure,
  callClientAsync,
  callClientSync,
  callServerAsync,
  callServerSync
};
