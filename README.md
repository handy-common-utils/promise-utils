# @handy-common-utils/promise-utils

These Promise-related utilities boast 100% test coverage, ensuring robust reliability.
The package, free of external dependencies, offers essential functions such as:

- `repeat`: Executes an operation repeatedly, very useful to collect all results through pagination.
- `withRetry`: Retries an operation until a specified condition is met.
- `withConcurrency`: Executes multiple operations with specified level of concurrency, and abort remaining operations when an error happens.
- `inParallel`: Executes multiple operations with specified level of concurrency, all operations are guaranteed to be executed regardless of any possible error.
- `delayedResolve`: Creates a Promise that resolves after a specified delay.
- `delayedReject`: Creates a Promise that rejects after a specified delay.
- `timeoutResolve`: Applies a timeout to a Promise and resolves with a specified result if the timeout occurs.
- `timeoutReject`: Applies a timeout to a Promise and rejects with a specified error/reason if the timeout occurs.
- `promiseState`: Retrieves the state of a Promise.
- `synchronized`: Provides mutual exclusion for concurrent operations using a lock mechanism, similar to `synchronized` in Java.

[![Version](https://img.shields.io/npm/v/@handy-common-utils/promise-utils.svg)](https://npmjs.org/package/@handy-common-utils/promise-utils)
[![Downloads/week](https://img.shields.io/npm/dw/@handy-common-utils/promise-utils.svg)](https://npmjs.org/package/@handy-common-utils/promise-utils)
[![CI](https://github.com/handy-common-utils/promise-utils/actions/workflows/ci.yml/badge.svg)](https://github.com/handy-common-utils/promise-utils/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/handy-common-utils/promise-utils/branch/master/graph/badge.svg?token=QBL6AB3CL5)](https://codecov.io/gh/handy-common-utils/promise-utils)

## How to use

First add it as a dependency:

```sh
npm install @handy-common-utils/promise-utils
```

Then you can use it in the code:

```javascript
import { PromiseUtils } from '@handy-common-utils/promise-utils';

// delayedResolve(...), delayedReject(...), promiseState(...)
const p1 = PromiseUtils.delayedResolve(50, 1);
const p2 = PromiseUtils.delayedReject(50, 2);
await expect(PromiseUtils.promiseState(p1)).eventually.eq(PromiseState.Pending);
await expect(PromiseUtils.promiseState(p2)).eventually.eq(PromiseState.Pending);
await PromiseUtils.delayedResolve(80);
await expect(PromiseUtils.promiseState(p1)).eventually.eq(PromiseState.Fulfilled);
await expect(PromiseUtils.promiseState(p2)).eventually.eq(PromiseState.Rejected);

// timeoutReject(...)
const p = PromiseUtils.timeoutReject(PromiseUtils.delayedReject(80, '1'), 10, '2');
await expect(p).to.be.rejectedWith('2');

// repeat(...)
async repeatFetchingItemsByPosition<T>(
  fetchItemsByPosition: (parameter: { position?: string }) => Promise<{ position?: string; items?: Array<T> }>,
) {
  return PromiseUtils.repeat(
    fetchItemsByPosition,
    response => response.position ? { position: response.position } : null,
    (collection, response) => response.items ? collection.concat(response.items) : collection,
    [] as Array<T>,
  );
}
```

You can either import and use the [PromiseUtils class](#classespromiseutilsmd) as shown above,
or you can import its re-exported functions directly like below:

```javascript
import { withRetry, inParallel, FIBONACCI_SEQUENCE, EXPONENTIAL_SEQUENCE } from '@handy-common-utils/promise-utils';

// withRetry(...)
const result = await withRetry(() => doSomething(), [100, 200, 300, 500, 800, 1000]);
const result2 = await withRetry(() => doSomething(), Array.from({length: 10}, (_v, i) => 1000 * Math.min(FIBONACCI_SEQUENCE[i], 10)), err => err.statusCode === 429);
const result3 = await withRetry(() => doSomething(), attempt => attempt <= 8 ? 1000 * Math.min(EXPONENTIAL_SEQUENCE[attempt - 1], 10) : undefined, err => err.statusCode === 429);
statusCode === 429);

// Capture errors in the returned array
const attributesAndPossibleErrors = await PromiseUtils.inParallel(5, topicArns, async (topicArn) => {
  const topicAttributes = (await sns.getTopicAttributes({ TopicArn: topicArn }).promise()).Attributes!;
  return topicAttributes;
});

// Abort on the first error
let results: Array<JobResult>;
try {
  results = await PromiseUtils.withConcurrency(100, jobs, async (job) => processor.process(job));
} catch (error) {
  // handle the error
}

```

# API

<!-- API start -->
<a name="readmemd"></a>

## @handy-common-utils/promise-utils

### Enumerations

- [PromiseState](#enumspromisestatemd)

### Classes

- [PromiseUtils](#classespromiseutilsmd)

### Variables

#### EXPONENTIAL\_SEQUENCE

• `Const` **EXPONENTIAL\_SEQUENCE**: `number`[]

Array of 25 exponential numbers starting from 1 up to 33554432.
It can be used to form your own backoff interval array.

**`Example`**

```ts
// 1ms, 2ms, 4ms, 8ms, 16ms, 32ms
PromiseUtils.withRetry(() => doSomething(), EXPONENTIAL_SEQUENCE.slice(0, 5), err => err.statusCode === 429);
// 1s, 2s, 4s, 8s, 10s, 10s, 10s, 10s, 10s, 10s
PromiseUtils.withRetry(() => doSomething(), Array.from({length: 10}, (_v, i) => 1000 * Math.min(EXPONENTIAL_SEQUENCE[i], 10)), err => err.statusCode === 429);
// with +-10% randomness: 1s, 2s, 4s, 8s
PromiseUtils.withRetry(() => doSomething(), FIBONACCI_SEQUENCE.slice(0, 4).map(n => 1000 * n * (1 + (Math.random() - 0.5) / 5)), err => err.statusCode === 429);
```

___

#### FIBONACCI\_SEQUENCE

• `Const` **FIBONACCI\_SEQUENCE**: `number`[]

Array of 25 Fibonacci numbers starting from 1 up to 317811.
It can be used to form your own backoff interval array.

**`Example`**

```ts
// 1ms, 2ms, 3ms, 5ms, 8ms, 13ms
PromiseUtils.withRetry(() => doSomething(), FIBONACCI_SEQUENCE.slice(0, 5), err => err.statusCode === 429);
// 1s, 2s, 3s, 4s, 8s, 10s, 10s, 10s, 10s, 10s
PromiseUtils.withRetry(() => doSomething(), Array.from({length: 10}, (_v, i) => 1000 * Math.min(FIBONACCI_SEQUENCE[i], 10)), err => err.statusCode === 429);
// with +-10% randomness: 1s, 2s, 3s, 5s, 8s, 13s
PromiseUtils.withRetry(() => doSomething(), FIBONACCI_SEQUENCE.slice(0, 5).map(n => 1000 * n * (1 + (Math.random() - 0.5) / 5)), err => err.statusCode === 429);
```

### Functions

#### delayedReject

▸ **delayedReject**<`T`, `R`\>(`ms`, `reason`): `Promise`<`T`\>

See [delayedReject](#delayedreject) for full documentation.

##### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | `never` |
| `R` | `any` |

##### Parameters

| Name | Type |
| :------ | :------ |
| `ms` | `number` |
| `reason` | `R` \| `PromiseLike`<`R`\> \| () => `R` \| `PromiseLike`<`R`\> |

##### Returns

`Promise`<`T`\>

___

#### delayedResolve

▸ **delayedResolve**<`T`\>(`ms`, `result?`): `Promise`<`T`\>

See [delayedResolve](#delayedresolve) for full documentation.

##### Type parameters

| Name |
| :------ |
| `T` |

##### Parameters

| Name | Type |
| :------ | :------ |
| `ms` | `number` |
| `result?` | `T` \| `PromiseLike`<`T`\> \| () => `T` \| `PromiseLike`<`T`\> |

##### Returns

`Promise`<`T`\>

___

#### inParallel

▸ **inParallel**<`Data`, `Result`, `TError`\>(`parallelism`, `jobs`, `operation`, `options?`): `Promise`<(`Result` \| `TError`)[]\>

See [inParallel](#inparallel) for full documentation.

##### Type parameters

| Name | Type |
| :------ | :------ |
| `Data` | `Data` |
| `Result` | `Result` |
| `TError` | `Result` |

##### Parameters

| Name | Type |
| :------ | :------ |
| `parallelism` | `number` |
| `jobs` | `Iterable`<`Data`\> |
| `operation` | (`job`: `Data`, `index`: `number`) => `Promise`<`Result`\> |
| `options?` | `Object` |
| `options.abortOnError` | `boolean` |

##### Returns

`Promise`<(`Result` \| `TError`)[]\>

___

#### promiseState

▸ **promiseState**(`p`): `Promise`<[`PromiseState`](#enumspromisestatemd)\>

See [promiseState](#promisestate) for full documentation.

##### Parameters

| Name | Type |
| :------ | :------ |
| `p` | `Promise`<`any`\> |

##### Returns

`Promise`<[`PromiseState`](#enumspromisestatemd)\>

___

#### repeat

▸ **repeat**<`Result`, `Param`, `Collection`\>(`operation`, `nextParameter`, `collect`, `initialCollection`, `initialParameter?`): `Promise`<`Collection`\>

See [repeat](#repeat) for full documentation.

##### Type parameters

| Name |
| :------ |
| `Result` |
| `Param` |
| `Collection` |

##### Parameters

| Name | Type |
| :------ | :------ |
| `operation` | (`parameter`: `Partial`<`Param`\>) => `Promise`<`Result`\> |
| `nextParameter` | (`response`: `Result`) => ``null`` \| `Partial`<`Param`\> \| `Promise`<`Partial`<`Param`\>\> |
| `collect` | (`collection`: `Collection`, `result`: `Result`) => `Collection` |
| `initialCollection` | `Collection` |
| `initialParameter` | `Partial`<`Param`\> |

##### Returns

`Promise`<`Collection`\>

___

#### synchronised

▸ **synchronised**<`T`\>(`lock`, `operation`): `Promise`<`T`\>

See [synchronised](#synchronised) for full documentation.

##### Type parameters

| Name |
| :------ |
| `T` |

##### Parameters

| Name | Type |
| :------ | :------ |
| `lock` | `unknown` |
| `operation` | (`previousState`: `undefined` \| [`PromiseState`](#enumspromisestatemd), `previousSettledState`: `undefined` \| [`PromiseState`](#enumspromisestatemd), `previousResult`: `any`) => `Promise`<`T`\> |

##### Returns

`Promise`<`T`\>

___

#### synchronized

▸ **synchronized**<`T`\>(`lock`, `operation`): `Promise`<`T`\>

See [synchronized](#synchronized) for full documentation.

##### Type parameters

| Name |
| :------ |
| `T` |

##### Parameters

| Name | Type |
| :------ | :------ |
| `lock` | `unknown` |
| `operation` | (`previousState`: `undefined` \| [`PromiseState`](#enumspromisestatemd), `previousSettledState`: `undefined` \| [`PromiseState`](#enumspromisestatemd), `previousResult`: `any`) => `Promise`<`T`\> |

##### Returns

`Promise`<`T`\>

___

#### timeoutReject

▸ **timeoutReject**<`T`, `R`\>(`operation`, `ms`, `rejectReason`): `Promise`<`T`\>

See [timeoutReject](#timeoutreject) for full documentation.

##### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | `never` |
| `R` | `any` |

##### Parameters

| Name | Type |
| :------ | :------ |
| `operation` | `Promise`<`T`\> \| () => `Promise`<`T`\> |
| `ms` | `number` |
| `rejectReason` | `R` \| `PromiseLike`<`R`\> \| () => `R` \| `PromiseLike`<`R`\> |

##### Returns

`Promise`<`T`\>

___

#### timeoutResolve

▸ **timeoutResolve**<`T`\>(`operation`, `ms`, `result?`): `Promise`<`T`\>

See [timeoutResolve](#timeoutresolve) for full documentation.

##### Type parameters

| Name |
| :------ |
| `T` |

##### Parameters

| Name | Type |
| :------ | :------ |
| `operation` | `Promise`<`T`\> \| () => `Promise`<`T`\> |
| `ms` | `number` |
| `result?` | `T` \| `PromiseLike`<`T`\> \| () => `T` \| `PromiseLike`<`T`\> |

##### Returns

`Promise`<`T`\>

___

#### withRetry

▸ **withRetry**<`Result`, `TError`\>(`operation`, `backoff`, `shouldRetry?`): `Promise`<`Result`\>

See [withRetry](#withretry) for full documentation.

##### Type parameters

| Name | Type |
| :------ | :------ |
| `Result` | `Result` |
| `TError` | `any` |

##### Parameters

| Name | Type |
| :------ | :------ |
| `operation` | (`attempt`: `number`, `previousResult`: `undefined` \| `Result`, `previousError`: `undefined` \| `TError`) => `Promise`<`Result`\> |
| `backoff` | `number`[] \| (`attempt`: `number`, `previousResult`: `undefined` \| `Result`, `previousError`: `undefined` \| `TError`) => `undefined` \| `number` |
| `shouldRetry` | (`previousError`: `undefined` \| `TError`, `previousResult`: `undefined` \| `Result`, `attempt`: `number`) => `boolean` |

##### Returns

`Promise`<`Result`\>

## Classes


<a name="classespromiseutilsmd"></a>

### Class: PromiseUtils

#### Constructors

##### constructor

• **new PromiseUtils**()

#### Methods

##### delayedReject

▸ `Static` **delayedReject**<`T`, `R`\>(`ms`, `reason`): `Promise`<`T`\>

Create a Promise that rejects after number of milliseconds specified.

###### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | `never` |
| `R` | `any` |

###### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `ms` | `number` | number of milliseconds after which the created Promise would reject |
| `reason` | `R` \| `PromiseLike`<`R`\> \| () => `R` \| `PromiseLike`<`R`\> | the reason of the rejection for the Promise, or a function that supplies the reason. If the reason ends up to be a rejected Promise, then the outcome (could be fulfilled or rejected) of it will be the reject reason of the Promise returned. |

###### Returns

`Promise`<`T`\>

the new Promise created

___

##### delayedResolve

▸ `Static` **delayedResolve**<`T`\>(`ms`, `result?`): `Promise`<`T`\>

Create a Promise that resolves after number of milliseconds specified

###### Type parameters

| Name |
| :------ |
| `T` |

###### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `ms` | `number` | number of milliseconds after which the created Promise would resolve |
| `result?` | `T` \| `PromiseLike`<`T`\> \| () => `T` \| `PromiseLike`<`T`\> | the result to be resolved for the Promise, or a function that supplies the result. |

###### Returns

`Promise`<`T`\>

the new Promise created

___

##### inParallel

▸ `Static` **inParallel**<`Data`, `Result`, `TError`\>(`parallelism`, `jobs`, `operation`, `options?`): `Promise`<(`Result` \| `TError`)[]\>

Run multiple jobs/operations in parallel.

By default this function does not throw / reject with error when any of the job/operation fails.
Operation errors are returned together with operation results in the same returned array.
That also means this function only returns when all the jobs/operations settle (either resolve or reject).

However, if options.abortOnError is true, this function throws / rejects with error when any of the job/operation fails.
That also means, some of the jobs/operations may not get the chance to be executed if one of them fails.

###### Type parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `Data` | `Data` | Type of the job data, usually it would be an Array |
| `Result` | `Result` | Type of the return value of the operation function |
| `TError` | `Result` | - |

###### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `parallelism` | `number` | how many jobs/operations can be running at the same time |
| `jobs` | `Iterable`<`Data`\> | job data which will be the input to operation function. This function is safe when there are infinite unknown number of elements in the job data. |
| `operation` | (`job`: `Data`, `index`: `number`) => `Promise`<`Result`\> | the function that turns job data into result asynchronously |
| `options?` | `Object` | Options for controlling the behavior of this function. |
| `options.abortOnError` | `boolean` | - |

###### Returns

`Promise`<(`Result` \| `TError`)[]\>

Promise of void if the operation function does not return a value,
         or promise of an array containing outcomes from the operation function.
         In the returned array containing outcomes, each element is either the fulfilled result, or the rejected error/reason.

**`Example`**

```ts
// Capture errors in the returned array
const attributesAndPossibleErrors = await PromiseUtils.inParallel(5, topicArns, async (topicArn) => {
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

___

##### promiseState

▸ `Static` **promiseState**(`p`): `Promise`<[`PromiseState`](#enumspromisestatemd)\>

Get the state of the Promise.
Please note that the returned value is a Promise, although it resolves immediately.

###### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `p` | `Promise`<`any`\> | the Promise for which we would like to know its state |

###### Returns

`Promise`<[`PromiseState`](#enumspromisestatemd)\>

A Promise that resolves immediately containing the state of the input Promise

___

##### repeat

▸ `Static` **repeat**<`Result`, `Param`, `Collection`\>(`operation`, `nextParameter`, `collect`, `initialCollection`, `initialParameter?`): `Promise`<`Collection`\>

Do an operation repeatedly and collect all the results.
This function is useful for client side pagination.

###### Type parameters

| Name | Description |
| :------ | :------ |
| `Result` | type of the operation result |
| `Param` | type of the input to the operation, normally the input is a paging parameter |
| `Collection` | type of the returned value of this function |

###### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `operation` | (`parameter`: `Partial`<`Param`\>) => `Promise`<`Result`\> | a function that takes paging parameter as input and outputs a result, normally the operation supports paging |
| `nextParameter` | (`response`: `Result`) => ``null`` \| `Partial`<`Param`\> \| `Promise`<`Partial`<`Param`\>\> | The function for calculating next parameter from the operation result. Normally the parameter controls paging, This function should return null when next invocation of the operation function is not desired. If next invocation is desired, the return value of this function can be a Promise or not a Promise. |
| `collect` | (`collection`: `Collection`, `result`: `Result`) => `Collection` | the function for merging operation result into the collection |
| `initialCollection` | `Collection` | initial collection which would be the first argument passed into the first invocation of the collect function |
| `initialParameter` | `Partial`<`Param`\> | the parameter for the first operation |

###### Returns

`Promise`<`Collection`\>

Promise of collection of all the results returned by the operation function

**`Example`**

```ts
const domainNameObjects = await PromiseUtils.repeat(
  pagingParam => apig.getDomainNames({limit: 500, ...pagingParam}).promise(),
  response => response.position? {position: response.position} : null,
  (collection, response) => collection.concat(response.items!),
  [] as APIGateway.DomainName[],
);
```

___

##### synchronised

▸ `Static` **synchronised**<`T`\>(`lock`, `operation`): `Promise`<`T`\>

This is just another spelling of [synchronized](#synchronized).

###### Type parameters

| Name |
| :------ |
| `T` |

###### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `lock` | `unknown` | the object (could be a string, a number, or `this` in a class) that is used to apply the lock |
| `operation` | (`previousState`: `undefined` \| [`PromiseState`](#enumspromisestatemd), `previousSettledState`: `undefined` \| [`PromiseState`](#enumspromisestatemd), `previousResult`: `any`) => `Promise`<`T`\> | function for doing the computation and returning a Promise |

###### Returns

`Promise`<`T`\>

the result of the operation function

___

##### synchronized

▸ `Static` **synchronized**<`T`\>(`lock`, `operation`): `Promise`<`T`\>

Equivalent of `synchronized` in Java.
In any situation there's no concurrent execution of any operation function associated with the same lock.
The operation function has access to the state (when `synchronized` is called), settledState (when the operation function is called),
and result (could be the fulfilled result or the rejected reason) of the previous operation.
In case there is no previous invocation, state, settledState and result would all be undefined.

###### Type parameters

| Name |
| :------ |
| `T` |

###### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `lock` | `unknown` | the object (could be a string, a number, or `this` in a class) that is used to apply the lock |
| `operation` | (`previousState`: `undefined` \| [`PromiseState`](#enumspromisestatemd), `previousSettledState`: `undefined` \| [`PromiseState`](#enumspromisestatemd), `previousResult`: `any`) => `Promise`<`T`\> | function for doing the computation and returning a Promise |

###### Returns

`Promise`<`T`\>

the result of the operation function

___

##### timeoutReject

▸ `Static` **timeoutReject**<`T`, `R`\>(`operation`, `ms`, `rejectReason`): `Promise`<`T`\>

Applies a timeout to a Promise or a function that returns a Promise.
If the timeout occurs, rejects with the specified reason.
If the timeout doesn't occur, the resolved result or rejection reason of the original Promise will be the outcome of the Promise returned from this function.
If the 'reason' parameter is a function and timeout doesn't occur, the function won't be called.
The rejection of the 'operation' parameter is not handled by this function, you may want to handle it outside of this function to avoid warnings like "(node:4330) PromiseRejectionHandledWarning: Promise rejection was handled asynchronously".

###### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | `never` |
| `R` | `any` |

###### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `operation` | `Promise`<`T`\> \| () => `Promise`<`T`\> | The original Promise or a function that returns a Promise for which the timeout will be applied. |
| `ms` | `number` | The number of milliseconds for the timeout. |
| `rejectReason` | `R` \| `PromiseLike`<`R`\> \| () => `R` \| `PromiseLike`<`R`\> | The reason to reject with if the timeout occurs, or a function that supplies the reason. |

###### Returns

`Promise`<`T`\>

A new Promise that rejects with the specified reason if the timeout occurs.

___

##### timeoutResolve

▸ `Static` **timeoutResolve**<`T`\>(`operation`, `ms`, `result?`): `Promise`<`T`\>

Applies a timeout to a Promise or a function that returns a Promise.
If the timeout occurs, resolves to the specified result.
If the timeout doesn't occur, the resolved result or rejection reason of the original Promise will be the outcome of the Promise returned from this function.
If the 'result' parameter is a function and timeout doesn't occur, the function won't be called.
The rejection of the 'operation' parameter is not handled by this function, you may want to handle it outside of this function to avoid warnings like "(node:4330) PromiseRejectionHandledWarning: Promise rejection was handled asynchronously".

###### Type parameters

| Name |
| :------ |
| `T` |

###### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `operation` | `Promise`<`T`\> \| () => `Promise`<`T`\> | The original Promise or a function that returns a Promise for which the timeout will be applied. |
| `ms` | `number` | The number of milliseconds for the timeout. |
| `result?` | `T` \| `PromiseLike`<`T`\> \| () => `T` \| `PromiseLike`<`T`\> | The result to be resolved with if the timeout occurs, or a function that supplies the result. |

###### Returns

`Promise`<`T`\>

A new Promise that resolves to the specified result if the timeout occurs.

___

##### withRetry

▸ `Static` **withRetry**<`Result`, `TError`\>(`operation`, `backoff`, `shouldRetry?`): `Promise`<`Result`\>

Do an operation repeatedly until a criteria is met.

###### Type parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `Result` | `Result` | type of the operation result |
| `TError` | `any` | type of the possible error that could be generated by the operation |

###### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `operation` | (`attempt`: `number`, `previousResult`: `undefined` \| `Result`, `previousError`: `undefined` \| `TError`) => `Promise`<`Result`\> | a function that outputs a Promise result, normally the operation does not use its arguments |
| `backoff` | `number`[] \| (`attempt`: `number`, `previousResult`: `undefined` \| `Result`, `previousError`: `undefined` \| `TError`) => `undefined` \| `number` | Array of retry backoff periods (unit: milliseconds) or function for calculating them. If retry is desired, before making next call to the operation the desired backoff period would be waited. If the array runs out of elements or the function returns `undefined` or either the array or the function returns a negative number, there would be no further call to the operation. The `attempt` argument passed into backoff function starts from 1 because the function is called right after the first attempt and before the first retry. |
| `shouldRetry` | (`previousError`: `undefined` \| `TError`, `previousResult`: `undefined` \| `Result`, `attempt`: `number`) => `boolean` | Predicate function for deciding whether another call to the operation should happen. If this argument is not defined, retry would happen whenever the operation rejects with an error. `shouldRetry` would be evaluated before `backoff`. The `attempt` argument passed into shouldRetry function starts from 1. |

###### Returns

`Promise`<`Result`\>

Promise of the operation result potentially with retries already applied

**`Example`**

```ts
const result = await PromiseUtils.withRetry(() => doSomething(), [100, 200, 300, 500, 800, 1000]);
const result2 = await PromiseUtils.withRetry(() => doSomething(), Array.from({length: 10}, (_v, i) => 1000 * Math.min(FIBONACCI_SEQUENCE[i], 10), err => err.statusCode === 429);
const result3 = await PromiseUtils.withRetry(() => doSomething(), attempt => attempt <= 8 ? 1000 * Math.min(FIBONACCI_SEQUENCE[attempt - 1], 10) : undefined, err => err.statusCode === 429);
```

## Enums


<a name="enumspromisestatemd"></a>

### Enumeration: PromiseState

The state of a Promise can only be one of: Pending, Fulfilled, and Rejected.

#### Enumeration Members

##### Fulfilled

• **Fulfilled** = ``"Fulfilled"``

___

##### Pending

• **Pending** = ``"Pending"``

___

##### Rejected

• **Rejected** = ``"Rejected"``
<!-- API end -->
