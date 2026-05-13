import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateQuote } from '../src/utils/quoteCalculator.js';

test('calculateQuote returns the expected standard fare breakdown', () => {
  const quote = calculateQuote({
    distanceKm: 5,
    passengerCount: 1,
    helmetRequired: false,
    priority: 'standard'
  });

  assert.deepEqual(quote, {
    currency: 'TZS',
    baseFare: 1500,
    distanceCharge: 4500,
    passengerCharge: 0,
    helmetCharge: 0,
    serviceFee: 420,
    priority: 'standard',
    total: 6420
  });
});

test('calculateQuote includes passenger, helmet, and priority adjustments', () => {
  const quote = calculateQuote({
    distanceKm: 3,
    passengerCount: 2,
    helmetRequired: true,
    priority: 'express'
  });

  assert.deepEqual(quote, {
    currency: 'TZS',
    baseFare: 1500,
    distanceCharge: 2700,
    passengerCharge: 300,
    helmetCharge: 500,
    serviceFee: 350,
    priority: 'express',
    total: 6152
  });
});

test('calculateQuote rejects invalid distance values', () => {
  assert.throws(
    () => calculateQuote({ distanceKm: 0 }),
    (error) => {
      assert.equal(error.message, 'Distance must be greater than zero.');
      assert.equal(error.status, 400);
      return true;
    }
  );
});
