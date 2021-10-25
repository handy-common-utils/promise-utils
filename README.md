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

You can either import and use the [class](#classes) as shown above,
or you can import individual [functions](#variables) directly like below:

```javascript
import { repeat } from '@handy-common-utils/promise-utils';
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

#### FIBONACCI\_SEQUENCE

• `Const` **FIBONACCI\_SEQUENCE**: `number`[]

### Functions

#### delayedReject

▸ `Const` **delayedReject**<`T`, `R`\>(`ms`, `reason`): `Promise`<`T`\>

##### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | `never` |
| `R` | `any` |

##### Parameters

| Name | Type |
| :------ | :------ |
| `ms` | `number` |
| `reason` | `R` \| () => `R` |

##### Returns

`Promise`<`T`\>

___

#### delayedResolve

▸ `Const` **delayedResolve**<`T`\>(`ms`, `result?`): `Promise`<`T`\>

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

▸ `Const` **inParallel**<`Data`, `Result`, `TError`\>(`parallelism`, `jobs`, `operation`): `Promise`<(`Result` \| `TError`)[]\>

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

##### Returns

`Promise`<(`Result` \| `TError`)[]\>

___

#### promiseState

▸ `Const` **promiseState**(`p`): `Promise`<[`PromiseState`](#enumspromisestatemd)\>

##### Parameters

| Name | Type |
| :------ | :------ |
| `p` | `Promise`<`any`\> |

##### Returns

`Promise`<[`PromiseState`](#enumspromisestatemd)\>

___

#### repeat

▸ `Const` **repeat**<`Result`, `Param`, `Collection`\>(`operation`, `nextParameter`, `collect`, `initialCollection`, `initialParameter?`): `Promise`<`Collection`\>

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

▸ `Const` **synchronised**<`T`\>(`lock`, `operation`): `Promise`<`T`\>

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

▸ `Const` **synchronized**<`T`\>(`lock`, `operation`): `Promise`<`T`\>

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

▸ `Const` **timeoutReject**<`T`, `R`\>(`operation`, `ms`, `rejectReason`): `Promise`<`T`\>

##### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | `never` |
| `R` | `any` |

##### Parameters

| Name | Type |
| :------ | :------ |
| `operation` | `Promise`<`T`\> |
| `ms` | `number` |
| `rejectReason` | `R` \| () => `R` |

##### Returns

`Promise`<`T`\>

___

#### timeoutResolve

▸ `Const` **timeoutResolve**<`T`\>(`operation`, `ms`, `result?`): `Promise`<`T`\>

##### Type parameters

| Name |
| :------ |
| `T` |

##### Parameters

| Name | Type |
| :------ | :------ |
| `operation` | `Promise`<`T`\> |
| `ms` | `number` |
| `result?` | `T` \| `PromiseLike`<`T`\> \| () => `T` \| `PromiseLike`<`T`\> |

##### Returns

`Promise`<`T`\>

___

#### withRetry

▸ `Const` **withRetry**<`Result`, `TError`\>(`operation`, `backoff`, `shouldRetry?`): `Promise`<`Result`\>

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

Create a Promise that rejects after number of milliseconds specified

###### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | `never` |
| `R` | `any` |

###### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `ms` | `number` | number of milliseconds after which the created Promise would reject |
| `reason` | `R` \| () => `R` | the reason of the rejection for the Promise, or a function that supplies the reason. |

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

Apply timeout to an operation, in case timeout happens, reject with the reason specified.
If timeout does not happen, the resolved result or rejection reason of the original operation would be returned.

###### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | `never` |
| `R` | `any` |

###### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `operation` | `Promise`<`T`\> | the original operation that timeout would be applied |
| `ms` | `number` | number of milliseconds for the timeout |
| `rejectReason` | `R` \| () => `R` | the reason of the rejection in case timeout happens, or a function that supplies the reason. |

###### Returns

`Promise`<`T`\>

the new Promise that rejects with the specified reason in case timeout happens

___

##### timeoutResolve

▸ `Static` **timeoutResolve**<`T`\>(`operation`, `ms`, `result?`): `Promise`<`T`\>

Apply timeout to an operation, in case timeout happens, resolve to the result specified.
If timeout does not happen, the resolved result or rejection reason of the original operation would be returned.

###### Type parameters

| Name |
| :------ |
| `T` |

###### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `operation` | `Promise`<`T`\> | the original operation that timeout would be applied |
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
| `backoff` | `number`[] \| (`attempt`: `number`, `previousResult`: `undefined` \| `Result`, `previousError`: `undefined` \| `TError`) => `undefined` \| `number` | Array of retry backoff periods (unit: milliseconds) or function for calculating them.                If retry is desired, before making next call to the operation the desired backoff period would be waited.                If the array runs out of elements or the function returns `undefined` or either the array or the function returns a negative number,                there would be no further call to the operation.                The `attempt` argument passed into backoff function starts from 2 because only retries need to backoff,                so the first retry is the second attempt. |
| `shouldRetry` | (`previousError`: `undefined` \| `TError`, `previousResult`: `undefined` \| `Result`, `attempt`: `number`) => `boolean` | Predicate function for deciding whether another call to the operation should happen.                    If this argument is not defined, retry would happen whenever the operation rejects with an error.                    `shouldRetry` would be evaluated before `backoff`.                    The `attempt` argument passed into shouldRetry function starts from 1. |

###### Returns

`Promise`<`Result`\>

Promise of the operation result potentially with retries already applied

## Enums


<a name="enumspromisestatemd"></a>

[@handy-common-utils/promise-utils](#readmemd) / PromiseState

### Enumeration: PromiseState

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
