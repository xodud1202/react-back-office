import React from 'react';
import type { CategoryOption, CategoryRow } from '@/components/goods/types';

interface GoodsCategorySectionProps {
  categoryRows: CategoryRow[];
  categoryLevel1Options: CategoryOption[];
  categoryLoading: boolean;
  onAddRow: () => void;
  onLevel1Change: (rowKey: string, value: string) => void;
  onLevel2Change: (rowKey: string, value: string) => void;
  onLevel3Change: (rowKey: string, value: string) => void;
  onSaveRow: (rowKey: string) => void;
  onDeleteRow: (rowKey: string) => void;
}

// 카테고리 설정 영역을 렌더링합니다.
const GoodsCategorySection = ({
  categoryRows,
  categoryLevel1Options,
  categoryLoading,
  onAddRow,
  onLevel1Change,
  onLevel2Change,
  onLevel3Change,
  onSaveRow,
  onDeleteRow,
}: GoodsCategorySectionProps) => (
  <div className="mt-4">
    <div className="d-flex align-items-center justify-content-between mb-2">
      <h5 className="mb-0">카테고리</h5>
      <button type="button" className="btn btn-sm btn-secondary" onClick={onAddRow}>
        추가
      </button>
    </div>
    {categoryLoading ? (
      <div className="text-center">카테고리 로딩중...</div>
    ) : (
      <div className="d-flex flex-column gap-2">
        {categoryRows.length === 0 ? (
          <div className="text-muted">등록된 카테고리가 없습니다.</div>
        ) : (
          categoryRows.map((row) => (
            <div key={row.rowKey} className="row">
              <div className="col-md-3">
                <select
                  className="form-select"
                  value={row.level1Id}
                  onChange={(e) => onLevel1Change(row.rowKey, e.target.value)}
                >
                  <option value="">1차 카테고리</option>
                  {categoryLevel1Options.map((item) => (
                    <option key={item.categoryId} value={item.categoryId}>{item.categoryNm}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-3">
                <select
                  className="form-select"
                  value={row.level2Id}
                  onChange={(e) => onLevel2Change(row.rowKey, e.target.value)}
                  disabled={row.level2Disabled}
                >
                  <option value="">2차 카테고리</option>
                  {row.level2Options.map((item) => (
                    <option key={item.categoryId} value={item.categoryId}>{item.categoryNm}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-3">
                <select
                  className="form-select"
                  value={row.level3Id}
                  onChange={(e) => onLevel3Change(row.rowKey, e.target.value)}
                  disabled={row.level3Disabled}
                >
                  <option value="">3차 카테고리</option>
                  {row.level3Options.map((item) => (
                    <option key={item.categoryId} value={item.categoryId}>{item.categoryNm}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-3 d-flex gap-2">
                <button type="button" className="btn btn-sm btn-primary" onClick={() => onSaveRow(row.rowKey)}>
                  저장
                </button>
                <button type="button" className="btn btn-sm btn-danger" onClick={() => onDeleteRow(row.rowKey)}>
                  삭제
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    )}
  </div>
);

export default GoodsCategorySection;
