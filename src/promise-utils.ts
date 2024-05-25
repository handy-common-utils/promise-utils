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
   * Executes an operation repeatedly and collects all the results.
   * This function is very useful for many scenarios, such like client-side pagination.
   *
   * @example
   * const domainNameObjects = await PromiseUtils.repeat(
   *   pagingParam => apig.getDomainNames({limit: 500, ...pagingParam}).promise(),
   *   response => response.position? {position: response.position} : null,
   *   (collection, response) => collection.concat(response.items!),
   *   [] as APIGateway.DomainName[],
   * );
   *
   * @template Result The type of the operation result.
   * @template Param The type of the input to the operation, typically a paging parameter.
   * @template Collection The type of the collection returned by this function.
   *
   * @param operation A function that takes a parameter as input and returns a result. Typically, the parameter has optional fields to control paging.
   * @param nextParameter A function for calculating the next parameter from the operation result.
   *        Normally, this parameter controls paging.
   *        This function should return null when no further invocation of the operation function is desired.
   *        If further invocation is desired, the return value of this function can be a Promise or a non-Promise value.
   * @param collect A function for merging the operation result into the collection.
   * @param initialCollection The initial collection, which will be the first argument passed to the first invocation of the collect function.
   * @param initialParameter The parameter for the first operation.
   * @returns A promise that resolves to a collection of all the results returned by the operation function.
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
   * Repeatedly performs an operation until a specified criteria is met.
   *
   * @example
   * const result = await PromiseUtils.withRetry(() => doSomething(), [100, 200, 300, 500, 800, 1000]);
   * const result2 = await PromiseUtils.withRetry(() => doSomething(), Array.from({length: 10}, (_v, i) => 1000 * Math.min(FIBONACCI_SEQUENCE[i], 10), err => err.statusCode === 429);
   * const result3 = await PromiseUtils.withRetry(() => doSomething(), attempt => attempt <= 8 ? 1000 * Math.min(FIBONACCI_SEQUENCE[attempt - 1], 10) : undefined, err => err.statusCode === 429);
   *
   * @template Result Type of the operation result.
   * @template TError Type of the possible error that could be generated by the operation.
   *
   * @param operation A function that outputs a Promise result. Typically, the operation does not use its arguments.
   * @param backoff An array of retry backoff periods (in milliseconds) or a function for calculating them.
   *                If retry is desired, the specified backoff period is waited before the next call to the operation.
   *                If the array runs out of elements or the function returns `undefined` or a negative number, no further calls to the operation will be made.
   *                The `attempt` argument passed to the backoff function starts from 1, as it is called immediately after the first attempt and before the first retry.
   * @param shouldRetry A predicate function for deciding whether another call to the operation should occur.
   *                    If this argument is not defined, a retry will occur whenever the operation rejects with an error.
   *                    The `shouldRetry` function is evaluated before the `backoff`.
   *                    The `attempt` argument passed to the shouldRetry function starts from 1.
   * @returns A promise of the operation result, potentially with retries applied.
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
   * Executes multiple jobs/operations with a specified level of concurrency.
   * 
   * Unlike `inParallel(...)`, this function may throw or reject an error when a job/operation fails.
   * When an error is re-thrown, remaining operations will not be executed.
   * If you want all the operations to always be executed, use {@link PromiseUtils.inParallel} instead.
   * 
   * @example
   * // At any time, there would be no more than 5 concurrency API calls. Error would be re-thrown immediately when it occurs.
   * const attributes = await PromiseUtils.withConcurrency(5, topicArns, async (topicArn) => {
   *   const topicAttributes = (await sns.getTopicAttributes({ TopicArn: topicArn }).promise()).Attributes!;
   *   return topicAttributes;
   * });
   * 
   *
   * @template Data   The type of the job data, typically an Array.
   * @template Result The type of the return value from the operation function.
   *
   * @param concurrency The number of jobs/operations to run concurrently.
   * @param jobs The job data to be processed. This function can handle an infinite or unknown number of elements safely.
   * @param operation The function that processes job data asynchronously.
   * @returns A promise that resolves to an array containing the results from the operation function.
   *          The results in the returned array are in the same order as the corresponding elements in the jobs array.
   */
  static async withConcurrency<Data, Result>(
    concurrency: number,
    jobs: Iterable<Data>,
    operation: (job: Data, index: number) => Promise<Result>,
  ): Promise<Array<Result>> {
    return inParallel(concurrency, jobs, operation);
  }

  /**
   * Executes multiple jobs/operations in parallel. By default, all operations are executed regardless of any failures.
   * In most cases, using {@link PromiseUtils.withConcurrency} might be more convenient.
   *
   * By default, this function does not throw or reject an error when any job/operation fails.
   * Errors from operations are returned alongside results in the returned array.
   * This function only resolves when all jobs/operations are settled (either resolved or rejected).
   *
   * If `options.abortOnError` is set to true, this function throws (or rejects with) an error immediately when any job/operation fails.
   * In this mode, some jobs/operations may not be executed if one fails.
   *
   * @example
   * // Capture errors in the returned array
   * const attributesAndPossibleErrors: Array<JobResult|JobError> = await PromiseUtils.inParallel(5, topicArns, async (topicArn) => {
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
   * @template Data   The type of the job data, typically an Array.
   * @template Result The type of the return value from the operation function.
   * @template TError The type for the error that could be thrown from the operation function, defaults to `Result`.
   *
   * @param parallelism The number of jobs/operations to run concurrently.
   * @param jobs The job data to be processed. This function can safely handle an infinite or unknown number of elements.
   * @param operation The function that processes job data asynchronously.
   * @param options Options to control the function's behavior.
   * @param options.abortOnError If true, the function aborts and throws an error on the first failed operation.
   * @returns A promise that resolves to an array containing the results of the operations.
   *  Each element is either a fulfilled result or a rejected error/reason.
   *  The results or errors in the returned array are in the same order as the corresponding elements in the jobs array.
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
   * Creates a Promise that resolves after a specified number of milliseconds.
   *
   * @param ms The number of milliseconds after which the created Promise will resolve.
   * @param result The result to be resolved by the Promise, or a function that supplies the result.
   * @returns A new Promise that resolves with the specified result after the specified delay.
   */
  static delayedResolve<T>(ms: number, result?: T | PromiseLike<T> | (() => (T | PromiseLike<T>))): Promise<T> {
    // eslint-disable-next-line no-promise-executor-return
    return new Promise(resolve => setTimeout(() => resolve(
      typeof result === 'function' ? (result as (() => T | PromiseLike<T>))() : result as T | PromiseLike<T>,
    ), ms));
  }

  /**
   * Creates a Promise that rejects after a specified number of milliseconds.
   *
   * @param ms The number of milliseconds after which the created Promise will reject.
   * @param reason The reason for the rejection, or a function that supplies the reason.
   *               If the reason is a rejected Promise, the outcome of it will be the rejection reason of the returned Promise.
   * @returns A new Promise that rejects with the specified reason after the specified delay.
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
   * If the timeout occurs, the returned Promise resolves to the specified result.
   * If the timeout does not occur, the returned Promise resolves or rejects based on the outcome of the original Promise.
   * If the `result` parameter is a function and the timeout does not occur, the function will not be called.
   * Note: The rejection of the `operation` parameter is not handled by this function. 
   * You may want to handle it outside this function to avoid warnings like "(node:4330) PromiseRejectionHandledWarning: Promise rejection was handled asynchronously."
   *
   * @param operation The original Promise or a function that returns a Promise to which the timeout will be applied.
   * @param ms The number of milliseconds for the timeout.
   * @param result The result to resolve with if the timeout occurs, or a function that supplies the result.
   * @returns A new Promise that resolves to the specified result if the timeout occurs.
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
   * If the timeout occurs, the returned Promise rejects with the specified reason.
   * If the timeout does not occur, the returned Promise resolves or rejects based on the outcome of the original Promise.
   * If the `rejectReason` parameter is a function and the timeout does not occur, the function will not be called.
   * Note: The rejection of the `operation` parameter is not handled by this function. You may want to handle it outside this function to avoid warnings like "(node:4330) PromiseRejectionHandledWarning: Promise rejection was handled asynchronously."
   *
   * @param operation The original Promise or a function that returns a Promise to which the timeout will be applied.
   * @param ms The number of milliseconds for the timeout.
   * @param rejectReason The reason to reject with if the timeout occurs, or a function that supplies the reason.
   * @returns A new Promise that rejects with the specified reason if the timeout occurs.
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
   * Retrieves the state of the specified Promise.
   * Note: The returned value is a Promise that resolves immediately.
   *
   * @param p The Promise whose state is to be determined.
   * @returns A Promise that resolves immediately with the state of the input Promise.
   */
  static promiseState(p: Promise<any>): Promise<PromiseState> {
    const t = {};
    return Promise.race([p, t])
      .then(v => (v === t) ? PromiseState.Pending : PromiseState.Fulfilled, () => PromiseState.Rejected);
  }

  private static synchronizationLocks = new Map<any, Promise<any>>();

  /**
   * Provides mutual exclusion similar to `synchronized` in Java.
   * Ensures no concurrent execution of any operation function associated with the same lock.
   * The operation function has access to the state (when `synchronized` is called),
   * settledState (when the operation function is called),
   * and result (either the fulfilled result or the rejected reason) of the previous operation.
   * If there is no previous invocation, state, settledState, and result will all be undefined.
   * 
   * @param lock The object (such as a string, a number, or `this` in a class) used to identify the lock.
   * @param operation The function that performs the computation and returns a Promise.
   * @returns The result of the operation function.
   */
  static async synchronized<T>(lock: any, operation: (previousState: PromiseState | undefined, previousSettledState: PromiseState | undefined, previousResult: any) => Promise<T>): Promise<T> {
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
   * @param lock The object (such as a string, a number, or `this` in a class) used to identify the lock.
   * @param operation The function that performs the computation and returns a Promise.
   * @returns The result of the operation function.
   */
  static async synchronised<T>(lock: any, operation: (previousState: PromiseState | undefined, previousSettledState: PromiseState | undefined, previousResult: any) => Promise<T>): Promise<T> {
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
