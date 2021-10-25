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
                expect(Math.abs(Date.now() - startTime - DELAY)).lt(ALLOWED_DEVIATION); // because the the inner Promise would start immediately
              });
    });
    it('should resolved a rejected promise after specified time', () => {
      const DELAY = 60;
      const ERROR_MSG = 'this is the error message';
      const startTime = Date.now();
      const delayedResolvePromise = PromiseUtils.delayedResolve(DELAY, PromiseUtils.delayedReject(DELAY, ERROR_MSG));
      return expect(delayedResolvePromise).to.be.rejectedWith(ERROR_MSG)
              .then(() => {
                expect(Math.abs(Date.now() - startTime - DELAY)).lt(ALLOWED_DEVIATION);
              });
    });
    it('should handle function suppliying the result', () => {
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
    it('should handle function suppliying the reason as a value', () => {
      const DELAY = 60;
      const ERROR_MSG = 'this is the error message';
      const startTime = Date.now();
      const delayedRejectPromise = PromiseUtils.delayedReject(DELAY, () => ERROR_MSG);
      return expect(delayedRejectPromise).to.be.rejectedWith(ERROR_MSG)
              .then(() => {
                expect(Math.abs(Date.now() - startTime - DELAY)).lt(ALLOWED_DEVIATION);
              });
    });
  });
  describe('inParallel(...)', () => {
    let OVERHEAD = 0;
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
          console.log(`+${expectedDuration} -${duration}`);
          if (p <= -10) {  // those p <= -10 are warm up and calibration runs
            OVERHEAD += (duration - expectedDuration) / NUM;  // calibration
          } else {
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
  });
  describe('timeoutResolve(...)', () => {
    it('should return original fulfilled result when not timed-out', async () => {
      const p = PromiseUtils.timeoutResolve(PromiseUtils.delayedResolve(10, 1), 80, 2);
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
  });
  describe('timeoutReject(...)', () => {
    it('should return original fulfilled result when not timed-out', async () => {
      const p = PromiseUtils.timeoutReject(PromiseUtils.delayedResolve(10, 1), 80, '2');
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
  describe('synchronized(...)', () => {
    it('should work for a simple three "threads" scenario', async () => {
      const lock = 'lock' + Date.now();
      const startTime = Date.now();
      PromiseUtils.synchronized(lock, (prevState, prevSettledState, prevResult) => {
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
