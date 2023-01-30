# @handy-common-utils/promise-utils

These Promise related utilities have 100% test coverage. The package is tiny because there is no dependency on any other package.
Functions provided are `repeat`, `withRetry`, `inParallel`, `delayedResolve`, `delayedReject`, `timoutResolve`, `timeoutReject`, `promiseState`, `synchronized`, etc.

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

// inParallel(...)
const topicArns = topics.map(topic => topic.TopicArn!);
await inParallel(5, topicArns, async topicArn => {
  const topicAttributes = (await sns.getTopicAttributes({ TopicArn: topicArn }).promise()).Attributes!;
  const topicDetails = { ...topicAttributes, subscriptions: [] } as any;
  if (this.shouldInclude(topicArn)) {
    inventory.snsTopicsByArn.set(topicArn, topicDetails);
  }
});

```

# API

<!-- API start -->
<a name="readmemd"></a>

@handy-common-utils/promise-utils

## @handy-common-utils/promise-utils

### Table of contents

#### Enumerations

- [PromiseState](#enumspromisestatemd)

#### Classes

- [PromiseUtils](#classespromiseutilsmd)

#### Variables

- [EXPONENTIAL\_SEQUENCE](#exponential_sequence)
- [FIBONACCI\_SEQUENCE](#fibonacci_sequence)

#### Functions

- [delayedReject](#delayedreject)
- [delayedResolve](#delayedresolve)
- [inParallel](#inparallel)
- [promiseState](#promisestate)
- [repeat](#repeat)
- [synchronised](#synchronised)
- [synchronized](#synchronized)
- [timeoutReject](#timeoutreject)
- [timeoutResolve](#timeoutresolve)
- [withRetry](#withretry)

### Variables

#### EXPONENTIAL\_SEQUENCE

• `Const` **EXPONENTIAL\_SEQUENCE**: `number`[]

Array of 25 exponential numbers starting from 1 up to 33554432.
It can be used to form your own backoff interval array.

**`example`**
```javascript

// 1ms, 2ms, 4ms, 8ms, 16ms, 32ms
PromiseUtils.withRetry(() => doSomething(), EXPONENTIAL_SEQUENCE.slice(0, 5), err => err.statusCode === 429);
// 1s, 2s, 4s, 8s, 10s, 10s, 10s, 10s, 10s, 10s
PromiseUtils.withRetry(() => doSomething(), Array.from({length: 10}, (_v, i) => 1000 * Math.min(EXPONENTIAL_SEQUENCE[i], 10)), err => err.statusCode === 429);
// with +-10% randomness: 1s, 2s, 4s, 8s
PromiseUtils.withRetry(() => doSomething(), FIBONACCI_SEQUENCE.slice(0, 4).map(n => 1000 * n * (1 + (Math.random() - 0.5) / 5)), err => err.statusCode === 429);

___

```
#### FIBONACCI\_SEQUENCE

• `Const` **FIBONACCI\_SEQUENCE**: `number`[]

Array of 25 Fibonacci numbers starting from 1 up to 317811.
It can be used to form your own backoff interval array.

**`example`**
```javascript

// 1ms, 2ms, 3ms, 5ms, 8ms, 13ms
PromiseUtils.withRetry(() => doSomething(), FIBONACCI_SEQUENCE.slice(0, 5), err => err.statusCode === 429);
// 1s, 2s, 3s, 4s, 8s, 10s, 10s, 10s, 10s, 10s
PromiseUtils.withRetry(() => doSomething(), Array.from({length: 10}, (_v, i) => 1000 * Math.min(FIBONACCI_SEQUENCE[i], 10)), err => err.statusCode === 429);
// with +-10% randomness: 1s, 2s, 3s, 5s, 8s, 13s
PromiseUtils.withRetry(() => doSomething(), FIBONACCI_SEQUENCE.slice(0, 5).map(n => 1000 * n * (1 + (Math.random() - 0.5) / 5)), err => err.statusCode === 429);

```## Classes


<a name="classespromiseutilsmd"></a>

[@handy-common-utils/promise-utils](#readmemd) / PromiseUtils

### Class: PromiseUtils

#### Table of contents

##### Constructors

- [constructor](#constructor)

##### Methods

- [delayedReject](#delayedreject)
- [delayedResolve](#delayedresolve)
- [inParallel](#inparallel)
- [promiseState](#promisestate)
- [repeat](#repeat)
- [synchronised](#synchronised)
- [synchronized](#synchronized)
- [timeoutReject](#timeoutreject)
- [timeoutResolve](#timeoutresolve)
- [withRetry](#withretry)

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
| `result?` | `T` \| `PromiseLike`<`T`\> \| () => `T` \| `PromiseLike`<`T`\> | the result to be resolved for the Promise, or a function that supplies the reuslt. |

###### Returns

`Promise`<`T`\>

the new Promise created

___

##### inParallel

▸ `Static` **inParallel**<`Data`, `Result`, `TError`\>(`parallelism`, `jobs`, `operation`): `Promise`<(`Result` \| `TError`)[]\>

Run multiple jobs/operations in parallel.

**`example`**
```javascript

const topicArns = topics.map(topic => topic.TopicArn!);
await PromiseUtils.inParallel(5, topicArns, async topicArn => {
  const topicAttributes = (await sns.getTopicAttributes({ TopicArn: topicArn }).promise()).Attributes!;
  const topicDetails = { ...topicAttributes, subscriptions: [] } as any;
  if (this.shouldInclude(topicArn)) {
    inventory.snsTopicsByArn.set(topicArn, topicDetails);
  }
});

```
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
| `jobs` | `Iterable`<`Data`\> | job data which will be the input to operation function.                    This function is safe when there are infinite unknown number of elements in the job data. |
| `operation` | (`job`: `Data`, `index`: `number`) => `Promise`<`Result`\> | the function that turns job data into result asynchronously |

###### Returns

`Promise`<(`Result` \| `TError`)[]\>

Promise of void if the operation function does not return a value,
         or promise of an array containing results returned from the operation function.
         In the array containing results, each element is either the fulfilled result, or the rejected error/reason.

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

A Promise that resolves immediately cotaining the state of the input Promise

___

##### repeat

▸ `Static` **repeat**<`Result`, `Param`, `Collection`\>(`operation`, `nextParameter`, `collect`, `initialCollection`, `initialParameter?`): `Promise`<`Collection`\>

Do an operation repeatedly and collect all the results.
This function is useful for client side pagination.

**`example`**
```javascript

const domainNameObjects = await PromiseUtils.repeat(
  pagingParam => apig.getDomainNames({limit: 500, ...pagingParam}).promise(),
  esponse => response.position? {position: response.position} : null,
  (collection, response) => collection.concat(response.items!),
  [] as APIGateway.DomainName[],
);

```
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
| `nextParameter` | (`response`: `Result`) => ``null`` \| `Partial`<`Param`\> \| `Promise`<`Partial`<`Param`\>\> | The function for calculating next parameter from the operation result.                      Normally the parameter controls paging,                      This function should return null when next invocation of the operation function is not desired.                      If next invocation is desired, the return value of this function can be a Promise or not a Promise. |
| `collect` | (`collection`: `Collection`, `result`: `Result`) => `Collection` | the function for merging operation result into the collection |
| `initialCollection` | `Collection` | initial collection which would be the first argument passed into the first invocation of the collect function |
| `initialParameter` | `Partial`<`Param`\> | the parameter for the first operation |

###### Returns

`Promise`<`Collection`\>

Promise of collection of all the results returned by the operation function

___

##### synchronised

▸ `Static` **synchronised**<`T`\>(`lock`, `operation`): `Promise`<`T`\>

This is just another spelling of [PromiseUtils.synchronized](#synchronized).

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

Apply timeout to a Promise. In case timeout happens, reject with the reason specified.
If timeout does not happen, the resolved result or rejection reason of the original Promise would be the outcome of the Promise returned from this function.
If timeout does not happen and the 'rejectReason' parameter is a function, the function won't be called.
The 'operation' parameter's rejection would not be handled by this function, you may want to handle it outside of this function,
just for avoiding warnings like "(node:4330) PromiseRejectionHandledWarning: Promise rejection was handled asynchronously".

###### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | `never` |
| `R` | `any` |

###### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `operation` | `Promise`<`T`\> | the original Promise for which timeout would be applied |
| `ms` | `number` | number of milliseconds for the timeout |
| `rejectReason` | `R` \| `PromiseLike`<`R`\> \| () => `R` \| `PromiseLike`<`R`\> | the reason of the rejection in case timeout happens, or a function that supplies the reason. |

###### Returns

`Promise`<`T`\>

the new Promise that rejects with the specified reason in case timeout happens

___

##### timeoutResolve

▸ `Static` **timeoutResolve**<`T`\>(`operation`, `ms`, `result?`): `Promise`<`T`\>

Apply timeout to a Promise. In case timeout happens, resolve to the result specified.
If timeout does not happen, the resolved result or rejection reason of the original Promise would be the outcome of the Promise returned from this function.
If timeout does not happen and the 'result' parameter is a function, the function won't be called.
The 'operation' parameter's rejection would not be handled by this function, you may want to handle it outside of this function,
just for avoiding warnings like "(node:4330) PromiseRejectionHandledWarning: Promise rejection was handled asynchronously".

###### Type parameters

| Name |
| :------ |
| `T` |

###### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `operation` | `Promise`<`T`\> | the original Promise for which timeout would be applied |
| `ms` | `number` | number of milliseconds for the timeout |
| `result?` | `T` \| `PromiseLike`<`T`\> \| () => `T` \| `PromiseLike`<`T`\> | the result to be resolved in case timeout happens, or a function that supplies the reuslt. |

###### Returns

`Promise`<`T`\>

the new Promise that resolves to the specified result in case timeout happens

___

##### withRetry

▸ `Static` **withRetry**<`Result`, `TError`\>(`operation`, `backoff`, `shouldRetry?`): `Promise`<`Result`\>

Do an operation repeatedly until a criteria is met.

**`example`**
```javascript

const result = await PromiseUtils.withRetry(() => doSomething(), [100, 200, 300, 500, 800, 1000]);
const result2 = await PromiseUtils.withRetry(() => doSomething(), Array.from({length: 10}, (_v, i) => 1000 * Math.min(FIBONACCI_SEQUENCE[i], 10), err => err.statusCode === 429);
const result3 = await PromiseUtils.withRetry(() => doSomething(), attempt => attempt <= 8 ? 1000 * Math.min(FIBONACCI_SEQUENCE[attempt - 1], 10) : undefined, err => err.statusCode === 429);

```
###### Type parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `Result` | `Result` | type of the operation result |
| `TError` | `any` | type of the possible error that could be generated by the operation |

###### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `operation` | (`attempt`: `number`, `previousResult`: `undefined` \| `Result`, `previousError`: `undefined` \| `TError`) => `Promise`<`Result`\> | a function that outputs a Promise result, normally the operation does not use its arguments |
| `backoff` | `number`[] \| (`attempt`: `number`, `previousResult`: `undefined` \| `Result`, `previousError`: `undefined` \| `TError`) => `undefined` \| `number` | Array of retry backoff periods (unit: milliseconds) or function for calculating them.                If retry is desired, before making next call to the operation the desired backoff period would be waited.                If the array runs out of elements or the function returns `undefined` or either the array or the function returns a negative number,                there would be no further call to the operation.                The `attempt` argument passed into backoff function starts from 1 because the function is called right after the first attempt and before the first retry. |
| `shouldRetry` | (`previousError`: `undefined` \| `TError`, `previousResult`: `undefined` \| `Result`, `attempt`: `number`) => `boolean` | Predicate function for deciding whether another call to the operation should happen.                    If this argument is not defined, retry would happen whenever the operation rejects with an error.                    `shouldRetry` would be evaluated before `backoff`.                    The `attempt` argument passed into shouldRetry function starts from 1. |

###### Returns

`Promise`<`Result`\>

Promise of the operation result potentially with retries already applied

## Enums


<a name="enumspromisestatemd"></a>

[@handy-common-utils/promise-utils](#readmemd) / PromiseState

### Enumeration: PromiseState

The state of a Promise can only be one of: Pending, Fulfilled, and Rejected.

#### Table of contents

##### Enumeration members

- [Fulfilled](#fulfilled)
- [Pending](#pending)
- [Rejected](#rejected)

#### Enumeration members

##### Fulfilled

• **Fulfilled** = `"Fulfilled"`

___

##### Pending

• **Pending** = `"Pending"`

___

##### Rejected

• **Rejected** = `"Rejected"`
<!-- API end -->
