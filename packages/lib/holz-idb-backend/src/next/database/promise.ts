/** Resolves with the request's result, or rejects with its error. */
export const promisifyRequest = <T>(request: IDBRequest<T>): Promise<T> => {
  const { promise, resolve, reject } = Promise.withResolvers<T>();

  request.onsuccess = () => resolve(request.result);
  request.onerror = () => {
    const error =
      request.error ??
      new Error('IndexedDB request failed.', { cause: request });

    reject(error);
  };

  return promise;
};
