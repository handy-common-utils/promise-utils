/* eslint-disable no-await-in-loop */
type InParrellelResult<T> = T extends void ? void : Array<T>;

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
   * const domainNameObjects = await Utils.repeat(
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
   * @param collect the function for merging operation result into the collection
   * @param initialCollection initial collection which would be the first argument passed into the first invocation of the collect function
   * @param initialParameter the parameter for the first operation
   * @returns Promise of collection of all the results returned by the operation function
   *
   */
  // eslint-disable-next-line max-params
  static async repeat<Result, Param, Collection>(
    operation: (parameter: Partial<Param>) => Promise<Result>,
    nextParameter: (response: Result) => Partial<Param> | null,
    collect: (collection: Collection, result: Result) => Collection,
    initialCollection: Collection,
    initialParameter: Partial<Param> = {},
  ): Promise<Collection> {
    let collection = initialCollection;
    let param: Partial<Param> | null = initialParameter;
    do {
      // eslint-disable-next-line no-await-in-loop
      const result = await operation(param);
      collection = collect(collection, result);
      param = nextParameter(result);
    } while (param !== null);
    return collection;
  }

  /**
   * Run multiple jobs/operations in parallel.
   *
   * @example
   * const topicArns = topics.map(topic => topic.TopicArn!);
   * await Utils.inParallel(5, topicArns, async topicArn => {
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
   *          or promise of an arry containing results returned from the operation function.
   */
  static async inParallel<Data, Result>(
    parallelism: number,
    jobs: Iterable<Data>,
    operation: (job: Data, index: number) => Promise<Result>,
  ): Promise<InParrellelResult<Result>> {
    if (parallelism < 1) {
      parallelism = 1;
    }
    const jobResults = new Array<Result>();
    let index = 0;
    const iterator = jobs[Symbol.iterator]();
    const promises = new Array(Math.floor(parallelism)).fill(0).map(async _ => {
      let iteratorResult: IteratorResult<Data, any>;
      while (true) {
        iteratorResult = iterator.next();
        if (iteratorResult.done) {
          break;
        }
        const job = iteratorResult.value;
        const jobIndex = index++;
        const jobResultPromise = operation(job, jobIndex);
        const jobResult = await jobResultPromise;
        if (jobResult !== undefined) {
          jobResults[jobIndex] = jobResult;
        }
      }
    });
    await Promise.all(promises);
    return (jobResults.length > 0 ? jobResults : undefined) as InParrellelResult<Result>;
  }

  /**
   * Create a Promise that resolves after number of milliseconds specified
   * @param ms number of milliseconds after which the created Promise would resolve
   * @param result the result to be resolved for the Promise
   * @returns the new Promise created
   */
  static delayedResolve<T>(ms: number, result?: T | PromiseLike<T> | undefined): Promise<T> {
    return new Promise(resolve => setTimeout(() => resolve(result), ms));
  }

  /**
   * Create a Promise that rejects after number of milliseconds specified
   * @param ms number of milliseconds after which the created Promise would reject
   * @param reason the reason of the rejection for the Promise
   * @returns the new Promise created
   */
  static delayedReject<T = never>(ms: number, reason: any): Promise<T> {
    return new Promise((_resolve, reject) => setTimeout(() => reject(reason), ms));
  }

  /**
   * Apply timeout to an operation, in case timeout happens, resolve to the result specified.
   * If timeout does not happen, the resolved result or rejection reason of the original operation would be returned.
   * @param operation the original operation that timeout would be applied
   * @param ms number of milliseconds for the timeout
   * @param result the result to be resolved in case timeout happens
   * @return the new Promise that resolves to the specified result in case timeout happens
   */
  static timeoutResolve<T>(operation: Promise<T>, ms: number, result?: T | PromiseLike<T> | undefined): Promise<T> {
    return Promise.race([operation, PromiseUtils.delayedResolve(ms, result)]);
  }

  /**
   * Apply timeout to an operation, in case timeout happens, reject with the reason specified.
   * If timeout does not happen, the resolved result or rejection reason of the original operation would be returned.
   * @param operation the original operation that timeout would be applied
   * @param ms number of milliseconds for the timeout
   * @param rejectReason the reason of the rejection in case timeout happens
   * @return the new Promise that rejects with the specified reason in case timeout happens
   */
  static timeoutReject<T>(operation: Promise<T>, ms: number, rejectReason: any): Promise<T> {
    return Promise.race([operation, PromiseUtils.delayedReject(rejectReason, ms)]);
  }

  static promiseState(p: Promise<any>): Promise<PromiseState> {
    const t = {};
    return Promise.race([p, t])
      .then(v => (v === t) ? PromiseState.Pending : PromiseState.Fulfilled, () => PromiseState.Rejected);
  }

  private static synchronizationLocks = new Map<any, Promise<any>>();

  /**
   * Equivalent of `synchronized` in Java.
   * In any situation there's no concurrent execution of any operation function associated with the same lock.
   * The operation function has access to the state (when `synchronized` is called), settledState (when the operation function is called), and result of the previous operation.
   * In case there is no previous invocation, state, settledState and result would all be undefined.
   * @param lock        the object (could be a string, a number, or `this` in a class) that is used to apply the lock
   * @param operation   function for doing the computation and returning a Promise
   * @returns the result of the operation function
   */
  static async synchronized<T>(lock: any, operation: (previousState: PromiseState | undefined, previousSettledState: PromiseState | undefined, previousResult: any) => Promise<T>): Promise<T> {
    let resultPromise: Promise<T>;
    const previousResultPromise = PromiseUtils.synchronizationLocks.get(lock);
    let previousState: PromiseState | undefined;
    if (previousResultPromise !== undefined) {
      previousState = await PromiseUtils.promiseState(previousResultPromise);
    }
    switch (previousState) {
      case PromiseState.Pending:  // concurrency
        resultPromise = previousResultPromise!.then(result => operation(PromiseState.Pending, PromiseState.Fulfilled, result), reason => operation(PromiseState.Pending, PromiseState.Rejected, reason));
        break;
      case undefined: // no concurrency and no history
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
export const inParallel = PromiseUtils.inParallel;
export const delayedResolve = PromiseUtils.delayedResolve;
export const delayedReject = PromiseUtils.delayedReject;
export const timeoutResolve = PromiseUtils.timeoutResolve;
export const timeoutReject = PromiseUtils.timeoutReject;
export const synchronized = PromiseUtils.synchronized;
export const promiseState = PromiseUtils.promiseState;
