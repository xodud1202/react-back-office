import React, { useCallback, useEffect } from 'react';
import api from '@/utils/axios/axios';
import { getLoginUsrNo } from '@/utils/auth';
import type { CategoryOption, CategoryRow, GoodsCategoryApi } from '@/components/goods/types';

interface GoodsCategorySectionProps {
  goodsId: string | null;
  isOpen: boolean;
  categoryRows: CategoryRow[];
  categoryLevel1Options: CategoryOption[];
  categoryLoading: boolean;
  setCategoryRows: React.Dispatch<React.SetStateAction<CategoryRow[]>>;
  setCategoryLevel1Options: React.Dispatch<React.SetStateAction<CategoryOption[]>>;
  setCategoryLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

// 카테고리 설정 영역을 렌더링합니다.
const GoodsCategorySection = ({
  goodsId,
  isOpen,
  categoryRows,
  categoryLevel1Options,
  categoryLoading,
  setCategoryRows,
  setCategoryLevel1Options,
  setCategoryLoading,
}: GoodsCategorySectionProps) => {
  // 카테고리 목록을 조회합니다.
  const fetchCategoryList = useCallback(async (categoryLevel: number, parentCategoryId?: string) => {
    const response = await api.get('/api/admin/category/list', {
      params: {
        categoryLevel,
        parentCategoryId,
      },
    });
    return (response.data || []) as CategoryOption[];
  }, []);

  // 상품 카테고리 목록을 조회합니다.
  const fetchGoodsCategoryList = useCallback(async (targetGoodsId: string) => {
    setCategoryLoading(true);
    try {
      const response = await api.get('/api/admin/goods/category/list', { params: { goodsId: targetGoodsId } });
      const data = (response.data || []) as GoodsCategoryApi[];
      if (data.length === 0) {
        setCategoryRows([]);
        return;
      }
      const rows = await Promise.all(data.map(async (item) => {
        const level1Id = item.level1Id ?? '';
        const level2Id = item.level2Id ?? '';
        const level3Id = item.level3Id ?? '';
        const level2Options = level1Id ? await fetchCategoryList(2, level1Id) : [];
        const level2Disabled = level2Options.length === 0;
        const normalizedLevel2Id = level2Disabled ? '' : level2Id;
        const level3Options = normalizedLevel2Id ? await fetchCategoryList(3, normalizedLevel2Id) : [];
        const level3Disabled = level3Options.length === 0;
        const normalizedLevel3Id = level3Disabled ? '' : level3Id;
        return {
          rowKey: `${item.categoryId}-${item.dispOrd}`,
          level1Id,
          level2Id: normalizedLevel2Id,
          level3Id: normalizedLevel3Id,
          level2Options,
          level3Options,
          level2Disabled,
          level3Disabled,
          originCategoryId: item.categoryId,
        } as CategoryRow;
      }));
      setCategoryRows(rows);
    } catch (e) {
      console.error('카테고리 목록을 불러오는 데 실패했습니다.');
      alert('카테고리 목록을 불러오는 데 실패했습니다.');
    } finally {
      setCategoryLoading(false);
    }
  }, [fetchCategoryList, setCategoryLoading, setCategoryRows]);

  // 카테고리 행을 추가합니다.
  const handleAddCategoryRow = useCallback(() => {
    setCategoryRows((prev) => ([
      ...prev,
      {
        rowKey: `CAT-${Date.now()}-${prev.length}`,
        level1Id: '',
        level2Id: '',
        level3Id: '',
        level2Options: [],
        level3Options: [],
        level2Disabled: true,
        level3Disabled: true,
        originCategoryId: '',
      },
    ]));
  }, [setCategoryRows]);

  // 1차 카테고리를 변경합니다.
  const handleCategoryLevel1Change = useCallback(async (rowKey: string, value: string) => {
    try {
      const level2Options = value ? await fetchCategoryList(2, value) : [];
      const level2Disabled = level2Options.length === 0;
      setCategoryRows((prev) => prev.map((row) => {
        if (row.rowKey !== rowKey) {
          return row;
        }
        return {
          ...row,
          level1Id: value,
          level2Id: '',
          level3Id: '',
          level2Options,
          level3Options: [],
          level2Disabled,
          level3Disabled: true,
        };
      }));
    } catch (e) {
      console.error('하위 카테고리 조회에 실패했습니다.');
      alert('하위 카테고리 조회에 실패했습니다.');
    }
  }, [fetchCategoryList, setCategoryRows]);

  // 2차 카테고리를 변경합니다.
  const handleCategoryLevel2Change = useCallback(async (rowKey: string, value: string) => {
    try {
      const level3Options = value ? await fetchCategoryList(3, value) : [];
      const level3Disabled = level3Options.length === 0;
      setCategoryRows((prev) => prev.map((row) => {
        if (row.rowKey !== rowKey) {
          return row;
        }
        return {
          ...row,
          level2Id: value,
          level3Id: '',
          level3Options,
          level3Disabled,
        };
      }));
    } catch (e) {
      console.error('하위 카테고리 조회에 실패했습니다.');
      alert('하위 카테고리 조회에 실패했습니다.');
    }
  }, [fetchCategoryList, setCategoryRows]);

  // 3차 카테고리를 변경합니다.
  const handleCategoryLevel3Change = useCallback((rowKey: string, value: string) => {
    setCategoryRows((prev) => prev.map((row) => (row.rowKey === rowKey ? { ...row, level3Id: value } : row)));
  }, [setCategoryRows]);

  // 카테고리 행을 저장합니다.
  const handleSaveCategoryRow = useCallback(async (rowKey: string) => {
    const row = categoryRows.find((item) => item.rowKey === rowKey);
    if (!row) {
      return;
    }
    if (!row.level1Id) {
      alert('카테고리를 선택해주세요.');
      return;
    }
    if (row.level2Options.length > 0 && !row.level2Id) {
      alert('카테고리를 선택해주세요.');
      return;
    }
    if (row.level3Options.length > 0 && !row.level3Id) {
      alert('카테고리를 선택해주세요.');
      return;
    }
    const categoryId = row.level3Id || row.level2Id || row.level1Id;
    if (!categoryId) {
      alert('카테고리를 선택해주세요.');
      return;
    }
    if (!goodsId) {
      alert('상품코드를 확인해주세요.');
      return;
    }
    const loginUsrNo = getLoginUsrNo();
    if (!loginUsrNo) {
      alert('로그인 정보를 확인할 수 없습니다.');
      return;
    }
    try {
      await api.post('/api/admin/goods/category/save', {
        goodsId,
        categoryId,
        originCategoryId: row.originCategoryId || null,
        dispOrd: categoryRows.findIndex((item) => item.rowKey === rowKey) + 1,
        regNo: loginUsrNo,
        udtNo: loginUsrNo,
      });
      alert('카테고리가 저장되었습니다.');
      setCategoryRows((prev) => prev.map((item) => (item.rowKey === rowKey ? { ...item, originCategoryId: categoryId } : item)));
    } catch (e: any) {
      console.error('카테고리 저장에 실패했습니다.');
      const message = e?.response?.data?.message;
      alert(message || '카테고리 저장에 실패했습니다.');
    }
  }, [categoryRows, goodsId, setCategoryRows]);

  // 카테고리 행을 삭제합니다.
  const handleDeleteCategoryRow = useCallback(async (rowKey: string) => {
    const row = categoryRows.find((item) => item.rowKey === rowKey);
    if (!row) {
      return;
    }
    if (!row.originCategoryId) {
      setCategoryRows((prev) => prev.filter((item) => item.rowKey !== rowKey));
      return;
    }
    if (!goodsId) {
      alert('상품코드를 확인해주세요.');
      return;
    }
    const loginUsrNo = getLoginUsrNo();
    if (!loginUsrNo) {
      alert('로그인 정보를 확인할 수 없습니다.');
      return;
    }
    try {
      await api.post('/api/admin/goods/category/delete', {
        goodsId,
        categoryId: row.originCategoryId,
        udtNo: loginUsrNo,
      });
      alert('카테고리가 삭제되었습니다.');
      setCategoryRows((prev) => prev.filter((item) => item.rowKey !== rowKey));
    } catch (e: any) {
      console.error('카테고리 삭제에 실패했습니다.');
      const message = e?.response?.data?.message;
      alert(message || '카테고리 삭제에 실패했습니다.');
    }
  }, [categoryRows, goodsId, setCategoryRows]);

  // 상품 코드가 변경될 때 카테고리 정보를 불러옵니다.
  useEffect(() => {
    if (!isOpen || !goodsId) {
      return;
    }
    if (categoryLevel1Options.length === 0) {
      fetchCategoryList(1)
        .then((data) => setCategoryLevel1Options(data || []))
        .catch(() => {
          console.error('카테고리 목록을 불러오는 데 실패했습니다.');
          alert('카테고리 목록을 불러오는 데 실패했습니다.');
        });
    }
    fetchGoodsCategoryList(goodsId);
  }, [categoryLevel1Options.length, fetchCategoryList, fetchGoodsCategoryList, goodsId, isOpen, setCategoryLevel1Options]);

  return (
    <div className="mt-4">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <h5 className="mb-0">카테고리</h5>
        <button type="button" className="btn btn-sm btn-secondary" onClick={handleAddCategoryRow}>
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
                    onChange={(e) => handleCategoryLevel1Change(row.rowKey, e.target.value)}
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
                    onChange={(e) => handleCategoryLevel2Change(row.rowKey, e.target.value)}
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
                    onChange={(e) => handleCategoryLevel3Change(row.rowKey, e.target.value)}
                    disabled={row.level3Disabled}
                  >
                    <option value="">3차 카테고리</option>
                    {row.level3Options.map((item) => (
                      <option key={item.categoryId} value={item.categoryId}>{item.categoryNm}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-3 d-flex gap-2">
                  <button type="button" className="btn btn-sm btn-primary" onClick={() => handleSaveCategoryRow(row.rowKey)}>
                    저장
                  </button>
                  <button type="button" className="btn btn-sm btn-danger" onClick={() => handleDeleteCategoryRow(row.rowKey)}>
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
};

export default GoodsCategorySection;
