# @handy-common-utils/promise-utils

These Promise-related utilities boast 100% test coverage, ensuring robust reliability.
The package, free of external dependencies, offers essential functions such as:

- `repeat`: Executes an operation repeatedly; useful for collecting paged results.
- `withRetry`: Retries an operation with configurable backoff and retry predicate.
- `withConcurrency`: Runs jobs in parallel with a concurrency limit and aborts remaining jobs on the first error.
- `inParallel`: Runs jobs in parallel with a concurrency limit and returns all results and errors (does not abort on any error by default).
- `delayedResolve`: Creates a Promise that resolves after a specified delay.
- `delayedReject`: Creates a Promise that rejects after a specified delay.
- `cancellableDelayedResolve`: Like `delayedResolve` but returns `{ stop(), promise }` to allow cancelling before the timer fires.
- `cancellableDelayedReject`: Like `delayedReject` but returns `{ stop(), promise }` to allow cancelling before the timer fires.
- `timeoutResolve`: Applies a timeout to a Promise and resolves with a fallback value if the timeout occurs.
- `timeoutReject`: Applies a timeout to a Promise and rejects with a fallback reason if the timeout occurs.
- `promiseState`: Retrieves the state of a Promise (Pending/Fulfilled/Rejected).
- `synchronized` / `synchronised`: Provides mutual exclusion (lock) semantics for async operations.
- `runPeriodically`: Runs an operation periodically with configurable intervals and stopping conditions.

[![Version](https://img.shields.io/npm/v/@handy-common-utils/promise-utils.svg)](https://npmjs.org/package/@handy-common-utils/promise-utils)
[![Downloads/week](https://img.shields.io/npm/dw/@handy-common-utils/promise-utils.svg)](https://npmjs.org/package/@handy-common-utils/promise-utils)
[![CI](https://github.com/handy-common-utils/promise-utils/actions/workflows/ci.yml/badge.svg)](https://github.com/handy-common-utils/promise-utils/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/handy-common-utils/promise-utils/branch/master/graph/badge.svg?token=QBL6AB3CL5)](https://codecov.io/gh/handy-common-utils/promise-utils)

## How to use

First add it as a dependency:

```sh
npm install @handy-common-utils/promise-utils
```

Then you can use it in the code. Below are minimal examples; full short snippets are grouped in the "Examples" section further down.

```javascript
import { PromiseUtils } from '@handy-common-utils/promise-utils';

// basic usage (short):
await PromiseUtils.delayedResolve(50, 'ok');
await PromiseUtils.timeoutReject(PromiseUtils.delayedReject(80, '1'), 10, '2');

// See the Examples section below for more grouped snippets (Timers, Concurrency, Scheduling).
```

You can either import and use the [PromiseUtils class](#classespromiseutilsmd) as shown above, or import only the helpers you need. For example:

```javascript
import { withRetry, delayedResolve, cancellableDelayedReject, withConcurrency, inParallel, runPeriodically } from '@handy-common-utils/promise-utils';

// Import-focused example — the actual usage is the same as using PromiseUtils.
const result = await withRetry(() => doSomething(), [100, 200, 300]);
const p = delayedResolve(100, 'ok');
const c = cancellableDelayedReject(2000, 'timeout-reason');
// c.stop() can cancel the scheduled rejection before it fires
```

## Quick examples

### Timers

```javascript
// delayedResolve / delayedReject
await delayedResolve(50, 'ok');

// cancellableDelayedResolve: returns { stop, promise }
const { stop, promise } = cancellableDelayedResolve(1000, () => Promise.resolve('ready'));
// cancel before it fires
stop();
```

`delayedReject` and `cancellableDelayedReject` are similar.

### Concurrency & Parallelism

```javascript
// withConcurrency: abort remaining on first error
try {
  await withConcurrency(5, jobs, async (job) => process(job));
} catch (err) {
  // an error occurred and remaining jobs may not have been started
}

// inParallel: collect all results and errors
const results = await inParallel(5, jobs, async (job) => process(job));
// results contains either values or error objects in the original order
```

### Scheduling & Utilities

```javascript
// runPeriodically: schedule repeated work
const controller = runPeriodically(async (i) => {
  console.log('iteration', i);
  await delayedResolve(10);
}, 100, { maxExecutions: 5 });
...
controller.stop(); // stop now
await controller.done; // wait until it stops

// synchronized: lock a resource
await PromiseUtils.synchronized('my-lock', async () => {
  // only one callback for 'my-lock' runs at a time
});
```

# API

<!-- API start -->
<a name="readmemd"></a>

## @handy-common-utils/promise-utils

### Classes

| Class | Description |
| ------ | ------ |
| [PromiseUtils](#classespromiseutilsmd) | - |

### Type Aliases

| Type Alias | Description |
| ------ | ------ |
| [PromiseStateType](#type-aliasespromisestatetypemd) | - |

### Variables

| Variable | Description |
| ------ | ------ |
| [cancellableDelayedReject](#variablescancellabledelayedrejectmd) | Creates a cancellable timer that will reject after a specified number of milliseconds. |
| [cancellableDelayedResolve](#variablescancellabledelayedresolvemd) | Creates a cancellable timer that will resolve after a specified number of milliseconds. |
| [delayedReject](#variablesdelayedrejectmd) | Creates a Promise that rejects after a specified number of milliseconds. |
| [delayedResolve](#variablesdelayedresolvemd) | Creates a Promise that resolves after a specified number of milliseconds. |
| [EXPONENTIAL\_SEQUENCE](#variablesexponential_sequencemd) | Array of 25 exponential numbers starting from 1 up to 33554432. It can be used to form your own backoff interval array. |
| [FIBONACCI\_SEQUENCE](#variablesfibonacci_sequencemd) | Array of 25 Fibonacci numbers starting from 1 up to 317811. It can be used to form your own backoff interval array. |
| [inParallel](#variablesinparallelmd) | Executes multiple jobs/operations in parallel. By default, all operations are executed regardless of any failures. In most cases, using withConcurrency might be more convenient. |
| [promiseState](#variablespromisestatemd) | Retrieves the state of the specified Promise. Note: The returned value is a Promise that resolves immediately. |
| [PromiseState](#variablespromisestate-1md) | The state of a Promise can only be one of: Pending, Fulfilled, and Rejected. |
| [repeat](#variablesrepeatmd) | Executes an operation repeatedly and collects all the results. This function is very useful for many scenarios, such like client-side pagination. |
| [runPeriodically](#variablesrunperiodicallymd) | Runs an operation periodically with configurable intervals and stopping conditions. |
| [synchronised](#variablessynchronisedmd) | This is just another spelling of synchronized. |
| [synchronized](#variablessynchronizedmd) | Provides mutual exclusion similar to synchronized in Java. Ensures no concurrent execution of any operation function associated with the same lock. The operation function has access to the state (when synchronized is called), settledState (when the operation function is called), and result (either the fulfilled result or the rejected reason) of the previous operation. If there is no previous invocation, state, settledState, and result will all be undefined. |
| [timeoutReject](#variablestimeoutrejectmd) | Applies a timeout to a Promise or a function that returns a Promise. If the timeout occurs, the returned Promise rejects with the specified reason. If the timeout does not occur, the returned Promise resolves or rejects based on the outcome of the original Promise. If the rejectReason parameter is a function and the timeout does not occur, the function will not be called. Note: The rejection of the operation parameter is not handled by this function. You may want to handle it outside this function to avoid warnings like "(node:4330) PromiseRejectionHandledWarning: Promise rejection was handled asynchronously." |
| [timeoutResolve](#variablestimeoutresolvemd) | Applies a timeout to a Promise or a function that returns a Promise. If the timeout occurs, the returned Promise resolves to the specified result. If the timeout does not occur, the returned Promise resolves or rejects based on the outcome of the original Promise. If the result parameter is a function and the timeout does not occur, the function will not be called. Note: The rejection of the operation parameter is not handled by this function. You may want to handle it outside this function to avoid warnings like "(node:4330) PromiseRejectionHandledWarning: Promise rejection was handled asynchronously." |
| [withConcurrency](#variableswithconcurrencymd) | Executes multiple jobs/operations with a specified level of concurrency. |
| [withRetry](#variableswithretrymd) | Repeatedly performs an operation until a specified criteria is met. |

## Classes


<a id="classespromiseutilsmd"></a>

### Abstract Class: PromiseUtils

#### Constructors

<a id="api-constructor"></a>

##### Constructor

> **new PromiseUtils**(): `PromiseUtils`

###### Returns

`PromiseUtils`

#### Methods

<a id="api-cancellabledelayedreject"></a>

##### cancellableDelayedReject()

> `static` **cancellableDelayedReject**\<`T`, `R`\>(`ms`, `reason`): `object`

Creates a cancellable timer that will reject after a specified number of milliseconds.

The returned object contains:
- `stop()` to cancel the scheduled rejection (if called before the timer fires). Calling
  `stop()` prevents the promise from being settled by this timer.
- `promise` which will reject with the supplied `reason` (or the value returned by the
  `reason` function) after `ms` milliseconds unless `stop()` is called first.

If the `reason` is a PromiseLike that rejects, its rejection value will be used as the rejection reason.

###### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | `never` |
| `R` | `any` |

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `ms` | `number` | The number of milliseconds after which the scheduled rejection will occur. |
| `reason` | `R` \| `PromiseLike`\<`R`\> \| () => `R` \| `PromiseLike`\<`R`\> | The reason for the rejection, or a function that supplies the reason. |

###### Returns

`object`

An object with `stop()` and `promise`.

| Name | Type |
| ------ | ------ |
| `promise` | `Promise`\<`T`\> |
| `stop()` | () => `void` |

***

<a id="api-cancellabledelayedresolve"></a>

##### cancellableDelayedResolve()

> `static` **cancellableDelayedResolve**\<`T`\>(`ms`, `result?`): `object`

Creates a cancellable timer that will resolve after a specified number of milliseconds.

The returned object contains:
- `stop()` to cancel the scheduled resolution (if called before the timer fires). Calling
  `stop()` prevents the promise from being settled by this timer.
- `promise` which will resolve with the supplied `result` (or the value returned by the
  `result` function) after `ms` milliseconds unless `stop()` is called first.

Note: If the `result` is a function that returns a Promise, the returned `promise` will
resolve with that Promise's resolution (i.e. it behaves like resolving with a PromiseLike).

###### Type Parameters

| Type Parameter |
| ------ |
| `T` |

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `ms` | `number` | The number of milliseconds after which the scheduled resolution will occur. |
| `result?` | `T` \| `PromiseLike`\<`T`\> \| () => `T` \| `PromiseLike`\<`T`\> | The result to be resolved by the Promise, or a function that supplies the result. |

###### Returns

`object`

An object with `stop()` and `promise`.

| Name | Type |
| ------ | ------ |
| `promise` | `Promise`\<`T`\> |
| `stop()` | () => `void` |

***

<a id="api-delayedreject"></a>

##### delayedReject()

> `static` **delayedReject**\<`T`, `R`\>(`ms`, `reason`): `Promise`\<`T`\>

Creates a Promise that rejects after a specified number of milliseconds.

The `reason` argument may be:
- a value to reject with,
- a PromiseLike whose rejection will be adopted by the returned Promise, or
- a function which is invoked when the timer fires and may return a value or a PromiseLike.

If `reason` is a function, it is called when the timer elapses; if it returns a Promise,
the returned Promise will reject with that Promise's rejection reason (or reject with the
returned value if it resolves).

###### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | `never` |
| `R` | `any` |

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `ms` | `number` | The number of milliseconds after which the created Promise will reject. |
| `reason` | `R` \| `PromiseLike`\<`R`\> \| () => `R` \| `PromiseLike`\<`R`\> | The reason for the rejection, or a function that supplies the reason. |

###### Returns

`Promise`\<`T`\>

A Promise that rejects with the specified reason after the specified delay.

***

<a id="api-delayedresolve"></a>

##### delayedResolve()

> `static` **delayedResolve**\<`T`\>(`ms`, `result?`): `Promise`\<`T`\>

Creates a Promise that resolves after a specified number of milliseconds.

The `result` argument may be:
- a value to resolve with,
- a PromiseLike whose resolution will be adopted by the returned Promise, or
- a function which is invoked when the timer fires and may return a value or a PromiseLike.

If `result` is a function, it is called when the timer elapses; if it returns a Promise,
the returned Promise will adopt that Promise's outcome.

###### Type Parameters

| Type Parameter |
| ------ |
| `T` |

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `ms` | `number` | The number of milliseconds after which the created Promise will resolve. |
| `result?` | `T` \| `PromiseLike`\<`T`\> \| () => `T` \| `PromiseLike`\<`T`\> | The result to be resolved by the Promise, or a function that supplies the result. |

###### Returns

`Promise`\<`T`\>

A Promise that resolves with the specified result after the specified delay.

***

<a id="api-inparallel"></a>

##### inParallel()

> `static` **inParallel**\<`Data`, `Result`, `TError`\>(`parallelism`, `jobs`, `operation`, `options?`): `Promise`\<(`Result` \| `TError`)[]\>

Executes multiple jobs/operations in parallel. By default, all operations are executed regardless of any failures.
In most cases, using [PromiseUtils.withConcurrency](#api-withconcurrency) might be more convenient.

By default, this function does not throw or reject an error when any job/operation fails.
Errors from operations are returned alongside results in the returned array.
This function only resolves when all jobs/operations are settled (either resolved or rejected).

If `options.abortOnError` is set to true, this function throws (or rejects with) an error immediately when any job/operation fails.
In this mode, some jobs/operations may not be executed if one fails.

###### Type Parameters

| Type Parameter | Default type | Description |
| ------ | ------ | ------ |
| `Data` | - | The type of the job data, typically an Array. |
| `Result` | - | The type of the return value from the operation function. |
| `TError` | `Result` | The type for the error that could be thrown from the operation function, defaults to `Result`. |

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `parallelism` | `number` | The number of jobs/operations to run concurrently. |
| `jobs` | `Iterable`\<`Data`\> | The job data to be processed. This function can safely handle an infinite or unknown number of elements. |
| `operation` | (`job`, `index`) => `Promise`\<`Result`\> | The function that processes job data asynchronously. |
| `options?` | \{ `abortOnError`: `boolean`; \} | Options to control the function's behavior. |
| `options.abortOnError?` | `boolean` | If true, the function aborts and throws an error on the first failed operation. |

###### Returns

`Promise`\<(`Result` \| `TError`)[]\>

A promise that resolves to an array containing the results of the operations.
 Each element is either a fulfilled result or a rejected error/reason.
 The results or errors in the returned array are in the same order as the corresponding elements in the jobs array.

###### Example

```ts
// Capture errors in the returned array
const attributesAndPossibleErrors: Array<JobResult|JobError> = await PromiseUtils.inParallel(5, topicArns, async (topicArn) => {
  const topicAttributes = (await sns.getTopicAttributes({ TopicArn: topicArn }).promise()).Attributes!;
  return topicAttributes;
});

// Abort on the first error
let results: Array<JobResult>;
try {
  results = await PromiseUtils.inParallel(100, jobs, async (job) => processor.process(job), { abortOnError: true });
} catch (error) {
  // handle the error
}
```

***

<a id="api-promisestate"></a>

##### promiseState()

> `static` **promiseState**(`p`): `Promise`\<`"Pending"` \| `"Fulfilled"` \| `"Rejected"`\>

Retrieves the state of the specified Promise.
Note: The returned value is a Promise that resolves immediately.

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `p` | `Promise`\<`any`\> | The Promise whose state is to be determined. |

###### Returns

`Promise`\<`"Pending"` \| `"Fulfilled"` \| `"Rejected"`\>

A Promise that resolves immediately with the state of the input Promise.

***

<a id="api-repeat"></a>

##### repeat()

> `static` **repeat**\<`Result`, `Param`, `Collection`\>(`operation`, `nextParameter`, `collect`, `initialCollection`, `initialParameter`): `Promise`\<`Collection`\>

Executes an operation repeatedly and collects all the results.
This function is very useful for many scenarios, such like client-side pagination.

###### Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `Result` | The type of the operation result. |
| `Param` | The type of the input to the operation, typically a paging parameter. |
| `Collection` | The type of the collection returned by this function. |

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `operation` | (`parameter`) => `Promise`\<`Result`\> | A function that takes a parameter as input and returns a result. Typically, the parameter has optional fields to control paging. |
| `nextParameter` | (`response`) => `Partial`\<`Param`\> \| `Promise`\<`Partial`\<`Param`\>\> \| `null` | A function for calculating the next parameter from the operation result. Normally, this parameter controls paging. This function should return null when no further invocation of the operation function is desired. If further invocation is desired, the return value of this function can be a Promise or a non-Promise value. |
| `collect` | (`collection`, `result`) => `Collection` | A function for merging the operation result into the collection. |
| `initialCollection` | `Collection` | The initial collection, which will be the first argument passed to the first invocation of the collect function. |
| `initialParameter` | `Partial`\<`Param`\> | The parameter for the first operation. |

###### Returns

`Promise`\<`Collection`\>

A promise that resolves to a collection of all the results returned by the operation function.

###### Example

```ts
const domainNameObjects = await PromiseUtils.repeat(
  pagingParam => apig.getDomainNames({limit: 500, ...pagingParam}).promise(),
  response => response.position? {position: response.position} : null,
  (collection, response) => collection.concat(response.items!),
  [] as APIGateway.DomainName[],
);
```

***

<a id="api-runperiodically"></a>

##### runPeriodically()

> `static` **runPeriodically**\<`T`\>(`operation`, `interval`, `options?`): `object`

Runs an operation periodically with configurable intervals and stopping conditions.

- `interval` may be a single number (ms), an array of numbers, or a function
  that receives the iteration number (starting at 1) and returns the next
  interval in milliseconds or `undefined` to stop.
- If the interval array runs out of elements or the function returns `undefined`
  (or a negative value), no further invocations will be scheduled.

Options:
- `maxExecutions` stop after N runs (inclusive).
- `maxDurationMs` stop after elapsed ms since the first scheduled start.
- `schedule` controls how the interval is measured:
  - `'delayAfterEnd'`: wait the interval after the previous operation completes
    before scheduling the next one (equivalent to a fixed delay between ends).
  - `'delayBetweenStarts'`: keep start times on a regular schedule (interval measured
    between the starts of successive operations).
  The default schedule is `'delayBetweenStarts'`.

Returns an object with `stop()` to cancel further executions and `done` which
resolves when the periodic runner stops. If the provided `operation` throws or
rejects, the `done` promise will reject with that error so callers can handle it.

Note: The first invocation of `operation` is scheduled after the first interval
elapses (i.e. this function does NOT call `operation` immediately). If you need
an immediate run, invoke `operation(1)` yourself before calling `runPeriodically`.

###### Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `T` | The operation return type (ignored by the runner; used for typing). |

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `operation` | (`iteration`) => `T` \| `Promise`\<`T`\> | Function to run each iteration. Receives the iteration index (1-based). |
| `interval` | `number` \| `number`[] \| (`iteration`) => `number` \| `undefined` | Number | number[] | ((iteration: number) => number|undefined) defining waits. |
| `options?` | \{ `maxDurationMs?`: `number`; `maxExecutions?`: `number`; `schedule?`: `"delayAfterEnd"` \| `"delayBetweenStarts"`; \} | Optional configuration. |
| `options.maxDurationMs?` | `number` | Stop after N milliseconds. |
| `options.maxExecutions?` | `number` | Stop after N executions. |
| `options.schedule?` | `"delayAfterEnd"` \| `"delayBetweenStarts"` | How to measure intervals: `'delayAfterEnd'` or `'delayBetweenStarts'`. |

###### Returns

`object`

An object containing `stop()` to cancel further executions and `done` Promise
         which resolves when the periodic runner stops (or rejects if the operation errors).

| Name | Type |
| ------ | ------ |
| `done` | `Promise`\<`void`\> |
| `stop()` | () => `void` |

***

<a id="api-synchronised"></a>

##### synchronised()

> `static` **synchronised**\<`T`\>(`lock`, `operation`): `Promise`\<`T`\>

This is just another spelling of [PromiseUtils.synchronized](#api-synchronized).

###### Type Parameters

| Type Parameter |
| ------ |
| `T` |

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `lock` | `any` | The object (such as a string, a number, or `this` in a class) used to identify the lock. |
| `operation` | (`previousState`, `previousSettledState`, `previousResult`) => `Promise`\<`T`\> | The function that performs the computation and returns a Promise. |

###### Returns

`Promise`\<`T`\>

The result of the operation function.

***

<a id="api-synchronized"></a>

##### synchronized()

> `static` **synchronized**\<`T`\>(`lock`, `operation`): `Promise`\<`T`\>

Provides mutual exclusion similar to `synchronized` in Java.
Ensures no concurrent execution of any operation function associated with the same lock.
The operation function has access to the state (when `synchronized` is called),
settledState (when the operation function is called),
and result (either the fulfilled result or the rejected reason) of the previous operation.
If there is no previous invocation, state, settledState, and result will all be undefined.

###### Type Parameters

| Type Parameter |
| ------ |
| `T` |

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `lock` | `any` | The object (such as a string, a number, or `this` in a class) used to identify the lock. |
| `operation` | (`previousState`, `previousSettledState`, `previousResult`) => `Promise`\<`T`\> | The function that performs the computation and returns a Promise. |

###### Returns

`Promise`\<`T`\>

The result of the operation function.

***

<a id="api-timeoutreject"></a>

##### timeoutReject()

> `static` **timeoutReject**\<`T`, `R`\>(`operation`, `ms`, `rejectReason`): `Promise`\<`T`\>

Applies a timeout to a Promise or a function that returns a Promise.
If the timeout occurs, the returned Promise rejects with the specified reason.
If the timeout does not occur, the returned Promise resolves or rejects based on the outcome of the original Promise.
If the `rejectReason` parameter is a function and the timeout does not occur, the function will not be called.
Note: The rejection of the `operation` parameter is not handled by this function. You may want to handle it outside this function to avoid warnings like "(node:4330) PromiseRejectionHandledWarning: Promise rejection was handled asynchronously."

###### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | `never` |
| `R` | `any` |

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `operation` | `Promise`\<`T`\> \| () => `Promise`\<`T`\> | The original Promise or a function that returns a Promise to which the timeout will be applied. |
| `ms` | `number` | The number of milliseconds for the timeout. |
| `rejectReason` | `R` \| `PromiseLike`\<`R`\> \| () => `R` \| `PromiseLike`\<`R`\> | The reason to reject with if the timeout occurs, or a function that supplies the reason. |

###### Returns

`Promise`\<`T`\>

A new Promise that rejects with the specified reason if the timeout occurs.

***

<a id="api-timeoutresolve"></a>

##### timeoutResolve()

> `static` **timeoutResolve**\<`T`\>(`operation`, `ms`, `result?`): `Promise`\<`T`\>

Applies a timeout to a Promise or a function that returns a Promise.
If the timeout occurs, the returned Promise resolves to the specified result.
If the timeout does not occur, the returned Promise resolves or rejects based on the outcome of the original Promise.
If the `result` parameter is a function and the timeout does not occur, the function will not be called.
Note: The rejection of the `operation` parameter is not handled by this function. 
You may want to handle it outside this function to avoid warnings like "(node:4330) PromiseRejectionHandledWarning: Promise rejection was handled asynchronously."

###### Type Parameters

| Type Parameter |
| ------ |
| `T` |

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `operation` | `Promise`\<`T`\> \| () => `Promise`\<`T`\> | The original Promise or a function that returns a Promise to which the timeout will be applied. |
| `ms` | `number` | The number of milliseconds for the timeout. |
| `result?` | `T` \| `PromiseLike`\<`T`\> \| () => `T` \| `PromiseLike`\<`T`\> | The result to resolve with if the timeout occurs, or a function that supplies the result. |

###### Returns

`Promise`\<`T`\>

A new Promise that resolves to the specified result if the timeout occurs.

***

<a id="api-withconcurrency"></a>

##### withConcurrency()

> `static` **withConcurrency**\<`Data`, `Result`\>(`concurrency`, `jobs`, `operation`): `Promise`\<`Result`[]\>

Executes multiple jobs/operations with a specified level of concurrency.

Unlike `inParallel(...)`, this function may throw or reject an error when a job/operation fails.
When an error is re-thrown, remaining operations will not be executed.
If you want all the operations to always be executed, use [PromiseUtils.inParallel](#api-inparallel) instead.

###### Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `Data` | The type of the job data, typically an Array. |
| `Result` | The type of the return value from the operation function. |

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `concurrency` | `number` | The number of jobs/operations to run concurrently. |
| `jobs` | `Iterable`\<`Data`\> | The job data to be processed. This function can handle an infinite or unknown number of elements safely. |
| `operation` | (`job`, `index`) => `Promise`\<`Result`\> | The function that processes job data asynchronously. |

###### Returns

`Promise`\<`Result`[]\>

A promise that resolves to an array containing the results from the operation function.
         The results in the returned array are in the same order as the corresponding elements in the jobs array.

###### Example

```ts
// At any time, there would be no more than 5 concurrency API calls. Error would be re-thrown immediately when it occurs.
const attributes = await PromiseUtils.withConcurrency(5, topicArns, async (topicArn) => {
  const topicAttributes = (await sns.getTopicAttributes({ TopicArn: topicArn }).promise()).Attributes!;
  return topicAttributes;
});
```

***

<a id="api-withretry"></a>

##### withRetry()

> `static` **withRetry**\<`Result`, `TError`\>(`operation`, `backoff`, `shouldRetry`): `Promise`\<`Result`\>

Repeatedly performs an operation until a specified criteria is met.

###### Type Parameters

| Type Parameter | Default type | Description |
| ------ | ------ | ------ |
| `Result` | - | Type of the operation result. |
| `TError` | `any` | Type of the possible error that could be generated by the operation. |

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `operation` | (`attempt`, `previousResult`, `previousError`) => `Promise`\<`Result`\> | A function that outputs a Promise result. Typically, the operation does not use its arguments. |
| `backoff` | `number`[] \| (`attempt`, `previousResult`, `previousError`) => `number` \| `undefined` | An array of retry backoff periods (in milliseconds) or a function for calculating them. If retry is desired, the specified backoff period is waited before the next call to the operation. If the array runs out of elements or the function returns `undefined` or a negative number, no further calls to the operation will be made. The `attempt` argument passed to the backoff function starts from 1, as it is called immediately after the first attempt and before the first retry. |
| `shouldRetry` | (`previousError`, `previousResult`, `attempt`) => `boolean` | A predicate function for deciding whether another call to the operation should occur. If this argument is not defined, a retry will occur whenever the operation rejects with an error. The `shouldRetry` function is evaluated before the `backoff`. The `attempt` argument passed to the shouldRetry function starts from 1. |

###### Returns

`Promise`\<`Result`\>

A promise of the operation result, potentially with retries applied.

###### Example

```ts
const result = await PromiseUtils.withRetry(() => doSomething(), [100, 200, 300, 500, 800, 1000]);
const result2 = await PromiseUtils.withRetry(() => doSomething(), Array.from({length: 10}, (_v, i) => 1000 * Math.min(FIBONACCI_SEQUENCE[i], 10), err => err.statusCode === 429);
const result3 = await PromiseUtils.withRetry(() => doSomething(), attempt => attempt <= 8 ? 1000 * Math.min(FIBONACCI_SEQUENCE[attempt - 1], 10) : undefined, err => err.statusCode === 429);
```

## Type Aliases


<a id="type-aliasespromisestatetypemd"></a>

### Type Alias: PromiseStateType

> **PromiseStateType** = keyof *typeof* [`PromiseState`](#variablespromisestate-1md)

## Variables


<a id="variablesexponential_sequencemd"></a>

### Variable: EXPONENTIAL\_SEQUENCE

> `const` **EXPONENTIAL\_SEQUENCE**: `number`[]

Array of 25 exponential numbers starting from 1 up to 33554432.
It can be used to form your own backoff interval array.

#### Example

```ts
// 1ms, 2ms, 4ms, 8ms, 16ms, 32ms
PromiseUtils.withRetry(() => doSomething(), EXPONENTIAL_SEQUENCE.slice(0, 5), err => err.statusCode === 429);
// 1s, 2s, 4s, 8s, 10s, 10s, 10s, 10s, 10s, 10s
PromiseUtils.withRetry(() => doSomething(), Array.from({length: 10}, (_v, i) => 1000 * Math.min(EXPONENTIAL_SEQUENCE[i], 10)), err => err.statusCode === 429);
// with +-10% randomness: 1s, 2s, 4s, 8s
PromiseUtils.withRetry(() => doSomething(), FIBONACCI_SEQUENCE.slice(0, 4).map(n => 1000 * n * (1 + (Math.random() - 0.5) / 5)), err => err.statusCode === 429);
```


<a id="variablesfibonacci_sequencemd"></a>

### Variable: FIBONACCI\_SEQUENCE

> `const` **FIBONACCI\_SEQUENCE**: `number`[]

Array of 25 Fibonacci numbers starting from 1 up to 317811.
It can be used to form your own backoff interval array.

#### Example

```ts
// 1ms, 2ms, 3ms, 5ms, 8ms, 13ms
PromiseUtils.withRetry(() => doSomething(), FIBONACCI_SEQUENCE.slice(0, 5), err => err.statusCode === 429);
// 1s, 2s, 3s, 4s, 8s, 10s, 10s, 10s, 10s, 10s
PromiseUtils.withRetry(() => doSomething(), Array.from({length: 10}, (_v, i) => 1000 * Math.min(FIBONACCI_SEQUENCE[i], 10)), err => err.statusCode === 429);
// with +-10% randomness: 1s, 2s, 3s, 5s, 8s, 13s
PromiseUtils.withRetry(() => doSomething(), FIBONACCI_SEQUENCE.slice(0, 5).map(n => 1000 * n * (1 + (Math.random() - 0.5) / 5)), err => err.statusCode === 429);
```


<a id="variablespromisestate-1md"></a>

### Variable: PromiseState

> `const` **PromiseState**: `object`

The state of a Promise can only be one of: Pending, Fulfilled, and Rejected.

#### Type Declaration

| Name | Type | Default value |
| ------ | ------ | ------ |
| <a id="api-fulfilled"></a> `Fulfilled` | `"Fulfilled"` | `'Fulfilled'` |
| <a id="api-pending"></a> `Pending` | `"Pending"` | `'Pending'` |
| <a id="api-rejected"></a> `Rejected` | `"Rejected"` | `'Rejected'` |


<a id="variablescancellabledelayedrejectmd"></a>

### Variable: cancellableDelayedReject()

> `const` **cancellableDelayedReject**: \<`T`, `R`\>(`ms`, `reason`) => `object` = `PromiseUtils.cancellableDelayedReject`

Creates a cancellable timer that will reject after a specified number of milliseconds.

The returned object contains:
- stop() to cancel the scheduled rejection (if called before the timer fires). Calling
  stop() prevents the promise from being settled by this timer.
- promise which will reject with the supplied reason (or the value returned by the
  reason function) after ms milliseconds unless stop() is called first.

If the reason is a PromiseLike that rejects, its rejection value will be used as the rejection reason.

Creates a cancellable timer that will reject after a specified number of milliseconds.

The returned object contains:
- `stop()` to cancel the scheduled rejection (if called before the timer fires). Calling
  `stop()` prevents the promise from being settled by this timer.
- `promise` which will reject with the supplied `reason` (or the value returned by the
  `reason` function) after `ms` milliseconds unless `stop()` is called first.

If the `reason` is a PromiseLike that rejects, its rejection value will be used as the rejection reason.

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | `never` |
| `R` | `any` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `ms` | `number` | The number of milliseconds after which the scheduled rejection will occur. |
| `reason` | `R` \| `PromiseLike`\<`R`\> \| () => `R` \| `PromiseLike`\<`R`\> | The reason for the rejection, or a function that supplies the reason. |

#### Returns

`object`

An object with `stop()` and `promise`.

| Name | Type |
| ------ | ------ |
| `promise` | `Promise`\<`T`\> |
| `stop()` | () => `void` |

#### Param

The number of milliseconds after which the scheduled rejection will occur.

#### Param

The reason for the rejection, or a function that supplies the reason.

#### Returns

An object with stop() and promise.


<a id="variablescancellabledelayedresolvemd"></a>

### Variable: cancellableDelayedResolve()

> `const` **cancellableDelayedResolve**: \<`T`\>(`ms`, `result?`) => `object` = `PromiseUtils.cancellableDelayedResolve`

Creates a cancellable timer that will resolve after a specified number of milliseconds.

The returned object contains:
- stop() to cancel the scheduled resolution (if called before the timer fires). Calling
  stop() prevents the promise from being settled by this timer.
- promise which will resolve with the supplied result (or the value returned by the
  result function) after ms milliseconds unless stop() is called first.

If the result is a PromiseLike, its resolution value will be used as the resolved value.

Creates a cancellable timer that will resolve after a specified number of milliseconds.

The returned object contains:
- `stop()` to cancel the scheduled resolution (if called before the timer fires). Calling
  `stop()` prevents the promise from being settled by this timer.
- `promise` which will resolve with the supplied `result` (or the value returned by the
  `result` function) after `ms` milliseconds unless `stop()` is called first.

Note: If the `result` is a function that returns a Promise, the returned `promise` will
resolve with that Promise's resolution (i.e. it behaves like resolving with a PromiseLike).

#### Type Parameters

| Type Parameter |
| ------ |
| `T` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `ms` | `number` | The number of milliseconds after which the scheduled resolution will occur. |
| `result?` | `T` \| `PromiseLike`\<`T`\> \| () => `T` \| `PromiseLike`\<`T`\> | The result to be resolved by the Promise, or a function that supplies the result. |

#### Returns

`object`

An object with `stop()` and `promise`.

| Name | Type |
| ------ | ------ |
| `promise` | `Promise`\<`T`\> |
| `stop()` | () => `void` |

#### Param

The number of milliseconds after which the scheduled resolution will occur.

#### Param

The result to be resolved by the Promise, or a function that supplies the result.

#### Returns

An object with stop() and promise.


<a id="variablesdelayedrejectmd"></a>

### Variable: delayedReject()

> `const` **delayedReject**: \<`T`, `R`\>(`ms`, `reason`) => `Promise`\<`T`\> = `PromiseUtils.delayedReject`

Creates a Promise that rejects after a specified number of milliseconds.

The reason argument may be:
- a value to reject with,
- a PromiseLike whose rejection will be adopted by the returned Promise, or
- a function which is invoked when the timer fires and may return a value or a PromiseLike.

If reason is a function, it is called when the timer elapses; if it returns a Promise,
the returned Promise will reject with that Promise's rejection reason (or reject with the
returned value if it resolves).

Creates a Promise that rejects after a specified number of milliseconds.

The `reason` argument may be:
- a value to reject with,
- a PromiseLike whose rejection will be adopted by the returned Promise, or
- a function which is invoked when the timer fires and may return a value or a PromiseLike.

If `reason` is a function, it is called when the timer elapses; if it returns a Promise,
the returned Promise will reject with that Promise's rejection reason (or reject with the
returned value if it resolves).

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | `never` |
| `R` | `any` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `ms` | `number` | The number of milliseconds after which the created Promise will reject. |
| `reason` | `R` \| `PromiseLike`\<`R`\> \| () => `R` \| `PromiseLike`\<`R`\> | The reason for the rejection, or a function that supplies the reason. |

#### Returns

`Promise`\<`T`\>

A Promise that rejects with the specified reason after the specified delay.

#### Param

The number of milliseconds after which the created Promise will reject.

#### Param

The reason for the rejection, or a function that supplies the reason.

#### Returns

A Promise that rejects with the specified reason after the specified delay.


<a id="variablesdelayedresolvemd"></a>

### Variable: delayedResolve()

> `const` **delayedResolve**: \<`T`\>(`ms`, `result?`) => `Promise`\<`T`\> = `PromiseUtils.delayedResolve`

Creates a Promise that resolves after a specified number of milliseconds.

The result argument may be:
- a value to resolve with,
- a PromiseLike whose resolution will be adopted by the returned Promise, or
- a function which is invoked when the timer fires and may return a value or a PromiseLike.

If result is a function, it is called when the timer elapses; if it returns a Promise,
the returned Promise will adopt that Promise's outcome.

Creates a Promise that resolves after a specified number of milliseconds.

The `result` argument may be:
- a value to resolve with,
- a PromiseLike whose resolution will be adopted by the returned Promise, or
- a function which is invoked when the timer fires and may return a value or a PromiseLike.

If `result` is a function, it is called when the timer elapses; if it returns a Promise,
the returned Promise will adopt that Promise's outcome.

#### Type Parameters

| Type Parameter |
| ------ |
| `T` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `ms` | `number` | The number of milliseconds after which the created Promise will resolve. |
| `result?` | `T` \| `PromiseLike`\<`T`\> \| () => `T` \| `PromiseLike`\<`T`\> | The result to be resolved by the Promise, or a function that supplies the result. |

#### Returns

`Promise`\<`T`\>

A Promise that resolves with the specified result after the specified delay.

#### Param

The number of milliseconds after which the created Promise will resolve.

#### Param

The result to be resolved by the Promise, or a function that supplies the result.

#### Returns

A Promise that resolves with the specified result after the specified delay.


<a id="variablesinparallelmd"></a>

### Variable: inParallel()

> `const` **inParallel**: \<`Data`, `Result`, `TError`\>(`parallelism`, `jobs`, `operation`, `options?`) => `Promise`\<(`Result` \| `TError`)[]\> = `PromiseUtils.inParallel`

Executes multiple jobs/operations in parallel. By default, all operations are executed regardless of any failures.
In most cases, using withConcurrency might be more convenient.

By default, this function does not throw or reject an error when any job/operation fails.
Errors from operations are returned alongside results in the returned array.
This function only resolves when all jobs/operations are settled (either resolved or rejected).

If options.abortOnError is set to true, this function throws (or rejects with) an error immediately when any job/operation fails.
In this mode, some jobs/operations may not be executed if one fails.

Executes multiple jobs/operations in parallel. By default, all operations are executed regardless of any failures.
In most cases, using [PromiseUtils.withConcurrency](#withconcurrency) might be more convenient.

By default, this function does not throw or reject an error when any job/operation fails.
Errors from operations are returned alongside results in the returned array.
This function only resolves when all jobs/operations are settled (either resolved or rejected).

If `options.abortOnError` is set to true, this function throws (or rejects with) an error immediately when any job/operation fails.
In this mode, some jobs/operations may not be executed if one fails.

#### Type Parameters

| Type Parameter | Default type | Description |
| ------ | ------ | ------ |
| `Data` | - | The type of the job data, typically an Array. |
| `Result` | - | The type of the return value from the operation function. |
| `TError` | `Result` | The type for the error that could be thrown from the operation function, defaults to `Result`. |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `parallelism` | `number` | The number of jobs/operations to run concurrently. |
| `jobs` | `Iterable`\<`Data`\> | The job data to be processed. This function can safely handle an infinite or unknown number of elements. |
| `operation` | (`job`, `index`) => `Promise`\<`Result`\> | The function that processes job data asynchronously. |
| `options?` | \{ `abortOnError`: `boolean`; \} | Options to control the function's behavior. |
| `options.abortOnError?` | `boolean` | If true, the function aborts and throws an error on the first failed operation. |

#### Returns

`Promise`\<(`Result` \| `TError`)[]\>

A promise that resolves to an array containing the results of the operations.
 Each element is either a fulfilled result or a rejected error/reason.
 The results or errors in the returned array are in the same order as the corresponding elements in the jobs array.

#### Example

```ts
// Capture errors in the returned array
const attributesAndPossibleErrors: Array<JobResult|JobError> = await PromiseUtils.inParallel(5, topicArns, async (topicArn) => {
  const topicAttributes = (await sns.getTopicAttributes({ TopicArn: topicArn }).promise()).Attributes!;
  return topicAttributes;
});

// Abort on the first error
let results: Array<JobResult>;
try {
  results = await PromiseUtils.inParallel(100, jobs, async (job) => processor.process(job), { abortOnError: true });
} catch (error) {
  // handle the error
}
```

#### Param

The number of jobs/operations to run concurrently.

#### Param

The job data to be processed. This function can safely handle an infinite or unknown number of elements.

#### Param

The function that processes job data asynchronously.

#### Param

Options to control the function's behavior.

#### Param

If true, the function aborts and throws an error on the first failed operation.

#### Returns

A promise that resolves to an array containing the results of the operations.
 Each element is either a fulfilled result or a rejected error/reason.
 The results or errors in the returned array are in the same order as the corresponding elements in the jobs array.


<a id="variablespromisestatemd"></a>

### Variable: promiseState()

> `const` **promiseState**: (`p`) => `Promise`\<`"Pending"` \| `"Fulfilled"` \| `"Rejected"`\> = `PromiseUtils.promiseState`

Retrieves the state of the specified Promise.
Note: The returned value is a Promise that resolves immediately.

Retrieves the state of the specified Promise.
Note: The returned value is a Promise that resolves immediately.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `p` | `Promise`\<`any`\> | The Promise whose state is to be determined. |

#### Returns

`Promise`\<`"Pending"` \| `"Fulfilled"` \| `"Rejected"`\>

A Promise that resolves immediately with the state of the input Promise.

#### Param

The Promise whose state is to be determined.

#### Returns

A Promise that resolves immediately with the state of the input Promise.


<a id="variablesrepeatmd"></a>

### Variable: repeat()

> `const` **repeat**: \<`Result`, `Param`, `Collection`\>(`operation`, `nextParameter`, `collect`, `initialCollection`, `initialParameter`) => `Promise`\<`Collection`\> = `PromiseUtils.repeat`

Executes an operation repeatedly and collects all the results.
This function is very useful for many scenarios, such like client-side pagination.

Executes an operation repeatedly and collects all the results.
This function is very useful for many scenarios, such like client-side pagination.

#### Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `Result` | The type of the operation result. |
| `Param` | The type of the input to the operation, typically a paging parameter. |
| `Collection` | The type of the collection returned by this function. |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `operation` | (`parameter`) => `Promise`\<`Result`\> | A function that takes a parameter as input and returns a result. Typically, the parameter has optional fields to control paging. |
| `nextParameter` | (`response`) => `Partial`\<`Param`\> \| `Promise`\<`Partial`\<`Param`\>\> \| `null` | A function for calculating the next parameter from the operation result. Normally, this parameter controls paging. This function should return null when no further invocation of the operation function is desired. If further invocation is desired, the return value of this function can be a Promise or a non-Promise value. |
| `collect` | (`collection`, `result`) => `Collection` | A function for merging the operation result into the collection. |
| `initialCollection` | `Collection` | The initial collection, which will be the first argument passed to the first invocation of the collect function. |
| `initialParameter` | `Partial`\<`Param`\> | The parameter for the first operation. |

#### Returns

`Promise`\<`Collection`\>

A promise that resolves to a collection of all the results returned by the operation function.

#### Example

```ts
const domainNameObjects = await PromiseUtils.repeat(
  pagingParam => apig.getDomainNames({limit: 500, ...pagingParam}).promise(),
  response => response.position? {position: response.position} : null,
  (collection, response) => collection.concat(response.items!),
  [] as APIGateway.DomainName[],
);
```

#### Param

A function that takes a parameter as input and returns a result. Typically, the parameter has optional fields to control paging.

#### Param

A function for calculating the next parameter from the operation result. Normally, this parameter controls paging. This function should return null when no further invocation of the operation function is desired. If further invocation is desired, the return value of this function can be a Promise or a non-Promise value.

#### Param

A function for merging the operation result into the collection.

#### Param

The initial collection, which will be the first argument passed to the first invocation of the collect function.

#### Param

The parameter for the first operation.

#### Returns

A promise that resolves to a collection of all the results returned by the operation function.


<a id="variablesrunperiodicallymd"></a>

### Variable: runPeriodically()

> `const` **runPeriodically**: \<`T`\>(`operation`, `interval`, `options?`) => `object` = `PromiseUtils.runPeriodically`

Runs an operation periodically with configurable intervals and stopping conditions.

- `interval` may be a single number (ms), an array of numbers, or a function
  that receives the iteration number (starting at 1) and returns the next
  interval in milliseconds or `undefined` to stop.
- If the interval array runs out of elements or the function returns `undefined`
  (or a negative value), no further invocations will be scheduled.

Options:
- `maxExecutions` stop after N runs (inclusive).
- `maxDurationMs` stop after elapsed ms since the first scheduled start.
- `schedule` controls how the interval is measured:
  - `'delayAfterEnd'`: wait the interval after the previous operation completes
    before scheduling the next one (equivalent to a fixed delay between ends).
  - `'delayBetweenStarts'`: keep start times on a regular schedule (interval measured
    between the starts of successive operations).
  The default schedule is `'delayBetweenStarts'`.

Returns an object with `stop()` to cancel further executions and `done` which
resolves when the periodic runner stops. If the provided `operation` throws or
rejects, the `done` promise will reject with that error so callers can handle it.

Note: The first invocation of `operation` is scheduled after the first interval
elapses (i.e. this function does NOT call `operation` immediately). If you need
an immediate run, invoke `operation(1)` yourself before calling `runPeriodically`.

Runs an operation periodically with configurable intervals and stopping conditions.

- `interval` may be a single number (ms), an array of numbers, or a function
  that receives the iteration number (starting at 1) and returns the next
  interval in milliseconds or `undefined` to stop.
- If the interval array runs out of elements or the function returns `undefined`
  (or a negative value), no further invocations will be scheduled.

Options:
- `maxExecutions` stop after N runs (inclusive).
- `maxDurationMs` stop after elapsed ms since the first scheduled start.
- `schedule` controls how the interval is measured:
  - `'delayAfterEnd'`: wait the interval after the previous operation completes
    before scheduling the next one (equivalent to a fixed delay between ends).
  - `'delayBetweenStarts'`: keep start times on a regular schedule (interval measured
    between the starts of successive operations).
  The default schedule is `'delayBetweenStarts'`.

Returns an object with `stop()` to cancel further executions and `done` which
resolves when the periodic runner stops. If the provided `operation` throws or
rejects, the `done` promise will reject with that error so callers can handle it.

Note: The first invocation of `operation` is scheduled after the first interval
elapses (i.e. this function does NOT call `operation` immediately). If you need
an immediate run, invoke `operation(1)` yourself before calling `runPeriodically`.

#### Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `T` | The operation return type (ignored by the runner; used for typing). |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `operation` | (`iteration`) => `T` \| `Promise`\<`T`\> | Function to run each iteration. Receives the iteration index (1-based). |
| `interval` | `number` \| `number`[] \| (`iteration`) => `number` \| `undefined` | Number | number[] | ((iteration: number) => number|undefined) defining waits. |
| `options?` | \{ `maxDurationMs?`: `number`; `maxExecutions?`: `number`; `schedule?`: `"delayAfterEnd"` \| `"delayBetweenStarts"`; \} | Optional configuration. |
| `options.maxDurationMs?` | `number` | Stop after N milliseconds. |
| `options.maxExecutions?` | `number` | Stop after N executions. |
| `options.schedule?` | `"delayAfterEnd"` \| `"delayBetweenStarts"` | How to measure intervals: `'delayAfterEnd'` or `'delayBetweenStarts'`. |

#### Returns

`object`

An object containing `stop()` to cancel further executions and `done` Promise
         which resolves when the periodic runner stops (or rejects if the operation errors).

| Name | Type |
| ------ | ------ |
| `done` | `Promise`\<`void`\> |
| `stop()` | () => `void` |

#### Template

The operation return type (ignored by the runner; used for typing).

#### Param

Function to run each iteration. Receives the iteration index (1-based).

#### Param

Number | number[] | ((iteration: number) => number|undefined) defining waits.

#### Param

Optional configuration.

#### Param

Stop after N executions.

#### Param

Stop after N milliseconds.

#### Param

How to measure intervals: `'delayAfterEnd'` or `'delayBetweenStarts'`.

#### Returns

An object containing `stop()` to cancel further executions and `done` Promise
         which resolves when the periodic runner stops (or rejects if the operation errors).


<a id="variablessynchronisedmd"></a>

### Variable: synchronised()

> `const` **synchronised**: \<`T`\>(`lock`, `operation`) => `Promise`\<`T`\> = `PromiseUtils.synchronised`

This is just another spelling of synchronized.

This is just another spelling of [PromiseUtils.synchronized](#synchronized).

#### Type Parameters

| Type Parameter |
| ------ |
| `T` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `lock` | `any` | The object (such as a string, a number, or `this` in a class) used to identify the lock. |
| `operation` | (`previousState`, `previousSettledState`, `previousResult`) => `Promise`\<`T`\> | The function that performs the computation and returns a Promise. |

#### Returns

`Promise`\<`T`\>

The result of the operation function.

#### Param

The object (such as a string, a number, or this in a class) used to identify the lock.

#### Param

The function that performs the computation and returns a Promise.

#### Returns

The result of the operation function.


<a id="variablessynchronizedmd"></a>

### Variable: synchronized()

> `const` **synchronized**: \<`T`\>(`lock`, `operation`) => `Promise`\<`T`\> = `PromiseUtils.synchronized`

Provides mutual exclusion similar to synchronized in Java.
Ensures no concurrent execution of any operation function associated with the same lock.
The operation function has access to the state (when synchronized is called),
settledState (when the operation function is called),
and result (either the fulfilled result or the rejected reason) of the previous operation.
If there is no previous invocation, state, settledState, and result will all be undefined.

Provides mutual exclusion similar to `synchronized` in Java.
Ensures no concurrent execution of any operation function associated with the same lock.
The operation function has access to the state (when `synchronized` is called),
settledState (when the operation function is called),
and result (either the fulfilled result or the rejected reason) of the previous operation.
If there is no previous invocation, state, settledState, and result will all be undefined.

#### Type Parameters

| Type Parameter |
| ------ |
| `T` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `lock` | `any` | The object (such as a string, a number, or `this` in a class) used to identify the lock. |
| `operation` | (`previousState`, `previousSettledState`, `previousResult`) => `Promise`\<`T`\> | The function that performs the computation and returns a Promise. |

#### Returns

`Promise`\<`T`\>

The result of the operation function.

#### Param

The object (such as a string, a number, or this in a class) used to identify the lock.

#### Param

The function that performs the computation and returns a Promise.

#### Returns

The result of the operation function.


<a id="variablestimeoutrejectmd"></a>

### Variable: timeoutReject()

> `const` **timeoutReject**: \<`T`, `R`\>(`operation`, `ms`, `rejectReason`) => `Promise`\<`T`\> = `PromiseUtils.timeoutReject`

Applies a timeout to a Promise or a function that returns a Promise.
If the timeout occurs, the returned Promise rejects with the specified reason.
If the timeout does not occur, the returned Promise resolves or rejects based on the outcome of the original Promise.
If the rejectReason parameter is a function and the timeout does not occur, the function will not be called.
Note: The rejection of the operation parameter is not handled by this function. You may want to handle it outside this function to avoid warnings like "(node:4330) PromiseRejectionHandledWarning: Promise rejection was handled asynchronously."

Applies a timeout to a Promise or a function that returns a Promise.
If the timeout occurs, the returned Promise rejects with the specified reason.
If the timeout does not occur, the returned Promise resolves or rejects based on the outcome of the original Promise.
If the `rejectReason` parameter is a function and the timeout does not occur, the function will not be called.
Note: The rejection of the `operation` parameter is not handled by this function. You may want to handle it outside this function to avoid warnings like "(node:4330) PromiseRejectionHandledWarning: Promise rejection was handled asynchronously."

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | `never` |
| `R` | `any` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `operation` | `Promise`\<`T`\> \| () => `Promise`\<`T`\> | The original Promise or a function that returns a Promise to which the timeout will be applied. |
| `ms` | `number` | The number of milliseconds for the timeout. |
| `rejectReason` | `R` \| `PromiseLike`\<`R`\> \| () => `R` \| `PromiseLike`\<`R`\> | The reason to reject with if the timeout occurs, or a function that supplies the reason. |

#### Returns

`Promise`\<`T`\>

A new Promise that rejects with the specified reason if the timeout occurs.

#### Param

The original Promise or a function that returns a Promise to which the timeout will be applied.

#### Param

The number of milliseconds for the timeout.

#### Param

The reason to reject with if the timeout occurs, or a function that supplies the reason.

#### Returns

A new Promise that rejects with the specified reason if the timeout occurs.


<a id="variablestimeoutresolvemd"></a>

### Variable: timeoutResolve()

> `const` **timeoutResolve**: \<`T`\>(`operation`, `ms`, `result?`) => `Promise`\<`T`\> = `PromiseUtils.timeoutResolve`

Applies a timeout to a Promise or a function that returns a Promise.
If the timeout occurs, the returned Promise resolves to the specified result.
If the timeout does not occur, the returned Promise resolves or rejects based on the outcome of the original Promise.
If the result parameter is a function and the timeout does not occur, the function will not be called.
Note: The rejection of the operation parameter is not handled by this function. 
You may want to handle it outside this function to avoid warnings like "(node:4330) PromiseRejectionHandledWarning: Promise rejection was handled asynchronously."

Applies a timeout to a Promise or a function that returns a Promise.
If the timeout occurs, the returned Promise resolves to the specified result.
If the timeout does not occur, the returned Promise resolves or rejects based on the outcome of the original Promise.
If the `result` parameter is a function and the timeout does not occur, the function will not be called.
Note: The rejection of the `operation` parameter is not handled by this function. 
You may want to handle it outside this function to avoid warnings like "(node:4330) PromiseRejectionHandledWarning: Promise rejection was handled asynchronously."

#### Type Parameters

| Type Parameter |
| ------ |
| `T` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `operation` | `Promise`\<`T`\> \| () => `Promise`\<`T`\> | The original Promise or a function that returns a Promise to which the timeout will be applied. |
| `ms` | `number` | The number of milliseconds for the timeout. |
| `result?` | `T` \| `PromiseLike`\<`T`\> \| () => `T` \| `PromiseLike`\<`T`\> | The result to resolve with if the timeout occurs, or a function that supplies the result. |

#### Returns

`Promise`\<`T`\>

A new Promise that resolves to the specified result if the timeout occurs.

#### Param

The original Promise or a function that returns a Promise to which the timeout will be applied.

#### Param

The number of milliseconds for the timeout.

#### Param

The result to resolve with if the timeout occurs, or a function that supplies the result.

#### Returns

A new Promise that resolves to the specified result if the timeout occurs.


<a id="variableswithconcurrencymd"></a>

### Variable: withConcurrency()

> `const` **withConcurrency**: \<`Data`, `Result`\>(`concurrency`, `jobs`, `operation`) => `Promise`\<`Result`[]\> = `PromiseUtils.withConcurrency`

Executes multiple jobs/operations with a specified level of concurrency.

Executes multiple jobs/operations with a specified level of concurrency.

Unlike `inParallel(...)`, this function may throw or reject an error when a job/operation fails.
When an error is re-thrown, remaining operations will not be executed.
If you want all the operations to always be executed, use [PromiseUtils.inParallel](#inparallel) instead.

#### Type Parameters

| Type Parameter | Description |
| ------ | ------ |
| `Data` | The type of the job data, typically an Array. |
| `Result` | The type of the return value from the operation function. |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `concurrency` | `number` | The number of jobs/operations to run concurrently. |
| `jobs` | `Iterable`\<`Data`\> | The job data to be processed. This function can handle an infinite or unknown number of elements safely. |
| `operation` | (`job`, `index`) => `Promise`\<`Result`\> | The function that processes job data asynchronously. |

#### Returns

`Promise`\<`Result`[]\>

A promise that resolves to an array containing the results from the operation function.
         The results in the returned array are in the same order as the corresponding elements in the jobs array.

#### Example

```ts
// At any time, there would be no more than 5 concurrency API calls. Error would be re-thrown immediately when it occurs.
const attributes = await PromiseUtils.withConcurrency(5, topicArns, async (topicArn) => {
  const topicAttributes = (await sns.getTopicAttributes({ TopicArn: topicArn }).promise()).Attributes!;
  return topicAttributes;
});
```

#### Param

The number of jobs/operations to run concurrently.

#### Param

The job data to be processed. This function can handle an infinite or unknown number of elements safely.

#### Param

The function that processes job data asynchronously.

#### Returns

A promise that resolves to an array containing the results from the operation function.
         The results in the returned array are in the same order as the corresponding elements in the jobs array.


<a id="variableswithretrymd"></a>

### Variable: withRetry()

> `const` **withRetry**: \<`Result`, `TError`\>(`operation`, `backoff`, `shouldRetry`) => `Promise`\<`Result`\> = `PromiseUtils.withRetry`

Repeatedly performs an operation until a specified criteria is met.

Repeatedly performs an operation until a specified criteria is met.

#### Type Parameters

| Type Parameter | Default type | Description |
| ------ | ------ | ------ |
| `Result` | - | Type of the operation result. |
| `TError` | `any` | Type of the possible error that could be generated by the operation. |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `operation` | (`attempt`, `previousResult`, `previousError`) => `Promise`\<`Result`\> | A function that outputs a Promise result. Typically, the operation does not use its arguments. |
| `backoff` | `number`[] \| (`attempt`, `previousResult`, `previousError`) => `number` \| `undefined` | An array of retry backoff periods (in milliseconds) or a function for calculating them. If retry is desired, the specified backoff period is waited before the next call to the operation. If the array runs out of elements or the function returns `undefined` or a negative number, no further calls to the operation will be made. The `attempt` argument passed to the backoff function starts from 1, as it is called immediately after the first attempt and before the first retry. |
| `shouldRetry` | (`previousError`, `previousResult`, `attempt`) => `boolean` | A predicate function for deciding whether another call to the operation should occur. If this argument is not defined, a retry will occur whenever the operation rejects with an error. The `shouldRetry` function is evaluated before the `backoff`. The `attempt` argument passed to the shouldRetry function starts from 1. |

#### Returns

`Promise`\<`Result`\>

A promise of the operation result, potentially with retries applied.

#### Example

```ts
const result = await PromiseUtils.withRetry(() => doSomething(), [100, 200, 300, 500, 800, 1000]);
const result2 = await PromiseUtils.withRetry(() => doSomething(), Array.from({length: 10}, (_v, i) => 1000 * Math.min(FIBONACCI_SEQUENCE[i], 10), err => err.statusCode === 429);
const result3 = await PromiseUtils.withRetry(() => doSomething(), attempt => attempt <= 8 ? 1000 * Math.min(FIBONACCI_SEQUENCE[attempt - 1], 10) : undefined, err => err.statusCode === 429);
```

#### Param

A function that outputs a Promise result. Typically, the operation does not use its arguments.

#### Param

An array of retry backoff periods (in milliseconds) or a function for calculating them.

#### Param

A predicate function for deciding whether another call to the operation should occur.

#### Returns

A promise of the operation result, potentially with retries applied.
<!-- API end -->
