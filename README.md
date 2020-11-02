# @handy-common-utils/promise-utils

Promise related utilities

## How to use

First add it as a dependency:

```sh
npm install @handy-common-utils/promise-utils
```

Then you can use it in the code:

```javascript
import { FsUtils } from 'fs-utils';

const [,, filePath, matchPattern, beforeString, afterString] = process.argv;
await FsUtils.addSurroundingInFile(filePath, new RegExp(matchPattern), beforeString, afterString);
```

You can either import and use the [class](#classes) as shown above,
or you can import individual [functions](#variables) directly like below:

```javascript
import { addSurroundingInFile } from 'fs-utils';

await addSurroundingInFile(README_MD_FILE, /<example>(.*?)<\/example>/gms, '<example><b>', '</b></example>');
```

# API

<!-- API start -->
<a name="readmemd"></a>

**[@handy-common-utils/promise-utils](#readmemd)**

> Globals

## @handy-common-utils/promise-utils

### Index

#### Classes

* [PromiseUtils](#classespromiseutilsmd)

#### Type aliases

* [InParrellelResult](#inparrellelresult)

#### Variables

* [delayedReject](#delayedreject)
* [delayedResolve](#delayedresolve)
* [inParallel](#inparallel)
* [repeat](#repeat)
* [timeoutReject](#timeoutreject)
* [timeoutResolve](#timeoutresolve)

### Type aliases

#### InParrellelResult

Ƭ  **InParrellelResult**\<T>: T *extends* void ? void : Array\<T>

##### Type parameters:

Name |
------ |
`T` |

### Variables

#### delayedReject

• `Const` **delayedReject**: [delayedReject](#delayedreject) = PromiseUtils.delayedReject

___

#### delayedResolve

• `Const` **delayedResolve**: [delayedResolve](#delayedresolve) = PromiseUtils.delayedResolve

___

#### inParallel

• `Const` **inParallel**: [inParallel](#inparallel) = PromiseUtils.inParallel

___

#### repeat

• `Const` **repeat**: [repeat](#repeat) = PromiseUtils.repeat

___

#### timeoutReject

• `Const` **timeoutReject**: [timeoutReject](#timeoutreject) = PromiseUtils.timeoutReject

___

#### timeoutResolve

• `Const` **timeoutResolve**: [timeoutResolve](#timeoutresolve) = PromiseUtils.timeoutResolve

## Classes


<a name="classespromiseutilsmd"></a>

**[@handy-common-utils/promise-utils](#readmemd)**

> [Globals](#readmemd) / PromiseUtils

### Class: PromiseUtils

#### Hierarchy

* **PromiseUtils**

#### Index

##### Methods

* [delayedReject](#delayedreject)
* [delayedResolve](#delayedresolve)
* [inParallel](#inparallel)
* [repeat](#repeat)
* [timeoutReject](#timeoutreject)
* [timeoutResolve](#timeoutresolve)

#### Methods

##### delayedReject

▸ `Static` **delayedReject**\<T>(`ms`: number, `reason`: any): Promise\<T>

Create a Promise that rejects after number of milliseconds specified

###### Type parameters:

Name | Default |
------ | ------ |
`T` | never |

###### Parameters:

Name | Type | Description |
------ | ------ | ------ |
`ms` | number | number of milliseconds after which the created Promise would reject |
`reason` | any | the reason of the rejection for the Promise |

**Returns:** Promise\<T>

the new Promise created

___

##### delayedResolve

▸ `Static` **delayedResolve**\<T>(`ms`: number, `result?`: T \| PromiseLike\<T> \| undefined): Promise\<T>

Create a Promise that resolves after number of milliseconds specified

###### Type parameters:

Name |
------ |
`T` |

###### Parameters:

Name | Type | Description |
------ | ------ | ------ |
`ms` | number | number of milliseconds after which the created Promise would resolve |
`result?` | T \| PromiseLike\<T> \| undefined | the result to be resolved for the Promise |

**Returns:** Promise\<T>

the new Promise created

___

##### inParallel

▸ `Static` **inParallel**\<Data, Result>(`parallelism`: number, `jobs`: Iterable\<Data>, `operation`: (job: Data, index: number) => Promise\<Result>): Promise\<[InParrellelResult](#inparrellelresult)\<Result>>

Run multiple jobs/operations in parallel.

**`example`**
```javascript
 
const topicArns = topics.map(topic => topic.TopicArn!);
await Utils.inParallel(5, topicArns, async topicArn => {
  const topicAttributes = (await sns.getTopicAttributes({ TopicArn: topicArn }).promise()).Attributes!;
  const topicDetails = { ...topicAttributes, subscriptions: [] } as any;
  if (this.shouldInclude(topicArn)) {
    inventory.snsTopicsByArn.set(topicArn, topicDetails);
  }
});

```
###### Type parameters:

Name | Description |
------ | ------ |
`Data` | Type of the job data, usually it would be an Array |
`Result` | Type of the return value of the operation function  |

###### Parameters:

Name | Type | Description |
------ | ------ | ------ |
`parallelism` | number | how many jobs/operations can be running at the same time |
`jobs` | Iterable\<Data> | job data which will be the input to operation function.                    This function is safe when there are infinite unknown number of elements in the job data. |
`operation` | (job: Data, index: number) => Promise\<Result> | the function that turns job data into result asynchronously |

**Returns:** Promise\<[InParrellelResult](#inparrellelresult)\<Result>>

Promise of void if the operation function does not return a value,
         or promise of an arry containing results returned from the operation function.

___

##### repeat

▸ `Static` **repeat**\<Result, Param, Collection>(`operation`: (parameter: Partial\<Param>) => Promise\<Result>, `nextParameter`: (response: Result) => Partial\<Param> \| null, `collect`: (collection: Collection, result: Result) => Collection, `initialCollection`: Collection, `initialParameter?`: Partial\<Param>): Promise\<Collection>

Do an operation repeatedly and collect all the results.
This function is useful for client side pagination.

**`example`**
```javascript
 
const domainNameObjects = await Utils.repeat(
  pagingParam => apig.getDomainNames({limit: 500, ...pagingParam}).promise(),
  esponse => response.position? {position: response.position} : null,
  (collection, response) => collection.concat(response.items!),
  [] as APIGateway.DomainName[],
);

```
###### Type parameters:

Name | Description |
------ | ------ |
`Result` | type of the operation result |
`Param` | type of the input to the operation, normally the input is a paging parameter |
`Collection` | type of the returned value of this function  |

###### Parameters:

Name | Type | Default value | Description |
------ | ------ | ------ | ------ |
`operation` | (parameter: Partial\<Param>) => Promise\<Result> | - | a function that takes paging parameter as input and outputs a result, normally the operation supports paging |
`nextParameter` | (response: Result) => Partial\<Param> \| null | - | The function for calculating next parameter from the operation result.                      Normally the parameter controls paging,                      This function should return null when next invocation of the operation function is not desired. |
`collect` | (collection: Collection, result: Result) => Collection | - | the function for merging operation result into the collection |
`initialCollection` | Collection | - | initial collection which would be the first argument passed into the first invocation of the collect function |
`initialParameter` | Partial\<Param> | {} | the parameter for the first operation |

**Returns:** Promise\<Collection>

Promise of collection of all the results returned by the operation function

___

##### timeoutReject

▸ `Static` **timeoutReject**\<T>(`operation`: Promise\<T>, `ms`: number, `rejectReason`: any): Promise\<T>

Apply timeout to an operation, in case timeout happens, reject with the reason specified.
If timeout does not happen, the resolved result or rejection reason of the original operation would be returned.

###### Type parameters:

Name |
------ |
`T` |

###### Parameters:

Name | Type | Description |
------ | ------ | ------ |
`operation` | Promise\<T> | the original operation that timeout would be applied |
`ms` | number | number of milliseconds for the timeout |
`rejectReason` | any | the reason of the rejection in case timeout happens |

**Returns:** Promise\<T>

the new Promise that rejects with the specified reason in case timeout happens

___

##### timeoutResolve

▸ `Static` **timeoutResolve**\<T>(`operation`: Promise\<T>, `ms`: number, `result?`: T \| PromiseLike\<T> \| undefined): Promise\<T>

Apply timeout to an operation, in case timeout happens, resolve to the result specified.
If timeout does not happen, the resolved result or rejection reason of the original operation would be returned.

###### Type parameters:

Name |
------ |
`T` |

###### Parameters:

Name | Type | Description |
------ | ------ | ------ |
`operation` | Promise\<T> | the original operation that timeout would be applied |
`ms` | number | number of milliseconds for the timeout |
`result?` | T \| PromiseLike\<T> \| undefined | the result to be resolved in case timeout happens |

**Returns:** Promise\<T>

the new Promise that resolves to the specified result in case timeout happens
<!-- API end -->
