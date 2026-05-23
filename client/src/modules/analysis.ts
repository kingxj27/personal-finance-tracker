/**
 * Asset allocation analysis module
 * Calculates allocation percentages based on asset types and values
 */

export interface Asset {
  type: string;
  value: number;
}

export interface AllocationResult {
  [assetType: string]: number; // Percentage as decimal (e.g., 0.5 for 50%)
}

/**
 * Calculates asset allocation percentages
 * @param assets - Array of assets with type and value
 * @returns Object with asset types as keys and allocation percentages as values
 */
export const calculateAllocation = (assets: Asset[]): AllocationResult => {
  if (assets.length === 0) {
    return {};
  }

  // Calculate total value
  const total = assets.reduce((sum, asset) => sum + asset.value, 0);

  // Handle zero total
  if (total === 0) {
    return {};
  }

  // Group assets by type and sum their values
  const grouped: Record<string, number> = {};

  assets.forEach((asset) => {
    grouped[asset.type] = (grouped[asset.type] || 0) + asset.value;
  });

  // Convert to percentages
  Object.keys(grouped).forEach((key) => {
    grouped[key] = grouped[key] / total;
  });

  return grouped;
};
