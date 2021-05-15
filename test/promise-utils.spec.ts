/* eslint-disable max-nested-callbacks */
import { expect } from 'chai';
import * as chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);

import { PromiseUtils } from '../src/promise-utils';

describe('PromiseUtils', () => {
  describe('withRetry(...)', () => {
    it('should retry always rejecting operation in the way specified in backoff array', async () => {
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
                BACKOFF_PERIODS.forEach((expectedTime, i) => expect(Math.abs(deltas[i] - expectedTime)).lt(20));
              });
    });
    it('should retry always rejecting operation in the way specified by backoff function', async () => {
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
                BACKOFF_PERIODS.forEach((expectedTime, i) => expect(Math.abs(deltas[i] - expectedTime)).lt(20));
              });
    });
  });
});
