/**
 * Mock data and console tests for asset allocation analysis
 * Import and run this to test the calculateAllocation function
 */

import { calculateAllocation, type Asset } from './analysis';

// Mock asset data for testing
export const mockAssets: Asset[] = [
  { type: 'stocks', value: 50000 },
  { type: 'bonds', value: 30000 },
  { type: 'cash', value: 15000 },
  { type: 'real_estate', value: 5000 },
];

export const mockAssetsSmall: Asset[] = [
  { type: 'checking', value: 5000 },
  { type: 'savings', value: 10000 },
];

export const mockAssetsEmpty: Asset[] = [];

export const mockAssetsSingleType: Asset[] = [
  { type: 'crypto', value: 25000 },
  { type: 'crypto', value: 15000 },
  { type: 'crypto', value: 10000 },
];

/**
 * Test runner - call this in your browser console to see all tests
 * Usage: import { runTests } from './modules/analysis.test'
 *        runTests()
 */
export const runTests = () => {
  console.log('=== Asset Allocation Analysis Tests ===\n');

  // Test 1: Standard allocation
  console.log('Test 1: Standard allocation with mixed assets');
  const result1 = calculateAllocation(mockAssets);
  console.log('Input:', mockAssets);
  console.log('Output:', result1);
  console.log('Percentages:');
  Object.entries(result1).forEach(([type, percentage]) => {
    console.log(`  ${type}: ${(percentage * 100).toFixed(2)}%`);
  });
  console.log('');

  // Test 2: Two asset types
  console.log('Test 2: Simple allocation with two asset types');
  const result2 = calculateAllocation(mockAssetsSmall);
  console.log('Input:', mockAssetsSmall);
  console.log('Output:', result2);
  console.log('Percentages:');
  Object.entries(result2).forEach(([type, percentage]) => {
    console.log(`  ${type}: ${(percentage * 100).toFixed(2)}%`);
  });
  console.log('');

  // Test 3: Empty array
  console.log('Test 3: Empty asset array');
  const result3 = calculateAllocation(mockAssetsEmpty);
  console.log('Input:', mockAssetsEmpty);
  console.log('Output:', result3);
  console.log('');

  // Test 4: Same type, multiple entries
  console.log('Test 4: Multiple entries of same asset type');
  const result4 = calculateAllocation(mockAssetsSingleType);
  console.log('Input:', mockAssetsSingleType);
  console.log('Output:', result4);
  console.log('Percentages:');
  Object.entries(result4).forEach(([type, percentage]) => {
    console.log(`  ${type}: ${(percentage * 100).toFixed(2)}%`);
  });
  console.log('');

  console.log('=== All tests completed ===');
};
