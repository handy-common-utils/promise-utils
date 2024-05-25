/**
 * Array of 25 Fibonacci numbers starting from 1 up to 317811.
 * It can be used to form your own backoff interval array.
 * @example
 * // 1ms, 2ms, 3ms, 5ms, 8ms, 13ms
 * PromiseUtils.withRetry(() => doSomething(), FIBONACCI_SEQUENCE.slice(0, 5), err => err.statusCode === 429);
 * // 1s, 2s, 3s, 4s, 8s, 10s, 10s, 10s, 10s, 10s
 * PromiseUtils.withRetry(() => doSomething(), Array.from({length: 10}, (_v, i) => 1000 * Math.min(FIBONACCI_SEQUENCE[i], 10)), err => err.statusCode === 429);
 * // with +-10% randomness: 1s, 2s, 3s, 5s, 8s, 13s
 * PromiseUtils.withRetry(() => doSomething(), FIBONACCI_SEQUENCE.slice(0, 5).map(n => 1000 * n * (1 + (Math.random() - 0.5) / 5)), err => err.statusCode === 429);
 */
export const FIBONACCI_SEQUENCE = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987, 1597, 2584, 4181, 6765, 10946, 17711, 28657, 46368, 75025, 121393, 196418, 317811];

/**
 * Array of 25 exponential numbers starting from 1 up to 33554432.
 * It can be used to form your own backoff interval array.
 * @example
 * // 1ms, 2ms, 4ms, 8ms, 16ms, 32ms
 * PromiseUtils.withRetry(() => doSomething(), EXPONENTIAL_SEQUENCE.slice(0, 5), err => err.statusCode === 429);
 * // 1s, 2s, 4s, 8s, 10s, 10s, 10s, 10s, 10s, 10s
 * PromiseUtils.withRetry(() => doSomething(), Array.from({length: 10}, (_v, i) => 1000 * Math.min(EXPONENTIAL_SEQUENCE[i], 10)), err => err.statusCode === 429);
 * // with +-10% randomness: 1s, 2s, 4s, 8s
 * PromiseUtils.withRetry(() => doSomething(), FIBONACCI_SEQUENCE.slice(0, 4).map(n => 1000 * n * (1 + (Math.random() - 0.5) / 5)), err => err.statusCode === 429);
 */
export const EXPONENTIAL_SEQUENCE = [1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 1597, 32768, 65536, 131072, 262144, 524288, 1048576, 2097152, 4194304, 8388608, 16777216, 33554432];

/**
 * The state of a Promise can only be one of: Pending, Fulfilled, and Rejected.
 */
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
   *   response => response.position? {position: response.position} : null,
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
   * const result2 = await PromiseUtils.withRetry(() => doSomething(), Array.from({length: 10}, (_v, i) => 1000 * Math.min(FIBONACCI_SEQUENCE[i], 10), err => err.statusCode === 429);
   * const result3 = await PromiseUtils.withRetry(() => doSomething(), attempt => attempt <= 8 ? 1000 * Math.min(FIBONACCI_SEQUENCE[attempt - 1], 10) : undefined, err => err.statusCode === 429);
   *
   * @template Result type of the operation result
   * @template TError  type of the possible error that could be generated by the operation
   *
   * @param operation a function that outputs a Promise result, normally the operation does not use its arguments
   * @param backoff Array of retry backoff periods (unit: milliseconds) or function for calculating them.
   *                If retry is desired, before making next call to the operation the desired backoff period would be waited.
   *                If the array runs out of elements or the function returns `undefined` or either the array or the function returns a negative number,
   *                there would be no further call to the operation.
   *                The `attempt` argument passed into backoff function starts from 1 because the function is called right after the first attempt and before the first retry.
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
   * Run multiple jobs/operations with a certain concurrency.
   * 
   * This function could throw / reject with error when a job/operation fails.
   * When the error is re-thrown, remaining operations will not be executed.
   * This is the difference between `withConcurrency(...)` and `inParallel(...)`.
   * In most cases, `withConcurrency(...)` is more convenient.
   * 
   * @example
   * // At any time, there would be no more than 5 concurrency API calls. Error would be re-thrown immediately when it occurs.
   * const attributes = await PromiseUtils.withConcurrency(5, topicArns, async (topicArn) => {
   *   const topicAttributes = (await sns.getTopicAttributes({ TopicArn: topicArn }).promise()).Attributes!;
   *   return topicAttributes;
   * });
   * 
   *
   * @template Data   Type of the job data, usually it would be an Array
   * @template Result Type of the return value of the operation function
   *
   * @param concurrency how many jobs/operations can be running at the same time
   * @param jobs        job data which will be the input to operation function.
   *                    This function is safe when there are infinite unknown number of elements in the job data.
   * @param operation   the function that turns job data into result asynchronously
   * @returns Promise of an array containing results from the operation function.
   *          Results in the returned array are in the same order as the corresponding elements in the jobs array.
   */
  static async withConcurrency<Data, Result>(
    concurrency: number,
    jobs: Iterable<Data>,
    operation: (job: Data, index: number) => Promise<Result>,
  ): Promise<Array<Result>> {
    return inParallel(concurrency, jobs, operation);
  }

  /**
   * Run multiple jobs/operations in parallel, by default all the operations will be executed disregarding whether any of them fails / gets rejected.
   * In most cases, `withConcurrency(...)` is more convenient, though.
   * 
   * By default this function does not throw / reject with error when any of the job/operation fails.
   * Operation errors are returned together with operation results in the same returned array.
   * That also means this function only returns when all the jobs/operations settle (either resolve or reject).
   * 
   * However, if options.abortOnError is true, this function throws / rejects with error when any of the job/operation fails.
   * That also means, some of the jobs/operations may not get the chance to be executed if one of them fails.
   *
   * @example
   * // Capture errors in the returned array
   * const attributesAndPossibleErrors = await PromiseUtils.inParallel(5, topicArns, async (topicArn) => {
   *   const topicAttributes = (await sns.getTopicAttributes({ TopicArn: topicArn }).promise()).Attributes!;
   *   return topicAttributes;
   * });
   * 
   * // Abort on the first error
   * let results: Array<JobResult>;
   * try {
   *   results = await PromiseUtils.inParallel(100, jobs, async (job) => processor.process(job), { abortOnError: true });
   * } catch (error) {
   *   // handle the error
   * }
   *
   * @template Data   Type of the job data, usually it would be an Array
   * @template Result Type of the return value of the operation function
   *
   * @param parallelism how many jobs/operations can be running at the same time
   * @param jobs        job data which will be the input to operation function.
   *                    This function is safe when there are infinite unknown number of elements in the job data.
   * @param operation   the function that turns job data into result asynchronously
   * @param options     Options for controlling the behavior of this function.
   * @returns Promise of an array containing outcomes from the operation function.
   *          In the returned array containing outcomes, each element is either the fulfilled result, or the rejected error/reason.
   */
  static async inParallel<Data, Result, TError = Result>(
    parallelism: number,
    jobs: Iterable<Data>,
    operation: (job: Data, index: number) => Promise<Result>,
    options?: {
      abortOnError: boolean;
    },
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
        jobResults[jobIndex] = options?.abortOnError ? await jobResultPromise : await jobResultPromise.catch(error => error);
      }
    });
    await Promise.all(promises);
    return jobResults;
  }

  /**
   * Create a Promise that resolves after number of milliseconds specified
   * @param ms number of milliseconds after which the created Promise would resolve
   * @param result the result to be resolved for the Promise, or a function that supplies the result.
   * @returns the new Promise created
   */
  static delayedResolve<T>(ms: number, result?: T | PromiseLike<T> | (() => (T | PromiseLike<T>))): Promise<T> {
    // eslint-disable-next-line no-promise-executor-return
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
    // eslint-disable-next-line no-promise-executor-return
    return new Promise((_resolve, reject) => setTimeout(() => {
      const r = typeof reason === 'function' ? (reason as (() => R|PromiseLike<R>))() : reason as R|PromiseLike<R>;
      Promise.resolve(r).catch(error => error).then(r => reject(r));
    }, ms));
  }

  /**
   * Applies a timeout to a Promise or a function that returns a Promise.
   * If the timeout occurs, resolves to the specified result.
   * If the timeout doesn't occur, the resolved result or rejection reason of the original Promise will be the outcome of the Promise returned from this function.
   * If the 'result' parameter is a function and timeout doesn't occur, the function won't be called.
   * The rejection of the 'operation' parameter is not handled by this function, you may want to handle it outside of this function to avoid warnings like "(node:4330) PromiseRejectionHandledWarning: Promise rejection was handled asynchronously".
   *
   * @param operation The original Promise or a function that returns a Promise for which the timeout will be applied.
   * @param ms The number of milliseconds for the timeout.
   * @param result The result to be resolved with if the timeout occurs, or a function that supplies the result.
   * @return A new Promise that resolves to the specified result if the timeout occurs.
   */
  static timeoutResolve<T>(operation: Promise<T> | (() => Promise<T>), ms: number, result?: T | PromiseLike<T> | (() => (T | PromiseLike<T>)) | undefined): Promise<T> {
    const promise = typeof operation === 'function' ? operation() : operation;
    return Promise.race([
      promise,
      PromiseUtils.delayedResolve(
        ms,
        () => PromiseUtils.promiseState(promise)
                .then(state => state === PromiseState.Pending ?
                  (typeof result === 'function' ? (result as () => T|PromiseLike<T>|undefined)() : result) :
                  {} as any), // this object would not be used because the operation should have already resolved
      ),
    ]);
  }

  /**
   * Applies a timeout to a Promise or a function that returns a Promise.
   * If the timeout occurs, rejects with the specified reason.
   * If the timeout doesn't occur, the resolved result or rejection reason of the original Promise will be the outcome of the Promise returned from this function.
   * If the 'reason' parameter is a function and timeout doesn't occur, the function won't be called.
   * The rejection of the 'operation' parameter is not handled by this function, you may want to handle it outside of this function to avoid warnings like "(node:4330) PromiseRejectionHandledWarning: Promise rejection was handled asynchronously".
   *
   * @param operation The original Promise or a function that returns a Promise for which the timeout will be applied.
   * @param ms The number of milliseconds for the timeout.
   * @param rejectReason The reason to reject with if the timeout occurs, or a function that supplies the reason.
   * @return A new Promise that rejects with the specified reason if the timeout occurs.
   */
  static timeoutReject<T = never, R = any>(operation: Promise<T> | (() => Promise<T>), ms: number, rejectReason: R | PromiseLike<R> | (() => R|PromiseLike<R>)): Promise<T> {
    const promise = typeof operation === 'function' ? operation() : operation;
    return Promise.race([
      promise,
      PromiseUtils.delayedReject(
        ms,
        () => PromiseUtils.promiseState(promise)
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
   * @return A Promise that resolves immediately containing the state of the input Promise
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
      case PromiseState.Pending: {  // concurrency
        resultPromise = previousResultPromise!.then(result => operation(PromiseState.Pending, PromiseState.Fulfilled, result), error => operation(PromiseState.Pending, PromiseState.Rejected, error));
        break;
      }
      case undefined: { // no concurrency and no history
        // eslint-disable-next-line unicorn/no-useless-undefined
        resultPromise = operation(undefined, undefined, undefined);
        break;
      }
      default: {  // no concurrency but with history
        resultPromise = operation(previousState, previousState, await previousResultPromise!.catch(error => error));
        break;
      }
    }

    PromiseUtils.synchronizationLocks.set(lock, resultPromise);
    return resultPromise;
  }

  /**
   * This is just another spelling of {@link PromiseUtils.synchronized}.
   * @param lock        the object (could be a string, a number, or `this` in a class) that is used to apply the lock
   * @param operation   function for doing the computation and returning a Promise
   * @returns the result of the operation function
   */
  static async synchronised<T>(lock: unknown, operation: (previousState: PromiseState | undefined, previousSettledState: PromiseState | undefined, previousResult: any) => Promise<T>): Promise<T> {
    return PromiseUtils.synchronized(lock, operation);
  }
}

/**
 * See {@link PromiseUtils.repeat} for full documentation.
 */
export const repeat = PromiseUtils.repeat;
/**
 * See {@link PromiseUtils.withRetry} for full documentation.
 */
export const withRetry = PromiseUtils.withRetry;
/**
 * See {@link PromiseUtils.withConcurrency} for full documentation.
 */
export const withConcurrency = PromiseUtils.withConcurrency;
/**
 * See {@link PromiseUtils.inParallel} for full documentation.
 */
export const inParallel = PromiseUtils.inParallel;
/**
 * See {@link PromiseUtils.delayedResolve} for full documentation.
 */
export const delayedResolve = PromiseUtils.delayedResolve;
/**
 * See {@link PromiseUtils.delayedReject} for full documentation.
 */
export const delayedReject = PromiseUtils.delayedReject;
/**
 * See {@link PromiseUtils.timeoutResolve} for full documentation.
 */
export const timeoutResolve = PromiseUtils.timeoutResolve;
/**
 * See {@link PromiseUtils.timeoutReject} for full documentation.
 */
export const timeoutReject = PromiseUtils.timeoutReject;
/**
 * See {@link PromiseUtils.synchronized} for full documentation.
 */
export const synchronized = PromiseUtils.synchronized;
/**
 * See {@link PromiseUtils.synchronised} for full documentation.
 */
export const synchronised = PromiseUtils.synchronised;
/**
 * See {@link PromiseUtils.promiseState} for full documentation.
 */
export const promiseState = PromiseUtils.promiseState;
