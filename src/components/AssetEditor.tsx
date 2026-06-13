/**
 * AssetEditor.tsx
 * Allows editing asset value categories (C_j) interactively.
 */

import React from 'react';
import type { Asset, ModelOverrides } from '../model/types';
import { ASSET_VALUE_MAP } from '../model/types';

interface Props {
  assets: Asset[];
  overrides: ModelOverrides;
  onOverrideChange: (next: ModelOverrides) => void;
}

export const AssetEditor: React.FC<Props> = ({ assets, overrides, onOverrideChange }) => {
  const handleChange = (assetId: string, val: string) => {
    const cat = val as Asset['valueCategory'];
    if (cat in ASSET_VALUE_MAP) {
      onOverrideChange({
        ...overrides,
        assetValueOverrides: { ...overrides.assetValueOverrides, [assetId]: cat },
      });
    }
  };

  return (
    <div className="card">
      <div className="card-title">Asset-Wertbeiträge (C_j) – L1+</div>
      <table style={{ fontSize: 12 }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Typ</th>
            <th>Wertkategorie</th>
            <th>C_j</th>
          </tr>
        </thead>
        <tbody>
          {assets.map((asset) => {
            const currentCat =
              overrides.assetValueOverrides[asset.id] !== undefined
                ? overrides.assetValueOverrides[asset.id]
                : asset.valueCategory;
            const currentCj = ASSET_VALUE_MAP[currentCat];
            return (
              <tr key={asset.id}>
                <td>{asset.id}</td>
                <td>{asset.name}</td>
                <td>{asset.type}</td>
                <td>
                  <select
                    value={currentCat}
                    onChange={(e) => handleChange(asset.id, e.target.value)}
                  >
                    {Object.keys(ASSET_VALUE_MAP).map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </td>
                <td><strong>{currentCj.toFixed(1)}</strong></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
