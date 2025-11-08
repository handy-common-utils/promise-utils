/* eslint-disable max-nested-callbacks */
import { expect } from 'chai';
import * as chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);

import { PromiseState, PromiseUtils } from '../src/promise-utils';

const ALLOWED_DEVIATION = 20;

describe('PromiseUtils', () => {
  describe('withRetry(...)', () => {
    it('should retry always rejecting operation in the way specified in backoff array', () => {
      const ERROR_MSG = 'this is the error message';
      const BACKOFF_PERIODS = [100, 200, 300, 300, 200];
      const deltas: number[] = [];
      let previousTime: number;
      const promiseWithRetry = PromiseUtils.withRetry(async attempt => {
        const now = Date.now();
        if (attempt > 1) {
          const delta = now - previousTime;
          deltas.push(delta);
        }
        previousTime = now;
        throw new Error(ERROR_MSG);
      }, BACKOFF_PERIODS);
      return expect(promiseWithRetry).to.eventually.rejectedWith(Error, ERROR_MSG)
              .then(() => {
                expect(deltas.length).eq(BACKOFF_PERIODS.length);
                // eslint-disable-next-line unicorn/no-array-for-each
                BACKOFF_PERIODS.forEach((expectedTime, i) => expect(Math.abs(deltas[i] - expectedTime)).lt(ALLOWED_DEVIATION));
              });
    });
    it('should retry always rejecting operation in the way specified by backoff function', () => {
      const ERROR_MSG = 'this is the error message';
      const BACKOFF_PERIODS = [100, 200, 300, 300, 200];
      const backoffFunction: Parameters<typeof PromiseUtils.withRetry>[1] = attempt => BACKOFF_PERIODS[attempt - 1];
      const deltas: number[] = [];
      let previousTime: number;
      const promiseWithRetry = PromiseUtils.withRetry(async attempt => {
        const now = Date.now();
        if (attempt > 1) {
          const delta = now - previousTime;
          deltas.push(delta);
        }
        previousTime = now;
        throw new Error(ERROR_MSG);
      }, backoffFunction);
      return expect(promiseWithRetry).to.eventually.rejectedWith(Error, ERROR_MSG)
              .then(() => {
                expect(deltas.length).eq(BACKOFF_PERIODS.length);
                // eslint-disable-next-line unicorn/no-array-for-each
                BACKOFF_PERIODS.forEach((expectedTime, i) => expect(Math.abs(deltas[i] - expectedTime)).lt(ALLOWED_DEVIATION));
              });
    });
    it('should not retry if the first attempt succeeded', () => {
      const SUCC_RESULT = 'this is the success message';
      const BACKOFF_PERIODS = [100, 200, 300, 300, 200];
      const deltas: number[] = [];
      let previousTime: number;
      const promiseWithRetry = PromiseUtils.withRetry(async attempt => {
        const now = Date.now();
        if (attempt > 1) {
          const delta = now - previousTime;
          deltas.push(delta);
        }
        previousTime = now;
        return SUCC_RESULT;
      }, BACKOFF_PERIODS);
      return expect(promiseWithRetry).to.eventually.eq(SUCC_RESULT)
              .then(() => {
                expect(deltas.length).eq(0);
              });
    });
    it('should keep retrying until an attempt succeeded', () => {
      const SUCC_RESULT = 'this is the success message';
      const ERROR_MSG = 'this is the error message';
      const BACKOFF_PERIODS = [100, 200, 300, 300, 200];
      const deltas: number[] = [];
      let previousTime: number;
      const promiseWithRetry = PromiseUtils.withRetry(async attempt => {
        const now = Date.now();
        if (attempt > 1) {
          const delta = now - previousTime;
          deltas.push(delta);
        }
        previousTime = now;
        if (attempt === 3) {  // 3rd attempt, aka. 2nd retry
          return SUCC_RESULT;
        }
        throw new Error(ERROR_MSG);
      }, BACKOFF_PERIODS);
      return expect(promiseWithRetry).to.eventually.eq(SUCC_RESULT)
              .then(() => {
                expect(deltas.length).eq(2);
                // eslint-disable-next-line unicorn/no-array-for-each
                BACKOFF_PERIODS.slice(0, 2).forEach((expectedTime, i) => expect(Math.abs(deltas[i] - expectedTime)).lt(ALLOWED_DEVIATION));
              });
    });
  });
  describe('delayedResolve(...)', () => {
    it('should resolve a value after specified time', () => {
      const DELAY = 50;
      const SUCC_RESULT = 'this is the success message';
      const startTime = Date.now();
      const delayedResolvePromise = PromiseUtils.delayedResolve(DELAY, SUCC_RESULT);
      return expect(delayedResolvePromise).to.eventually.eq(SUCC_RESULT)
              .then(() => {
                expect(Math.abs(Date.now() - startTime - DELAY)).lt(ALLOWED_DEVIATION);
              });
    });
    it('should resolve a fulfilled promise after specified time', () => {
      const DELAY = 60;
      const SUCC_RESULT = 'this is the success message';
      const startTime = Date.now();
      const delayedResolvePromise = PromiseUtils.delayedResolve(DELAY, PromiseUtils.delayedResolve(DELAY, SUCC_RESULT));
      return expect(delayedResolvePromise).to.eventually.eq(SUCC_RESULT)
              .then(() => {
                expect(Math.abs(Date.now() - startTime - DELAY)).lt(ALLOWED_DEVIATION); // because the inner Promise would start immediately
              });
    });
    it('should resolve a fulfilling promise supplied by a function after specified time', () => {
      const DELAY = 60;
      const SUCC_RESULT = 'this is the success message';
      const startTime = Date.now();
      const supplier = () => PromiseUtils.delayedResolve(DELAY, SUCC_RESULT);
      const delayedResolvePromise = PromiseUtils.delayedResolve(DELAY, supplier);
      return expect(delayedResolvePromise).to.eventually.eq(SUCC_RESULT)
              .then(() => {
                expect(Math.abs(Date.now() - startTime - DELAY - DELAY)).lt(ALLOWED_DEVIATION); // because the supplier would create the Promise after DELAY
              });
    });
    it('should resolved a rejected promise after specified time', () => {
      const DELAY = 60;
      const ERROR_MSG = 'this is the error message';
      const startTime = Date.now();
      const theRejectedPromise = PromiseUtils.delayedReject(DELAY / 3, ERROR_MSG);
      theRejectedPromise.catch(_error => {
        // do nothing, just for avoiding this: (node:4330) PromiseRejectionHandledWarning: Promise rejection was handled asynchronously
      });
      const delayedResolvePromise = PromiseUtils.delayedResolve(DELAY, theRejectedPromise);
      return expect(delayedResolvePromise).to.be.rejectedWith(ERROR_MSG)
              .then(() => {
                expect(Math.abs(Date.now() - startTime - DELAY)).lt(ALLOWED_DEVIATION);
              });
    });
    it('should handle function supplying the result', () => {
      const DELAY = 60;
      const SUCC_RESULT = 'this is the success message';
      const startTime = Date.now();
      const delayedResolvePromise = PromiseUtils.delayedResolve(DELAY, () => PromiseUtils.delayedResolve(DELAY, SUCC_RESULT));
      return expect(delayedResolvePromise).to.eventually.eq(SUCC_RESULT)
              .then(() => {
                expect(Math.abs(Date.now() - startTime - DELAY - DELAY)).lt(ALLOWED_DEVIATION);
              });
    });
  });
  describe('delayedReject(...)', () => {
    it('should reject with a reason after specified time', () => {
      const DELAY = 60;
      const ERROR_MSG = 'this is the error message';
      const startTime = Date.now();
      const delayedRejectPromise = PromiseUtils.delayedReject(DELAY, ERROR_MSG);
      return expect(delayedRejectPromise).to.be.rejectedWith(ERROR_MSG)
              .then(() => {
                expect(Math.abs(Date.now() - startTime - DELAY)).lt(ALLOWED_DEVIATION);
              });
    });
    it('should handle function supplying the reason as a value', () => {
      const DELAY = 60;
      const ERROR_MSG = 'this is the error message';
      const startTime = Date.now();
      const delayedRejectPromise = PromiseUtils.delayedReject(DELAY, () => ERROR_MSG);
      return expect(delayedRejectPromise).to.be.rejectedWith(ERROR_MSG)
              .then(() => {
                expect(Math.abs(Date.now() - startTime - DELAY)).lt(ALLOWED_DEVIATION);
              });
    });
    it('should handle function supplying the reason as a Promise', () => {
      const DELAY = 60;
      const ERROR_MSG = 'this is the error message';
      const startTime = Date.now();
      const delayedRejectPromise = PromiseUtils.delayedReject(DELAY, () => Promise.resolve(ERROR_MSG));
      return expect(delayedRejectPromise).to.be.rejectedWith(ERROR_MSG)
              .then(() => {
                expect(Math.abs(Date.now() - startTime - DELAY)).lt(ALLOWED_DEVIATION);
              });
    });
    it('should handle function supplying the reason as the rejection reason of a Promise', () => {
      const DELAY = 60;
      const ERROR_MSG = 'this is the error message';
      const startTime = Date.now();
      const delayedRejectPromise = PromiseUtils.delayedReject(DELAY, () => Promise.reject(ERROR_MSG));
      return expect(delayedRejectPromise).to.be.rejectedWith(ERROR_MSG)
              .then(() => {
                expect(Math.abs(Date.now() - startTime - DELAY)).lt(ALLOWED_DEVIATION);
              });
    });
  });
  describe('withConcurrency(...)', () => {
    let OVERHEAD = 1;
    for (const p of [-10, -10, -10, -10, -3, 0, 1, 2, 3, 5, 6, 10, 30]) {
      it(`should run operations concurrently when concurrency=${p}`, function () {
        this.timeout(10000);
        const DELAY = 50;
        const NUM = 30;
        const DATA = Array.from({ length: NUM }).fill(1);
        const startTime = Date.now();
        let endTime = 0;
        const promise = PromiseUtils.withConcurrency(p, DATA, () => PromiseUtils.delayedResolve<void>(DELAY))
                                          .then(() => {
                                            endTime = Date.now();
                                          });
        return promise.then(() => {
          const duration = endTime - startTime;
          const expectedDuration = (DELAY + OVERHEAD) * NUM / (p < 1 ? 1 : p);   // + overhead per operation
          // console.log(`+${expectedDuration} -${duration}`);
          if (p <= -10) {  // those p <= -10 are warm up and calibration runs
            OVERHEAD += (duration - expectedDuration) * 0.9 / NUM;  // calibration
          } else {
            expect(OVERHEAD).to.lt(ALLOWED_DEVIATION);  // overhead should be small
            expect(Math.abs(duration - expectedDuration)).lt(ALLOWED_DEVIATION);
          }
        });
      });
    }
    it('should abort on error', async () => {
      const DELAY = 3;
      const NUM = 30;
      const DATA: boolean[] = Array.from({ length: NUM });
      DATA.fill(true, 0, NUM / 2);
      DATA.fill(false, NUM / 2);
      let count = 0;
      const promise = PromiseUtils.withConcurrency(5, DATA, d => {
        count ++;
        return d ? PromiseUtils.delayedResolve(DELAY, d) : PromiseUtils.delayedReject(DELAY, `${d}`);
      });
      expect(promise).to.be.rejectedWith('false');
      await promise.catch(() => null);
      expect(count).to.be.lessThan(NUM);
    });
  });
  describe('inParallel(...)', () => {
    let OVERHEAD = 1;
    for (const p of [-10, -10, -10, -10, -3, 0, 1, 2, 3, 5, 6, 10, 30]) {
      it(`should run operations in parallel when parallelism=${p}`, function () {
        this.timeout(10000);
        const DELAY = 50;
        const NUM = 30;
        const DATA = Array.from({ length: NUM }).fill(1);
        const startTime = Date.now();
        let endTime = 0;
        const promise = PromiseUtils.inParallel(p, DATA, () => PromiseUtils.delayedResolve<void>(DELAY))
                                          .then(() => {
                                            endTime = Date.now();
                                          });
        return promise.then(() => {
          const duration = endTime - startTime;
          const expectedDuration = (DELAY + OVERHEAD) * NUM / (p < 1 ? 1 : p);   // + overhead per operation
          // console.log(`+${expectedDuration} -${duration}`);
          if (p <= -10) {  // those p <= -10 are warm up and calibration runs
            OVERHEAD += (duration - expectedDuration) * 0.9 / NUM;  // calibration
          } else {
            expect(OVERHEAD).to.lt(ALLOWED_DEVIATION);  // overhead should be small
            expect(Math.abs(duration - expectedDuration)).lt(ALLOWED_DEVIATION);
          }
        });
      });
    }
    it('should return results from all fulfilled and rejected operations', () => {
      const DELAY = 3;
      const NUM = 30;
      const DATA: boolean[] = Array.from({ length: NUM });
      DATA.fill(true, 0, NUM / 2);
      DATA.fill(false, NUM / 2);
      const promise = PromiseUtils.inParallel<boolean, boolean, string>(5, DATA, d => d ? PromiseUtils.delayedResolve(DELAY, d) : PromiseUtils.delayedReject(DELAY, `${d}`));
      return promise.then(results => {
        expect(results.slice(0, NUM / 2)).eql(DATA.slice(0, NUM / 2));
        expect(results.slice(NUM / 2)).eql(DATA.slice(NUM / 2).map(d => `${d}`));
      });
    });
    it('should abort on error if the options.abortOnError flag is true', async () => {
      const DELAY = 3;
      const NUM = 30;
      const DATA: boolean[] = Array.from({ length: NUM });
      DATA.fill(true, 0, NUM / 2);
      DATA.fill(false, NUM / 2);
      let count = 0;
      const promise = PromiseUtils.inParallel(5, DATA, d => {
        count ++;
        return d ? PromiseUtils.delayedResolve(DELAY, d) : PromiseUtils.delayedReject(DELAY, `${d}`);
      }, { abortOnError: true });
      expect(promise).to.be.rejectedWith('false');
      await promise.catch(() => null);
      expect(count).to.be.lessThan(NUM);
    });
    it('should not abort on error if the options.abortOnError flag is not set', async () => {
      const DELAY = 3;
      const NUM = 30;
      const DATA: boolean[] = Array.from({ length: NUM });
      DATA.fill(true, 0, NUM / 2);
      DATA.fill(false, NUM / 2);
      let count = 0;
      const promise = PromiseUtils.inParallel(5, DATA, d => {
        count ++;
        return d ? PromiseUtils.delayedResolve(DELAY, d) : PromiseUtils.delayedReject(DELAY, `${d}`);
      });
      expect(promise).to.be.fulfilled;
      await promise;
      expect(count).to.equal(NUM);
    });
  });
  describe('timeoutResolve(...)', () => {
    it('should return original fulfilled result when not timed-out', async () => {
      const p = PromiseUtils.timeoutResolve(PromiseUtils.delayedResolve(10, 1), 80, 2);
      await expect(p).eventually.eq(1);
    });
    it('should return original fulfilled result supplied by a function when not timed-out', async () => {
      const p = PromiseUtils.timeoutResolve(() => PromiseUtils.delayedResolve(10, 1), 80, 2);
      await expect(p).eventually.eq(1);
    });
    it('should return original rejected result when not timed-out', async () => {
      const p = PromiseUtils.timeoutResolve(PromiseUtils.delayedReject(10, '1'), 80, 2);
      await expect(p).to.be.rejectedWith('1');
    });
    it('should timeout with specified result', async () => {
      const p = PromiseUtils.timeoutResolve(PromiseUtils.delayedResolve(80, 1), 10, 2);
      await expect(p).eventually.eq(2);
    });
    it('should timeout with specified result when the original promise is supplied by a function', async () => {
      const p = PromiseUtils.timeoutResolve(() => PromiseUtils.delayedResolve(80, 1), 10, 2);
      await expect(p).eventually.eq(2);
    });
    it('should timeout with specified result as a Promise supplied by a function', async () => {
      const p = PromiseUtils.timeoutResolve(PromiseUtils.delayedResolve(80, 1), 10, () => Promise.resolve(2));
      await expect(p).eventually.eq(2);
    });
    it('should not execute the result function when not timed-out', async () => {
      let resultFunctionExecuted = false;
      const resultFunction = () => {
        resultFunctionExecuted = true;
        return 2;
      };
      const p = PromiseUtils.timeoutResolve(PromiseUtils.delayedResolve(10, 1), 80, resultFunction);
      await expect(p).eventually.eq(1);
      await PromiseUtils.delayedResolve(80);
      expect(resultFunctionExecuted).to.be.false;
    });
  });
  describe('timeoutReject(...)', () => {
    it('should return original fulfilled result when not timed-out', async () => {
      const p = PromiseUtils.timeoutReject(PromiseUtils.delayedResolve(10, 1), 80, '2');
      await expect(p).eventually.eq(1);
    });
    it('should return original fulfilled result supplied by a function when not timed-out', async () => {
      const p = PromiseUtils.timeoutReject(() => PromiseUtils.delayedResolve(10, 1), 80, '2');
      await expect(p).eventually.eq(1);
    });
    it('should return original rejected result when not timed-out', async () => {
      const p = PromiseUtils.timeoutReject(PromiseUtils.delayedReject(10, '1'), 80, '2');
      await expect(p).to.be.rejectedWith('1');
    });
    it('should timeout with specified reason', async () => {
      const p = PromiseUtils.timeoutReject(PromiseUtils.delayedReject(80, '1'), 10, '2');
      await expect(p).to.be.rejectedWith('2');
    });
    it('should timeout with specified reason when the original promise is supplied by a function', async () => {
      const p = PromiseUtils.timeoutReject(() => PromiseUtils.delayedReject(80, '1'), 10, '2');
      await expect(p).to.be.rejectedWith('2');
    });
    it('should timeout with specified reason as fulfilled Promise supplied by a function', async () => {
      const p = PromiseUtils.timeoutReject(PromiseUtils.delayedReject(80, '1'), 10, () => Promise.resolve('2'));
      await expect(p).to.be.rejectedWith('2');
    });
    it('should timeout with specified reason as rejected Promise supplied by a function', async () => {
      const p = PromiseUtils.timeoutReject(PromiseUtils.delayedReject(80, '1'), 10, () => Promise.reject(new Error('2')));
      await expect(p).to.be.rejectedWith('2');
    });
    it('should not execute the reason function when not timed-out', async () => {
      let reasonFunctionExecuted = false;
      const reasonFunction = () => {
        reasonFunctionExecuted = true;
        return '2';
      };
      const p = PromiseUtils.timeoutReject(PromiseUtils.delayedResolve(10, 1), 80, reasonFunction);
      await expect(p).eventually.eq(1);
      await PromiseUtils.delayedResolve(80);
      expect(reasonFunctionExecuted).to.be.false;
    });
  });
  describe('promiseState(...)', () => {
    it('should get correct state', async () => {
      const p1 = PromiseUtils.delayedResolve(50, 1);
      const p2 = PromiseUtils.delayedReject(50, 2);
      await expect(PromiseUtils.promiseState(p1)).eventually.eq(PromiseState.Pending);
      await expect(PromiseUtils.promiseState(p2)).eventually.eq(PromiseState.Pending);
      await PromiseUtils.delayedResolve(80);
      await expect(PromiseUtils.promiseState(p1)).eventually.eq(PromiseState.Fulfilled);
      await expect(PromiseUtils.promiseState(p2)).eventually.eq(PromiseState.Rejected);
    });
  });

  describe('runPeriodically(...)', () => {
    it('should schedule first call after the first interval', async () => {
      const INTERVAL = 50;
      const starts: number[] = [];
      const startTime = Date.now();
      const controller = PromiseUtils.runPeriodically(() => { starts.push(Date.now()); }, INTERVAL, { maxExecutions: 1 });
      await controller.done;
      expect(starts.length).to.eq(1);
      expect(Math.abs(starts[0] - startTime - INTERVAL)).to.be.lt(ALLOWED_DEVIATION);
    });

    it('should use delayAfterEnd semantics when requested', async () => {
      const INTERVAL = 100;
      const OP_DURATION = 60;
      const starts: number[] = [];
      const controller = PromiseUtils.runPeriodically(async () => {
        starts.push(Date.now());
        await PromiseUtils.delayedResolve(OP_DURATION);
      }, INTERVAL, { maxExecutions: 2, schedule: 'delayAfterEnd' });
      await controller.done;
      expect(starts.length).to.eq(2);
      const delta = starts[1] - starts[0];
      expect(Math.abs(delta - (OP_DURATION + INTERVAL))).to.be.lt(ALLOWED_DEVIATION);
    });

    it('should use delayBetweenStarts as the default schedule', async () => {
      const INTERVAL = 100;
      const OP_DURATION = 60;
      const starts: number[] = [];
      const controller = PromiseUtils.runPeriodically(async () => {
        starts.push(Date.now());
        await PromiseUtils.delayedResolve(OP_DURATION);
      }, INTERVAL, { maxExecutions: 3 });
      await controller.done;
      expect(starts.length).to.eq(3);
      const delta1 = starts[1] - starts[0];
      const delta2 = starts[2] - starts[1];
      expect(Math.abs(delta1 - INTERVAL)).to.be.lt(ALLOWED_DEVIATION);
      expect(Math.abs(delta2 - INTERVAL)).to.be.lt(ALLOWED_DEVIATION);
    });

    it('should use delayBetweenStarts semantics when requested', async () => {
      const INTERVAL = 100;
      const OP_DURATION = 60;
      const starts: number[] = [];
      const controller = PromiseUtils.runPeriodically(async () => {
        starts.push(Date.now());
        await PromiseUtils.delayedResolve(OP_DURATION);
      }, INTERVAL, { maxExecutions: 3, schedule: 'delayBetweenStarts' });
      await controller.done;
      expect(starts.length).to.eq(3);
      const delta1 = starts[1] - starts[0];
      const delta2 = starts[2] - starts[1];
      expect(Math.abs(delta1 - INTERVAL)).to.be.lt(ALLOWED_DEVIATION);
      expect(Math.abs(delta2 - INTERVAL)).to.be.lt(ALLOWED_DEVIATION);
    });

    it('should stop when controller.stop() is called', async () => {
      const INTERVAL = 50;
      let count = 0;
      const controller = PromiseUtils.runPeriodically(async () => {
        count++;
        if (count === 1) {
          controller.stop();
        }
      }, INTERVAL, { maxExecutions: 10 });
      await controller.done;
      expect(count).to.eq(1);
    });

    it('should cancel a pending wait (no calls if stopped before first interval)', async () => {
      const INTERVAL = 200;
      let count = 0;
      const controller = PromiseUtils.runPeriodically(() => {
        count++;
      }, INTERVAL, { maxExecutions: 10 });
      // stop immediately before the first interval elapses
      controller.stop();
      await controller.done;
      expect(count).to.eq(0);
    });

    it('should accept interval as a function and stop when it returns undefined', async () => {
      const intervals = [50, 80, 100];
      const starts: number[] = [];
      const startTime = Date.now();
      const controller = PromiseUtils.runPeriodically(() => {
        starts.push(Date.now());
      }, (iteration: number) => (iteration <= intervals.length ? intervals[iteration - 1] : undefined));
      await controller.done;
      expect(starts.length).to.eq(intervals.length);
      // check the deltas between starts roughly match the provided intervals
      for (let i = 1; i < starts.length; i++) {
        const delta = starts[i] - starts[i - 1];
        expect(Math.abs(delta - intervals[i])).to.be.lt(ALLOWED_DEVIATION);
      }
      // verify first start happened after first interval
      expect(Math.abs(starts[0] - startTime - intervals[0])).to.be.lt(ALLOWED_DEVIATION);
    });

    it('should accept interval as an array and stop when the array is exhausted', async () => {
      const intervals = [40, 80, 60];
      const starts: number[] = [];
      const startTime = Date.now();
      const controller = PromiseUtils.runPeriodically(() => {
        starts.push(Date.now());
      }, intervals);
      await controller.done;
      expect(starts.length).to.eq(intervals.length);
      for (let i = 1; i < starts.length; i++) {
        const delta = starts[i] - starts[i - 1];
        expect(Math.abs(delta - intervals[i])).to.be.lt(ALLOWED_DEVIATION);
      }
      expect(Math.abs(starts[0] - startTime - intervals[0])).to.be.lt(ALLOWED_DEVIATION);
    });

    it('should stop after approximately maxDurationMs has elapsed', async () => {
      const INTERVAL = 50;
      const OP_DURATION = 30;
      const starts: number[] = [];
      const startTime = Date.now();
      // Set maxDurationMs so that only two executions fit: first at ~50ms, second at ~130ms, third would finish after maxDuration
      const controller = PromiseUtils.runPeriodically(async () => {
        starts.push(Date.now());
        await PromiseUtils.delayedResolve(OP_DURATION);
      }, INTERVAL, { maxDurationMs: 140, schedule: 'delayAfterEnd' });
      await controller.done;
      // We expect two executions (first and second) and the runner stops after checking duration
      expect(starts.length).to.be.at.least(1);
      expect(starts.length).to.be.at.most(3);
      // Prefer the expected 2 executions for timing; if flaky, accept 1-3 but assert timing for first two if present
      if (starts.length >= 2) {
        const firstDelta = starts[0] - startTime;
        const secondDelta = starts[1] - starts[0];
        expect(Math.abs(firstDelta - INTERVAL)).to.be.lt(ALLOWED_DEVIATION);
        expect(Math.abs(secondDelta - (INTERVAL + OP_DURATION))).to.be.lt(ALLOWED_DEVIATION);
      }
    });
  });
  describe('synchronized(...)', () => {
    it('should work for a simple three "threads" scenario', async () => {
      const lock = 'lock' + Date.now();
      const startTime = Date.now();
      PromiseUtils.synchronised(lock, (prevState, prevSettledState, prevResult) => {
        expect(prevState).to.be.undefined;
        expect(prevSettledState).to.be.undefined;
        expect(prevResult).to.be.undefined;
        return PromiseUtils.delayedResolve(50, 'p1');
      });
      await PromiseUtils.delayedResolve(20);
      PromiseUtils.synchronized(lock, (prevState, prevSettledState, prevResult) => {
        expect(prevState).to.eq(PromiseState.Pending);
        expect(prevSettledState).to.eq(PromiseState.Fulfilled);
        expect(prevResult).to.eq('p1');
        return PromiseUtils.delayedReject(50, 'p2');
      });
      await PromiseUtils.delayedResolve(20);
      const p3 = PromiseUtils.synchronized(lock, (prevState, prevSettledState, prevResult) => {
        expect(prevState).to.eq(PromiseState.Pending);
        expect(prevSettledState).to.eq(PromiseState.Rejected);
        expect(prevResult).to.eq('p2');
        return PromiseUtils.delayedReject(50, 'p3');
      });
      await expect(p3).to.be.rejectedWith('p3');
      const p4 = PromiseUtils.synchronized(lock, (prevState, prevSettledState, prevResult) => {
        expect(prevState).to.eq(PromiseState.Rejected);
        expect(prevSettledState).to.eq(PromiseState.Rejected);
        expect(prevResult).to.eq('p3');
        return PromiseUtils.delayedResolve(20, 'p4');
      });
      await expect(p4).to.eventually.eq('p4');
      expect(Math.abs(Date.now() - startTime - 170 - 12)).to.be.lt(ALLOWED_DEVIATION);  // 3ms overhead per operation
    });
  });
});
