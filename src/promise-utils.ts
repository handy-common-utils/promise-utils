/* eslint-disable unicorn/no-null */
/* eslint-disable no-await-in-loop */

export const FIBONACCI_SEQUENCE = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987, 1597, 2584, 4181, 6765, 10946, 17711, 28657, 46368, 75025, 121393, 196418, 317811];

export enum PromiseState {
  Pending = 'Pending',
  Fulfilled = 'Fulfilled',
  Rejected = 'Rejected',
}

export abstract class PromiseUtils {
  /**
   * Do an operation repeatedly and collect all the results.
   * This function is useful for client side pagination.
   *
   * @example
   * const domainNameObjects = await PromiseUtils.repeat(
   *   pagingParam => apig.getDomainNames({limit: 500, ...pagingParam}).promise(),
   *   esponse => response.position? {position: response.position} : null,
   *   (collection, response) => collection.concat(response.items!),
   *   [] as APIGateway.DomainName[],
   * );
   *
   * @template Result type of the operation result
   * @template Param  type of the input to the operation, normally the input is a paging parameter
   * @template Collection type of the returned value of this function
   *
   * @param operation a function that takes paging parameter as input and outputs a result, normally the operation supports paging
   * @param nextParameter The function for calculating next parameter from the operation result.
   *                      Normally the parameter controls paging,
   *                      This function should return null when next invocation of the operation function is not desired.
   *                      If next invocation is desired, the return value of this function can be a Promise or not a Promise.
   * @param collect the function for merging operation result into the collection
   * @param initialCollection initial collection which would be the first argument passed into the first invocation of the collect function
   * @param initialParameter the parameter for the first operation
   * @returns Promise of collection of all the results returned by the operation function
   *
   */
  // eslint-disable-next-line max-params
  static async repeat<Result, Param, Collection>(
    operation: (parameter: Partial<Param>) => Promise<Result>,
    nextParameter: (response: Result) => Partial<Param> | Promise<Partial<Param>> | null,
    collect: (collection: Collection, result: Result) => Collection,
    initialCollection: Collection,
    initialParameter: Partial<Param> = {},
  ): Promise<Collection> {
    let collection = initialCollection;
    let param: Partial<Param> = initialParameter;
    do {
      // eslint-disable-next-line no-await-in-loop
      const result = await operation(param);
      collection = collect(collection, result);
      const paramOrPromise = nextParameter(result);
      if (paramOrPromise === null) {
        break;
      }
      param = await paramOrPromise;
    } while (true);
    return collection;
  }

  /**
   * Do an operation repeatedly until a criteria is met.
   *
   * @example
   * const result = await PromiseUtils.withRetry(() => doSomething(), [100, 200, 300, 500, 800, 1000]);
   *
   * @template Result type of the operation result
   * @template TError  type of the possible error that could be generated by the operation
   *
   * @param operation a function that outputs a Promise result, normally the operation does not use its arguments
   * @param backoff Array of retry backoff periods (unit: milliseconds) or function for calculating them.
   *                If retry is desired, before making next call to the operation the desired backoff period would be waited.
   *                If the array runs out of elements or the function returns `undefined` or either the array or the function returns a negative number,
   *                there would be no further call to the operation.
   *                The `attempt` argument passed into backoff function starts from 2 because only retries need to backoff,
   *                so the first retry is the second attempt.
   * @param shouldRetry Predicate function for deciding whether another call to the operation should happen.
   *                    If this argument is not defined, retry would happen whenever the operation rejects with an error.
   *                    `shouldRetry` would be evaluated before `backoff`.
   *                    The `attempt` argument passed into shouldRetry function starts from 1.
   * @returns Promise of the operation result potentially with retries already applied
   */
  static async withRetry<Result, TError = any>(
    operation: (attempt: number, previousResult: Result|undefined, previousError: TError|undefined) => Promise<Result>,
    backoff: Array<number> | ((attempt: number, previousResult: Result|undefined, previousError: TError|undefined) => number|undefined),
    shouldRetry: (previousError: TError|undefined, previousResult: Result|undefined, attempt: number) => boolean = (previousError, _previousResult, _attempt) => previousError !== undefined,
  ): Promise<Result> {
    type OperationOutcome = {result?: Result; error?: TError};
    let attempt = 1;
    const finalOutcome = await PromiseUtils.repeat<OperationOutcome, OperationOutcome, OperationOutcome>(
      (previousOutcome: Partial<OperationOutcome>) => operation(attempt, previousOutcome.result, previousOutcome.error).then(result => ({ result })).catch(error => ({ error })),
      outcome => {
        if (!shouldRetry(outcome.error, outcome.result, attempt)) {
          return null;
        }
        const backoffMs = Array.isArray(backoff) ? backoff[attempt - 1] : backoff(attempt, outcome.result, outcome.error);
        if (backoffMs == null || backoffMs < 0) {
          return null;
        }
        attempt++;
        return PromiseUtils.delayedResolve(backoffMs, outcome);
      },
      (_, outcome) => outcome,
      {}, // it is actually not used
    );
    if (finalOutcome.error !== undefined) {
      throw finalOutcome.error;
    }
    return finalOutcome.result!;
  }

  /**
   * Run multiple jobs/operations in parallel.
   *
   * @example
   * const topicArns = topics.map(topic => topic.TopicArn!);
   * await PromiseUtils.inParallel(5, topicArns, async topicArn => {
   *   const topicAttributes = (await sns.getTopicAttributes({ TopicArn: topicArn }).promise()).Attributes!;
   *   const topicDetails = { ...topicAttributes, subscriptions: [] } as any;
   *   if (this.shouldInclude(topicArn)) {
   *     inventory.snsTopicsByArn.set(topicArn, topicDetails);
   *   }
   * });
   *
   * @template Data   Type of the job data, usually it would be an Array
   * @template Result Type of the return value of the operation function
   *
   * @param parallelism how many jobs/operations can be running at the same time
   * @param jobs        job data which will be the input to operation function.
   *                    This function is safe when there are infinite unknown number of elements in the job data.
   * @param operation   the function that turns job data into result asynchronously
   * @returns Promise of void if the operation function does not return a value,
   *          or promise of an array containing results returned from the operation function.
   *          In the array containing results, each element is either the fulfilled result, or the rejected error/reason.
   */
  static async inParallel<Data, Result, TError = Result>(
    parallelism: number,
    jobs: Iterable<Data>,
    operation: (job: Data, index: number) => Promise<Result>,
  ): Promise<Array<Result | TError>> {
    if (parallelism < 1) {
      parallelism = 1;
    }
    const jobResults = new Array<Result | TError>();
    let index = 0;
    const iterator = jobs[Symbol.iterator]();
    const promises = Array.from({ length: Math.floor(parallelism) }).fill(0).map(async _ => {
      let iteratorResult: IteratorResult<Data, any>;
      while (true) {
        iteratorResult = iterator.next();
        if (iteratorResult.done) {
          break;
        }
        const job = iteratorResult.value;
        const jobIndex = index++;
        const jobResultPromise = operation(job, jobIndex);
        jobResults[jobIndex] = await jobResultPromise.catch(error => error);
      }
    });
    await Promise.all(promises);
    return jobResults;
  }

  /**
   * Create a Promise that resolves after number of milliseconds specified
   * @param ms number of milliseconds after which the created Promise would resolve
   * @param result the result to be resolved for the Promise, or a function that supplies the reuslt.
   * @returns the new Promise created
   */
  static delayedResolve<T>(ms: number, result?: T | PromiseLike<T> | (() => (T | PromiseLike<T>))): Promise<T> {
    return new Promise(resolve => setTimeout(() => resolve(
      typeof result === 'function' ? (result as (() => T | PromiseLike<T>))() : result as T | PromiseLike<T>,
    ), ms));
  }

  /**
   * Create a Promise that rejects after number of milliseconds specified.
   * @param ms number of milliseconds after which the created Promise would reject
   * @param reason the reason of the rejection for the Promise, or a function that supplies the reason.
   * If the reason ends up to be a rejected Promise, then the outcome (could be fulfilled or rejected) of it will be the reject reason of the Promise returned.
   * @returns the new Promise created
   */
  static delayedReject<T = never, R = any>(ms: number, reason: R | PromiseLike<R> | (() => R|PromiseLike<R>)): Promise<T> {
    return new Promise((_resolve, reject) => setTimeout(() => {
      const r = typeof reason === 'function' ? (reason as (() => R|PromiseLike<R>))() : reason as R|PromiseLike<R>;
      Promise.resolve(r).catch(error => error).then(r => reject(r));
    }, ms));
  }

  /**
   * Apply timeout to a Promise. In case timeout happens, resolve to the result specified.
   * If timeout does not happen, the resolved result or rejection reason of the original Promise would be the outcome of the Promise returned from this function.
   * If timeout does not happen and the 'result' parameter is a function, the function won't be called.
   * The 'operation' parameter's rejection would not be handled by this function, you may want to handle it outside of this function,
   * just for avoiding warnings like "(node:4330) PromiseRejectionHandledWarning: Promise rejection was handled asynchronously".
   * @param operation the original Promise for which timeout would be applied
   * @param ms number of milliseconds for the timeout
   * @param result the result to be resolved in case timeout happens, or a function that supplies the reuslt.
   * @return the new Promise that resolves to the specified result in case timeout happens
   */
  static timeoutResolve<T>(operation: Promise<T>, ms: number, result?: T | PromiseLike<T> | (() => (T | PromiseLike<T>)) | undefined): Promise<T> {
    return Promise.race([
      operation,
      PromiseUtils.delayedResolve(
        ms,
        () => PromiseUtils.promiseState(operation)
                .then(state => state === PromiseState.Pending ?
                  (typeof result === 'function' ? (result as () => T|PromiseLike<T>|undefined)() : result) :
                  {} as any), // this object would not be used because the operation should have already resolved
      ),
    ]);
  }

  /**
   * Apply timeout to a Promise. In case timeout happens, reject with the reason specified.
   * If timeout does not happen, the resolved result or rejection reason of the original Promise would be the outcome of the Promise returned from this function.
   * If timeout does not happen and the 'rejectReason' parameter is a function, the function won't be called.
   * The 'operation' parameter's rejection would not be handled by this function, you may want to handle it outside of this function,
   * just for avoiding warnings like "(node:4330) PromiseRejectionHandledWarning: Promise rejection was handled asynchronously".
   * @param operation the original Promise for which timeout would be applied
   * @param ms number of milliseconds for the timeout
   * @param rejectReason the reason of the rejection in case timeout happens, or a function that supplies the reason.
   * @return the new Promise that rejects with the specified reason in case timeout happens
   */
  static timeoutReject<T = never, R = any>(operation: Promise<T>, ms: number, rejectReason: R | PromiseLike<R> | (() => R|PromiseLike<R>)): Promise<T> {
    return Promise.race([
      operation,
      PromiseUtils.delayedReject(
        ms,
        () => PromiseUtils.promiseState(operation)
                .then(state => state === PromiseState.Pending ?
                  (typeof rejectReason === 'function' ? (rejectReason as () => R|PromiseLike<R>)() : rejectReason) :
                  {}), // this object would not be used because the operation should have already resolved
      ),
    ]);
  }

  /**
   * Get the state of the Promise.
   * Please note that the returned value is a Promise, although it resolves immediately.
   * @param p the Promise for which we would like to know its state
   * @return A Promise that resolves immediately cotaining the state of the input Promise
   */
  static promiseState(p: Promise<any>): Promise<PromiseState> {
    const t = {};
    return Promise.race([p, t])
      .then(v => (v === t) ? PromiseState.Pending : PromiseState.Fulfilled, () => PromiseState.Rejected);
  }

  private static synchronizationLocks = new Map<any, Promise<any>>();

  /**
   * Equivalent of `synchronized` in Java.
   * In any situation there's no concurrent execution of any operation function associated with the same lock.
   * The operation function has access to the state (when `synchronized` is called), settledState (when the operation function is called),
   * and result (could be the fulfilled result or the rejected reason) of the previous operation.
   * In case there is no previous invocation, state, settledState and result would all be undefined.
   * @param lock        the object (could be a string, a number, or `this` in a class) that is used to apply the lock
   * @param operation   function for doing the computation and returning a Promise
   * @returns the result of the operation function
   */
  static async synchronized<T>(lock: unknown, operation: (previousState: PromiseState | undefined, previousSettledState: PromiseState | undefined, previousResult: any) => Promise<T>): Promise<T> {
    let resultPromise: Promise<T>;
    const previousResultPromise = PromiseUtils.synchronizationLocks.get(lock);
    let previousState: PromiseState | undefined;
    if (previousResultPromise !== undefined) {
      previousState = await PromiseUtils.promiseState(previousResultPromise);
    }
    switch (previousState) {
      case PromiseState.Pending:  // concurrency
        resultPromise = previousResultPromise!.then(result => operation(PromiseState.Pending, PromiseState.Fulfilled, result), error => operation(PromiseState.Pending, PromiseState.Rejected, error));
        break;
      case undefined: // no concurrency and no history
        // eslint-disable-next-line unicorn/no-useless-undefined
        resultPromise = operation(undefined, undefined, undefined);
        break;
      default:  // no concurrency but with history
        resultPromise = operation(previousState, previousState, await previousResultPromise!.catch(error => error));
        break;
    }

    PromiseUtils.synchronizationLocks.set(lock, resultPromise);
    return resultPromise;
  }
}

export const repeat = PromiseUtils.repeat;
export const withRetry = PromiseUtils.withRetry;
export const inParallel = PromiseUtils.inParallel;
export const delayedResolve = PromiseUtils.delayedResolve;
export const delayedReject = PromiseUtils.delayedReject;
export const timeoutResolve = PromiseUtils.timeoutResolve;
export const timeoutReject = PromiseUtils.timeoutReject;
export const synchronized = PromiseUtils.synchronized;
export const synchronised = PromiseUtils.synchronized;
export const promiseState = PromiseUtils.promiseState;
