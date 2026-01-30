import React from 'react';
import type { CellEditingStoppedEvent, CellFocusedEvent, CellValueChangedEvent, ColDef, RowDragEndEvent } from 'ag-grid-community';
import Modal from '@/components/common/Modal';
import type { CategoryOption, CategoryRow, CommonCode, GoodsDetail, GoodsMerch, GoodsSizeRow } from '@/components/goods/types';
import GoodsCategorySection from '@/components/goods/GoodsCategorySection';
import GoodsSizeGrid from '@/components/goods/GoodsSizeGrid';

interface GoodsEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  editLoading: boolean;
  editSaving: boolean;
  editForm: GoodsDetail | null;
  goodsStatList: CommonCode[];
  goodsDivList: CommonCode[];
  goodsMerchList: GoodsMerch[];
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onEditChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onEditNumberChange: (field: keyof GoodsDetail) => (e: React.ChangeEvent<HTMLInputElement>) => void;
  onEditNumberBlur: (field: keyof GoodsDetail) => () => void;
  formatNumber: (value: number | string | null | undefined) => string;
  categoryRows: CategoryRow[];
  categoryLevel1Options: CategoryOption[];
  categoryLoading: boolean;
  onAddCategoryRow: () => void;
  onCategoryLevel1Change: (rowKey: string, value: string) => void;
  onCategoryLevel2Change: (rowKey: string, value: string) => void;
  onCategoryLevel3Change: (rowKey: string, value: string) => void;
  onSaveCategoryRow: (rowKey: string) => void;
  onDeleteCategoryRow: (rowKey: string) => void;
  goodsSizeRows: GoodsSizeRow[];
  goodsSizeLoading: boolean;
  sizeColumnDefs: ColDef<GoodsSizeRow>[];
  defaultColDef: ColDef;
  onAddGoodsSizeRow: () => void;
  onSizeRowDragEnd: (event: RowDragEndEvent<GoodsSizeRow>) => void;
  onSizeCellValueChanged: (event: CellValueChangedEvent<GoodsSizeRow>) => void;
  onSizeCellEditingStopped: (event: CellEditingStoppedEvent<GoodsSizeRow>) => void;
  onSizeCellFocused: (event: CellFocusedEvent) => void;
}

// 상품 수정 레이어 팝업을 렌더링합니다.
const GoodsEditModal = ({
  isOpen,
  onClose,
  editLoading,
  editSaving,
  editForm,
  goodsStatList,
  goodsDivList,
  goodsMerchList,
  onSubmit,
  onEditChange,
  onEditNumberChange,
  onEditNumberBlur,
  formatNumber,
  categoryRows,
  categoryLevel1Options,
  categoryLoading,
  onAddCategoryRow,
  onCategoryLevel1Change,
  onCategoryLevel2Change,
  onCategoryLevel3Change,
  onSaveCategoryRow,
  onDeleteCategoryRow,
  goodsSizeRows,
  goodsSizeLoading,
  sizeColumnDefs,
  defaultColDef,
  onAddGoodsSizeRow,
  onSizeRowDragEnd,
  onSizeCellValueChanged,
  onSizeCellEditingStopped,
  onSizeCellFocused,
}: GoodsEditModalProps) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    title="상품정보 수정"
    width="80vw"
    footerActions={(
      <button
        type="submit"
        form="goods-edit-form"
        className="btn btn-primary"
        disabled={editSaving || editLoading || !editForm}
      >
        {editSaving ? '저장중...' : '저장'}
      </button>
    )}
  >
    {editLoading || !editForm ? (
      <div className="text-center">로딩중...</div>
    ) : (
      <>
        <form id="goods-edit-form" onSubmit={onSubmit} className="forms-sample">
          <div className="row">
            <div className="col-md-4">
              <div className="form-group">
                <label>상품코드</label>
                <input name="goodsId" type="text" className="form-control" value={editForm.goodsId || ''} disabled />
              </div>
            </div>
            <div className="col-md-4">
              <div className="form-group">
                <label>ERP 품번코드</label>
                <input name="erpStyleCd" type="text" className="form-control" value={editForm.erpStyleCd || ''} onChange={onEditChange} disabled />
              </div>
            </div>
            <div className="col-md-4">
              <div className="form-group">
                <label>상품그룹코드 <span className="text-danger">*</span></label>
                <input name="goodsGroupId" type="text" className="form-control" value={editForm.goodsGroupId || ''} onChange={onEditChange} required />
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-md-12">
              <div className="form-group">
                <label>상품명 <span className="text-danger">*</span></label>
                <input name="goodsNm" type="text" className="form-control" value={editForm.goodsNm || ''} onChange={onEditChange} required />
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-md-3">
              <div className="form-group">
                <label>상품분류 <span className="text-danger">*</span></label>
                <select name="goodsMerchId" className="form-select" value={editForm.goodsMerchId || ''} onChange={onEditChange} required>
                  <option value="">선택</option>
                  {goodsMerchList.map((item) => (
                    <option key={item.goodsMerchId} value={item.goodsMerchId}>{item.goodsMerchNm}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="col-md-3">
              <div className="form-group">
                <label>상품구분 <span className="text-danger">*</span></label>
                <select name="goodsDivCd" className="form-select" value={editForm.goodsDivCd || ''} onChange={onEditChange} required>
                  <option value="">선택</option>
                  {goodsDivList.map((item) => (
                    <option key={item.cd} value={item.cd}>{item.cdNm}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="col-md-3">
              <div className="form-group">
                <label>상품상태 <span className="text-danger">*</span></label>
                <select name="goodsStatCd" className="form-select" value={editForm.goodsStatCd || ''} onChange={onEditChange} required>
                  <option value="">선택</option>
                  {goodsStatList.map((item) => (
                    <option key={item.cd} value={item.cd}>{item.cdNm}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="col-md-3">
              <div className="form-group">
                <label>노출여부 <span className="text-danger">*</span></label>
                <select name="showYn" className="form-select" value={editForm.showYn || ''} onChange={onEditChange} required>
                  <option value="">선택</option>
                  <option value="Y">Y</option>
                  <option value="N">N</option>
                </select>
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-md-4">
              <div className="form-group">
                <label>공급가 <span className="text-danger">*</span></label>
                <input
                  name="supplyAmt"
                  type="text"
                  className="form-control"
                  value={formatNumber(editForm.supplyAmt ?? '')}
                  onChange={onEditNumberChange('supplyAmt')}
                  onBlur={onEditNumberBlur('supplyAmt')}
                  required
                />
              </div>
            </div>
            <div className="col-md-4">
              <div className="form-group">
                <label>판매가 <span className="text-danger">*</span></label>
                <input
                  name="saleAmt"
                  type="text"
                  className="form-control"
                  value={formatNumber(editForm.saleAmt ?? '')}
                  onChange={onEditNumberChange('saleAmt')}
                  onBlur={onEditNumberBlur('saleAmt')}
                  required
                />
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-md-3">
              <div className="form-group">
                <label>ERP 공급가</label>
                <input
                  name="erpSupplyAmt"
                  type="text"
                  className="form-control"
                  value={formatNumber(editForm.erpSupplyAmt ?? '')}
                  onChange={onEditNumberChange('erpSupplyAmt')}
                  disabled
                />
              </div>
            </div>
            <div className="col-md-3">
              <div className="form-group">
                <label>ERP 원가</label>
                <input
                  name="erpCostAmt"
                  type="text"
                  className="form-control"
                  value={formatNumber(editForm.erpCostAmt ?? '')}
                  onChange={onEditNumberChange('erpCostAmt')}
                  disabled
                />
              </div>
            </div>
            <div className="col-md-3">
              <div className="form-group">
                <label>ERP 컬러코드</label>
                <input name="erpColorCd" type="text" className="form-control" value={editForm.erpColorCd || ''} onChange={onEditChange} disabled />
              </div>
            </div>
            <div className="col-md-3">
              <div className="form-group">
                <label>ERP 상품구분코드</label>
                <input name="erpMerchCd" type="text" className="form-control" value={editForm.erpMerchCd || ''} onChange={onEditChange} disabled />
              </div>
            </div>
          </div>
        </form>

        <GoodsCategorySection
          categoryRows={categoryRows}
          categoryLevel1Options={categoryLevel1Options}
          categoryLoading={categoryLoading}
          onAddRow={onAddCategoryRow}
          onLevel1Change={onCategoryLevel1Change}
          onLevel2Change={onCategoryLevel2Change}
          onLevel3Change={onCategoryLevel3Change}
          onSaveRow={onSaveCategoryRow}
          onDeleteRow={onDeleteCategoryRow}
        />

        <GoodsSizeGrid
          goodsSizeRows={goodsSizeRows}
          goodsSizeLoading={goodsSizeLoading}
          sizeColumnDefs={sizeColumnDefs}
          defaultColDef={defaultColDef}
          onAddRow={onAddGoodsSizeRow}
          onRowDragEnd={onSizeRowDragEnd}
          onCellValueChanged={onSizeCellValueChanged}
          onCellEditingStopped={onSizeCellEditingStopped}
          onCellFocused={onSizeCellFocused}
        />
      </>
    )}
  </Modal>
);

export default GoodsEditModal;
