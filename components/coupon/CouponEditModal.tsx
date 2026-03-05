import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import api from '@/utils/axios/axios';
import { requireLoginUsrNo } from '@/utils/auth';
import Modal from '@/components/common/Modal';
import GoodsSelectorModal from '@/components/common/selector/GoodsSelectorModal';
import CouponTargetGrid from '@/components/coupon/CouponTargetGrid';
import ExhibitionSelectorModal from '@/components/common/selector/ExhibitionSelectorModal';
import CategorySelectorModal from '@/components/common/selector/CategorySelectorModal';
import type {
  CouponDetail,
  CouponSavePayload,
  CouponSaveResponse,
  CouponTargetExcelParseResponse,
  CouponTargetListResponse,
  CouponTargetRow,
} from '@/components/coupon/types';
import { COUPON_TARGET_CODE, COUPON_USE_DT_GB_CODE } from '@/components/coupon/types';
import type { BrandOption, CategoryOption, CommonCode, GoodsData, GoodsMerch } from '@/components/goods/types';
import type { ExhibitionItem } from '@/components/exhibition/types';

interface CouponEditModalProps {
  // 모달 오픈 여부입니다.
  isOpen: boolean;
  // 모달 모드입니다.
  mode: 'CREATE' | 'EDIT';
  // 수정 대상 쿠폰 번호입니다.
  cpnNo?: number | null;
  // 쿠폰 상태 코드 목록입니다.
  cpnStatList: CommonCode[];
  // 쿠폰 종류 코드 목록입니다.
  cpnGbList: CommonCode[];
  // 쿠폰 타겟 코드 목록입니다.
  cpnTargetList: CommonCode[];
  // 쿠폰 사용기간 코드 목록입니다.
  cpnUseDtList: CommonCode[];
  // 상품 상태 코드 목록입니다.
  goodsStatList: CommonCode[];
  // 상품 구분 코드 목록입니다.
  goodsDivList: CommonCode[];
  // 상품 분류 목록입니다.
  goodsMerchList: GoodsMerch[];
  // 브랜드 목록입니다.
  brandList: BrandOption[];
  // 카테고리 옵션 목록입니다.
  categoryOptions: CategoryOption[];
  // 모달 닫기 함수입니다.
  onClose: () => void;
  // 저장 완료 함수입니다.
  onSaved: (nextCouponNo?: number | null) => void;
}

interface CouponFormState {
  // 쿠폰 번호입니다.
  cpnNo?: number;
  // 쿠폰명입니다.
  cpnNm: string;
  // 쿠폰 상태 코드입니다.
  cpnStatCd: string;
  // 쿠폰 종류 코드입니다.
  cpnGbCd: string;
  // 쿠폰 타겟 코드입니다.
  cpnTargetCd: string;
  // 다운로드 가능 시작일입니다.
  cpnDownStartDate: string;
  // 다운로드 가능 시작시입니다.
  cpnDownStartHour: string;
  // 다운로드 가능 종료일입니다.
  cpnDownEndDate: string;
  // 다운로드 가능 종료시입니다.
  cpnDownEndHour: string;
  // 사용기간 구분 코드입니다.
  cpnUseDtGb: string;
  // 다운로드 후 사용 가능 일수입니다.
  cpnUsableDt: string;
  // 사용가능 시작일입니다.
  cpnUseStartDate: string;
  // 사용가능 시작시입니다.
  cpnUseStartHour: string;
  // 사용가능 종료일입니다.
  cpnUseEndDate: string;
  // 사용가능 종료시입니다.
  cpnUseEndHour: string;
  // 다운로드 가능 여부입니다.
  cpnDownAbleYn: string;
  // 상태 중지일입니다.
  statStopDate: string;
  // 상태 중지시입니다.
  statStopHour: string;
}

interface DateHourInputProps {
  // 라벨입니다.
  label: string;
  // 날짜값입니다.
  dateValue: string;
  // 시값입니다.
  hourValue: string;
  // 시 선택 옵션입니다.
  hourOptions: string[];
  // 날짜 변경 함수입니다.
  onChangeDate: (value: string) => void;
  // 시 변경 함수입니다.
  onChangeHour: (value: string) => void;
}

// 날짜/시 입력 컴포넌트를 렌더링합니다.
const DateHourInput = ({
  label,
  dateValue,
  hourValue,
  hourOptions,
  onChangeDate,
  onChangeHour,
}: DateHourInputProps) => (
  <div className="form-group">
    <label>{label}</label>
    <div className="d-flex gap-2">
      <input type="date" className="form-control" value={dateValue} onChange={(event) => onChangeDate(event.target.value)} />
      <select className="form-select w-auto" value={hourValue} onChange={(event) => onChangeHour(event.target.value)}>
        {hourOptions.map((item) => (
          <option key={`${label}-${item}`} value={item}>{item}시</option>
        ))}
      </select>
    </div>
  </div>
);

// 쿠폰 등록/수정 레이어팝업을 렌더링합니다.
const CouponEditModal = ({
  isOpen,
  mode,
  cpnNo,
  cpnStatList,
  cpnGbList,
  cpnTargetList,
  cpnUseDtList,
  goodsStatList,
  goodsDivList,
  goodsMerchList,
  brandList,
  categoryOptions,
  onClose,
  onSaved,
}: CouponEditModalProps) => {
  const hourOptions = useMemo(() => Array.from({ length: 25 }, (_, index) => String(index).padStart(2, '0')), []);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'INFO' | 'TARGET'>('INFO');
  const [cpnUseDtOptionList, setCpnUseDtOptionList] = useState<CommonCode[]>(cpnUseDtList);
  const [form, setForm] = useState<CouponFormState>({
    cpnNm: '',
    cpnStatCd: '',
    cpnGbCd: '',
    cpnTargetCd: COUPON_TARGET_CODE.ALL,
    cpnDownStartDate: '',
    cpnDownStartHour: '00',
    cpnDownEndDate: '',
    cpnDownEndHour: '24',
    cpnUseDtGb: COUPON_USE_DT_GB_CODE.PERIOD,
    cpnUsableDt: '',
    cpnUseStartDate: '',
    cpnUseStartHour: '00',
    cpnUseEndDate: '',
    cpnUseEndHour: '24',
    cpnDownAbleYn: 'Y',
    statStopDate: '',
    statStopHour: '24',
  });
  const [applyRows, setApplyRows] = useState<CouponTargetRow[]>([]);
  const [excludeRows, setExcludeRows] = useState<CouponTargetRow[]>([]);
  const [targetSnapshotMap, setTargetSnapshotMap] = useState<Record<string, CouponTargetRow[]>>({});
  const [applySelectedKeys, setApplySelectedKeys] = useState<string[]>([]);
  const [excludeSelectedKeys, setExcludeSelectedKeys] = useState<string[]>([]);
  const [goodsModalType, setGoodsModalType] = useState<'APPLY' | 'EXCLUDE'>('APPLY');
  const [isGoodsSearchOpen, setIsGoodsSearchOpen] = useState(false);
  const [isExhibitionSearchOpen, setIsExhibitionSearchOpen] = useState(false);
  const [isCategorySearchOpen, setIsCategorySearchOpen] = useState(false);
  const applyExcelInputRef = useRef<HTMLInputElement | null>(null);
  const excludeExcelInputRef = useRef<HTMLInputElement | null>(null);
  const isEditMode = mode === 'EDIT' && Boolean(cpnNo);
  const resolvedCpnUseDtOptionList = useMemo<CommonCode[]>(() => {
    if (cpnUseDtOptionList.length > 0) {
      return cpnUseDtOptionList;
    }
    // 코드 조회 실패 환경에서도 기본 라디오를 노출하기 위한 최소 옵션입니다.
    return [
      { grpCd: 'CPN_USE_DT', cd: COUPON_USE_DT_GB_CODE.PERIOD, cdNm: '기간', dispOrd: 1 },
      { grpCd: 'CPN_USE_DT', cd: COUPON_USE_DT_GB_CODE.DATETIME, cdNm: '일시', dispOrd: 2 },
    ];
  }, [cpnUseDtOptionList]);

  // 기본 폼 상태를 생성합니다.
  const buildDefaultForm = useCallback((): CouponFormState => ({
    cpnNm: '',
    cpnStatCd: cpnStatList[0]?.cd || '',
    cpnGbCd: cpnGbList[0]?.cd || '',
    cpnTargetCd: cpnTargetList.find((item) => item.cd === COUPON_TARGET_CODE.ALL)?.cd || cpnTargetList[0]?.cd || COUPON_TARGET_CODE.ALL,
    cpnDownStartDate: '',
    cpnDownStartHour: '00',
    cpnDownEndDate: '',
    cpnDownEndHour: '24',
    cpnUseDtGb: resolvedCpnUseDtOptionList.find((item) => item.cd === COUPON_USE_DT_GB_CODE.PERIOD)?.cd || resolvedCpnUseDtOptionList[0]?.cd || COUPON_USE_DT_GB_CODE.PERIOD,
    cpnUsableDt: '',
    cpnUseStartDate: '',
    cpnUseStartHour: '00',
    cpnUseEndDate: '',
    cpnUseEndHour: '24',
    cpnDownAbleYn: 'Y',
    statStopDate: '',
    statStopHour: '24',
  }), [cpnGbList, cpnStatList, cpnTargetList, resolvedCpnUseDtOptionList]);

  // 일시에서 날짜를 추출합니다.
  const getInputDate = useCallback((value?: string | null) => (value ? value.replace('T', ' ').slice(0, 10) : ''), []);

  // 일시에서 시값을 추출합니다.
  const getInputHour = useCallback((value?: string | null, isEnd = false) => {
    if (!value) {
      return isEnd ? '24' : '00';
    }
    const normalized = value.replace('T', ' ');
    const hour = normalized.slice(11, 13);
    const minute = normalized.slice(14, 16);
    const second = normalized.slice(17, 19);
    if (hour === '23' && minute === '59' && (second === '59' || second === '')) {
      return '24';
    }
    return /^\d{2}$/.test(hour) ? hour : (isEnd ? '24' : '00');
  }, []);

  // 날짜/시를 API 일시 문자열로 변환합니다.
  const toApiDateTime = useCallback((date: string, hour: string, isEnd = false) => {
    if (!date) {
      return '';
    }
    return hour === '24' || (!hour && isEnd) ? `${date} 23:59:59` : `${date} ${hour || '00'}:00:00`;
  }, []);

  // 대상 목록을 중복 제거 병합합니다.
  const mergeTargetRows = useCallback((baseRows: CouponTargetRow[], appendedRows: CouponTargetRow[]) => {
    const dedupMap = new Map<string, CouponTargetRow>();
    baseRows.forEach((item) => dedupMap.set(String(item.targetValue || '').trim(), item));
    let addedCount = 0;
    appendedRows.forEach((item) => {
      const key = String(item.targetValue || '').trim();
      if (!key || dedupMap.has(key)) {
        return;
      }
      dedupMap.set(key, item);
      addedCount += 1;
    });
    return { rows: Array.from(dedupMap.values()).filter((item) => String(item.targetValue || '').trim()), addedCount };
  }, []);

  // 선택된 대상을 삭제합니다.
  const removeSelectedRows = useCallback((rows: CouponTargetRow[], selectedKeys: string[]) => {
    const selectedSet = new Set(selectedKeys);
    return rows.filter((item) => !selectedSet.has(String(item.targetValue || '').trim()));
  }, []);

  // 화면 상태를 초기화합니다.
  const resetState = useCallback(() => {
    setLoading(false);
    setSaving(false);
    setActiveTab('INFO');
    setForm(buildDefaultForm());
    setApplyRows([]);
    setExcludeRows([]);
    setTargetSnapshotMap({});
    setApplySelectedKeys([]);
    setExcludeSelectedKeys([]);
  }, [buildDefaultForm]);

  // 쿠폰 상세를 조회합니다.
  const fetchDetail = useCallback(async (targetCouponNo: number) => {
    setLoading(true);
    try {
      const [detailResponse, targetResponse] = await Promise.all([
        api.get('/api/admin/coupon/detail', { params: { cpnNo: targetCouponNo } }),
        api.get('/api/admin/coupon/target/list', { params: { cpnNo: targetCouponNo } }),
      ]);
      const detail = (detailResponse.data || {}) as CouponDetail;
      const targetData = (targetResponse.data || {}) as CouponTargetListResponse;
      const nextForm: CouponFormState = {
        cpnNo: detail.cpnNo,
        cpnNm: detail.cpnNm || '',
        cpnStatCd: detail.cpnStatCd || cpnStatList[0]?.cd || '',
        cpnGbCd: detail.cpnGbCd || cpnGbList[0]?.cd || '',
        cpnTargetCd: detail.cpnTargetCd || COUPON_TARGET_CODE.ALL,
        cpnDownStartDate: getInputDate(detail.cpnDownStartDt),
        cpnDownStartHour: getInputHour(detail.cpnDownStartDt, false),
        cpnDownEndDate: getInputDate(detail.cpnDownEndDt),
        cpnDownEndHour: getInputHour(detail.cpnDownEndDt, true),
        cpnUseDtGb: detail.cpnUseDtGb || COUPON_USE_DT_GB_CODE.PERIOD,
        cpnUsableDt: detail.cpnUsableDt == null ? '' : String(detail.cpnUsableDt),
        cpnUseStartDate: getInputDate(detail.cpnUseStartDt),
        cpnUseStartHour: getInputHour(detail.cpnUseStartDt, false),
        cpnUseEndDate: getInputDate(detail.cpnUseEndDt),
        cpnUseEndHour: getInputHour(detail.cpnUseEndDt, true),
        cpnDownAbleYn: detail.cpnDownAbleYn || 'Y',
        statStopDate: getInputDate(detail.statStopDt),
        statStopHour: getInputHour(detail.statStopDt, true),
      };
      setForm(nextForm);
      setApplyRows(targetData.applyList || []);
      setExcludeRows(targetData.excludeList || []);
      setTargetSnapshotMap({ [nextForm.cpnTargetCd]: targetData.applyList || [] });
    } catch (error: any) {
      alert(error?.response?.data?.message || '쿠폰 상세 조회에 실패했습니다.');
      onClose();
    } finally {
      setLoading(false);
    }
  }, [cpnGbList, cpnStatList, getInputDate, getInputHour, onClose]);

  // 타겟 코드 변경 시 목록을 스냅샷 기반으로 교체합니다.
  const handleChangeTargetCd = useCallback((nextTargetCd: string) => {
    setTargetSnapshotMap((prev) => ({ ...prev, [form.cpnTargetCd]: applyRows }));
    setForm((prev) => ({ ...prev, cpnTargetCd: nextTargetCd }));
    setApplyRows(nextTargetCd === COUPON_TARGET_CODE.ALL ? [] : (targetSnapshotMap[nextTargetCd] || []));
    setApplySelectedKeys([]);
  }, [applyRows, form.cpnTargetCd, targetSnapshotMap]);

  // 저장 요청 본문을 생성합니다.
  const buildPayload = useCallback((usrNo: number): CouponSavePayload => {
    const payload: CouponSavePayload = {
      cpnNo: form.cpnNo,
      cpnNm: form.cpnNm.trim(),
      cpnStatCd: form.cpnStatCd,
      cpnGbCd: form.cpnGbCd,
      cpnTargetCd: form.cpnTargetCd,
      cpnDownStartDt: toApiDateTime(form.cpnDownStartDate, form.cpnDownStartHour, false),
      cpnDownEndDt: toApiDateTime(form.cpnDownEndDate, form.cpnDownEndHour, true),
      cpnUseDtGb: form.cpnUseDtGb,
      cpnDownAbleYn: form.cpnDownAbleYn,
      statStopDt: form.statStopDate ? toApiDateTime(form.statStopDate, form.statStopHour, true) : undefined,
      regNo: mode === 'CREATE' ? usrNo : undefined,
      udtNo: mode === 'EDIT' ? usrNo : undefined,
      applyTargets: applyRows.map((item) => ({ targetValue: String(item.targetValue || '').trim() })).filter((item) => item.targetValue),
      excludeTargets: excludeRows.map((item) => ({ targetValue: String(item.targetValue || '').trim() })).filter((item) => item.targetValue),
    };
    if (form.cpnUseDtGb === COUPON_USE_DT_GB_CODE.PERIOD) {
      payload.cpnUsableDt = Number(form.cpnUsableDt);
    } else {
      payload.cpnUseStartDt = toApiDateTime(form.cpnUseStartDate, form.cpnUseStartHour, false);
      payload.cpnUseEndDt = toApiDateTime(form.cpnUseEndDate, form.cpnUseEndHour, true);
    }
    return payload;
  }, [applyRows, excludeRows, form, mode, toApiDateTime]);

  // 저장 버튼 클릭을 처리합니다.
  const handleSave = useCallback(async () => {
    const usrNo = requireLoginUsrNo();
    if (!usrNo) {
      return;
    }
    if (!form.cpnNm.trim()) {
      alert('쿠폰명을 입력해주세요.');
      return;
    }
    setSaving(true);
    try {
      const response = await api.post('/api/admin/coupon/save', buildPayload(usrNo));
      const data = (response.data || {}) as CouponSaveResponse;
      alert('쿠폰이 저장되었습니다.');
      onSaved(data.cpnNo || form.cpnNo || null);
    } catch (error: any) {
      alert(error?.response?.data?.message || '쿠폰 저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  }, [buildPayload, form.cpnNo, form.cpnNm, onSaved]);

  // 엑셀 템플릿 다운로드를 처리합니다.
  const handleDownloadTemplate = useCallback(async () => {
    try {
      const response = await api.get('/api/admin/coupon/target/excel/download', { responseType: 'blob' });
      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'coupon_target_template.xlsx';
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      alert(error?.response?.data?.message || '엑셀 다운로드에 실패했습니다.');
    }
  }, []);

  // 엑셀 업로드를 처리합니다.
  const handleUploadExcel = useCallback(async (event: React.ChangeEvent<HTMLInputElement>, type: 'APPLY' | 'EXCLUDE') => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post('/api/admin/coupon/target/excel/parse', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      const data = (response.data || {}) as CouponTargetExcelParseResponse;
      if (type === 'APPLY') {
        const merged = mergeTargetRows(applyRows, data.list || []);
        setApplyRows(merged.rows);
        alert(`${merged.addedCount}건 업로드되었습니다.`);
      } else {
        const merged = mergeTargetRows(excludeRows, data.list || []);
        setExcludeRows(merged.rows);
        alert(`${merged.addedCount}건 업로드되었습니다.`);
      }
    } catch (error: any) {
      alert(error?.response?.data?.message || '엑셀 업로드에 실패했습니다.');
    } finally {
      event.target.value = '';
    }
  }, [applyRows, excludeRows, mergeTargetRows]);

  // 상품 선택 결과를 적용/제외 목록에 반영합니다.
  const handleApplyGoods = useCallback((selectedGoods: GoodsData[]) => {
    const mappedRows: CouponTargetRow[] = selectedGoods.map((item) => ({
      targetValue: item.goodsId,
      goodsId: item.goodsId,
      goodsNm: item.goodsNm,
      erpStyleCd: item.erpStyleCd,
      targetNm: `[${item.goodsId}] ${item.goodsNm || ''}`,
    }));
    if (goodsModalType === 'APPLY') {
      setApplyRows(mergeTargetRows(applyRows, mappedRows).rows);
    } else {
      setExcludeRows(mergeTargetRows(excludeRows, mappedRows).rows);
    }
    setIsGoodsSearchOpen(false);
  }, [applyRows, excludeRows, goodsModalType, mergeTargetRows]);

  // 기획전 선택 결과를 반영합니다.
  const handleApplyExhibitions = useCallback((selectedRows: ExhibitionItem[]) => {
    const mappedRows: CouponTargetRow[] = selectedRows.map((item) => ({
      targetValue: String(item.exhibitionNo),
      exhibitionNo: item.exhibitionNo,
      exhibitionNm: item.exhibitionNm,
      targetNm: `[${item.exhibitionNo}] ${item.exhibitionNm || ''}`,
    }));
    setApplyRows(mergeTargetRows(applyRows, mappedRows).rows);
    setIsExhibitionSearchOpen(false);
  }, [applyRows, mergeTargetRows]);

  // 카테고리 선택 결과를 반영합니다.
  const handleApplyCategories = useCallback((selectedRows: CategoryOption[]) => {
    const mappedRows: CouponTargetRow[] = selectedRows.map((item) => ({
      targetValue: item.categoryId,
      categoryId: item.categoryId,
      categoryNm: item.categoryNm,
      categoryLevel: item.categoryLevel,
      targetNm: `[${item.categoryId}] ${item.categoryNm || ''}`,
    }));
    setApplyRows(mergeTargetRows(applyRows, mappedRows).rows);
    setIsCategorySearchOpen(false);
  }, [applyRows, mergeTargetRows]);

  // 대상 탭 타입을 계산합니다.
  const applyGridType = useMemo<'GOODS' | 'EXHIBITION' | 'CATEGORY' | 'EMPTY'>(() => {
    if (form.cpnTargetCd === COUPON_TARGET_CODE.GOODS) return 'GOODS';
    if (form.cpnTargetCd === COUPON_TARGET_CODE.EXHIBITION) return 'EXHIBITION';
    if (form.cpnTargetCd === COUPON_TARGET_CODE.CATEGORY) return 'CATEGORY';
    return 'EMPTY';
  }, [form.cpnTargetCd]);

  // 모달 오픈 상태를 감시해 초기 데이터를 준비합니다.
  useEffect(() => {
    if (!isOpen) {
      return;
    }
    setActiveTab('INFO');
    if (isEditMode && cpnNo) {
      void fetchDetail(cpnNo);
      return;
    }
    resetState();
  }, [cpnNo, fetchDetail, isEditMode, isOpen, resetState]);

  // 등록 모드에서 대상 탭 비활성을 보장합니다.
  useEffect(() => {
    if (!isEditMode && activeTab === 'TARGET') {
      setActiveTab('INFO');
    }
  }, [activeTab, isEditMode]);

  // SSR 공통코드 값을 우선 반영합니다.
  useEffect(() => {
    setCpnUseDtOptionList(cpnUseDtList);
  }, [cpnUseDtList]);

  // 사용기간 코드가 비어있으면 모달 오픈 시 클라이언트에서 재조회합니다.
  useEffect(() => {
    if (!isOpen || cpnUseDtOptionList.length > 0) {
      return;
    }
    const fetchUseDtCodeList = async () => {
      try {
        const response = await api.get('/api/admin/common/code', {
          params: { grpCd: 'CPN_USE_DT' },
        });
        const loadedCodeList = Array.isArray(response.data) ? (response.data as CommonCode[]) : [];
        if (loadedCodeList.length > 0) {
          setCpnUseDtOptionList(loadedCodeList);
        }
      } catch (error) {
        console.error('쿠폰 사용기간 코드 조회에 실패했습니다.', error);
      }
    };
    void fetchUseDtCodeList();
  }, [cpnUseDtOptionList.length, isOpen]);

  // 사용기간 코드가 바뀌면 현재 선택값 유효성을 보정합니다.
  useEffect(() => {
    const isValidUseDtGb = resolvedCpnUseDtOptionList.some((item) => item.cd === form.cpnUseDtGb);
    if (isValidUseDtGb) {
      return;
    }
    setForm((prev) => ({
      ...prev,
      cpnUseDtGb: resolvedCpnUseDtOptionList.find((item) => item.cd === COUPON_USE_DT_GB_CODE.PERIOD)?.cd || resolvedCpnUseDtOptionList[0]?.cd || COUPON_USE_DT_GB_CODE.PERIOD,
    }));
  }, [resolvedCpnUseDtOptionList, form.cpnUseDtGb]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'CREATE' ? '쿠폰 등록' : '쿠폰 수정'}
      width="92vw"
      contentHeight="88vh"
      footerActions={<button type="button" className="btn btn-primary" onClick={handleSave} disabled={loading || saving}>{saving ? '저장중...' : '저장'}</button>}
    >
      <ul className="nav nav-tabs mb-3">
        <li className="nav-item">
          <button type="button" className={`nav-link text-secondary ${activeTab === 'INFO' ? 'active' : ''}`} onClick={() => setActiveTab('INFO')}>쿠폰정보</button>
        </li>
        <li className="nav-item">
          <button type="button" className={`nav-link text-secondary ${activeTab === 'TARGET' ? 'active' : ''}`} onClick={() => setActiveTab('TARGET')} disabled={!isEditMode}>대상</button>
        </li>
      </ul>

      <div style={{ display: activeTab === 'INFO' ? 'block' : 'none' }}>
        <div className="row">
          <div className="col-md-4"><div className="form-group"><label>쿠폰명</label><input type="text" className="form-control" value={form.cpnNm} onChange={(event) => setForm((prev) => ({ ...prev, cpnNm: event.target.value }))} maxLength={100} /></div></div>
          <div className="col-md-2"><div className="form-group"><label>쿠폰 상태</label><select className="form-select" value={form.cpnStatCd} onChange={(event) => setForm((prev) => ({ ...prev, cpnStatCd: event.target.value }))}>{cpnStatList.map((item) => <option key={item.cd} value={item.cd}>{item.cdNm}</option>)}</select></div></div>
          <div className="col-md-2"><div className="form-group"><label>쿠폰 종류</label><select className="form-select" value={form.cpnGbCd} onChange={(event) => setForm((prev) => ({ ...prev, cpnGbCd: event.target.value }))}>{cpnGbList.map((item) => <option key={item.cd} value={item.cd}>{item.cdNm}</option>)}</select></div></div>
          <div className="col-md-2"><div className="form-group"><label>쿠폰 타겟</label><select className="form-select" value={form.cpnTargetCd} onChange={(event) => handleChangeTargetCd(event.target.value)}>{cpnTargetList.map((item) => <option key={item.cd} value={item.cd}>{item.cdNm}</option>)}</select></div></div>
          <div className="col-md-2"><div className="form-group"><label>고객 다운로드 가능</label><select className="form-select" value={form.cpnDownAbleYn} onChange={(event) => setForm((prev) => ({ ...prev, cpnDownAbleYn: event.target.value }))}><option value="Y">Y</option><option value="N">N</option></select></div></div>
        </div>
        <div className="row">
          <div className="col-md-6"><DateHourInput label="다운로드 가능 시작일시" dateValue={form.cpnDownStartDate} hourValue={form.cpnDownStartHour} hourOptions={hourOptions} onChangeDate={(value) => setForm((prev) => ({ ...prev, cpnDownStartDate: value }))} onChangeHour={(value) => setForm((prev) => ({ ...prev, cpnDownStartHour: value }))} /></div>
          <div className="col-md-6"><DateHourInput label="다운로드 가능 종료일시" dateValue={form.cpnDownEndDate} hourValue={form.cpnDownEndHour} hourOptions={hourOptions} onChangeDate={(value) => setForm((prev) => ({ ...prev, cpnDownEndDate: value }))} onChangeHour={(value) => setForm((prev) => ({ ...prev, cpnDownEndHour: value }))} /></div>
        </div>
        <div className="form-group mb-3">
          <label>사용 가능 기간</label>
          <div className="d-flex flex-wrap gap-3 mt-2">
            {resolvedCpnUseDtOptionList.map((item) => <label key={item.cd} className="form-check form-check-inline"><input className="form-check-input" type="radio" value={item.cd} checked={form.cpnUseDtGb === item.cd} onChange={(event) => setForm((prev) => ({ ...prev, cpnUseDtGb: event.target.value }))} /><span className="ms-1">{item.cdNm}</span></label>)}
          </div>
        </div>
        {form.cpnUseDtGb === COUPON_USE_DT_GB_CODE.PERIOD ? (
          <div className="row"><div className="col-md-4"><div className="form-group"><label>다운로드 후 사용 가능 일수</label><input type="number" className="form-control" value={form.cpnUsableDt} onChange={(event) => setForm((prev) => ({ ...prev, cpnUsableDt: event.target.value }))} min={1} /></div></div></div>
        ) : (
          <div className="row">
            <div className="col-md-6"><DateHourInput label="사용 가능 시작일시" dateValue={form.cpnUseStartDate} hourValue={form.cpnUseStartHour} hourOptions={hourOptions} onChangeDate={(value) => setForm((prev) => ({ ...prev, cpnUseStartDate: value }))} onChangeHour={(value) => setForm((prev) => ({ ...prev, cpnUseStartHour: value }))} /></div>
            <div className="col-md-6"><DateHourInput label="사용 가능 종료일시" dateValue={form.cpnUseEndDate} hourValue={form.cpnUseEndHour} hourOptions={hourOptions} onChangeDate={(value) => setForm((prev) => ({ ...prev, cpnUseEndDate: value }))} onChangeHour={(value) => setForm((prev) => ({ ...prev, cpnUseEndHour: value }))} /></div>
          </div>
        )}
      </div>

      <div style={{ display: activeTab === 'TARGET' ? 'block' : 'none' }}>
        <div className="d-flex justify-content-between align-items-center mb-2">
          <div className="fw-semibold">적용 대상</div>
          <div className="d-flex gap-2">
            {form.cpnTargetCd === COUPON_TARGET_CODE.GOODS && <><button type="button" className="btn btn-outline-secondary btn-sm" onClick={handleDownloadTemplate}>엑셀 템플릿 다운로드</button><button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => applyExcelInputRef.current?.click()}>엑셀 업로드</button><button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => { setGoodsModalType('APPLY'); setIsGoodsSearchOpen(true); }}>상품추가</button></>}
            {form.cpnTargetCd === COUPON_TARGET_CODE.EXHIBITION && <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setIsExhibitionSearchOpen(true)}>기획전 추가</button>}
            {form.cpnTargetCd === COUPON_TARGET_CODE.CATEGORY && <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setIsCategorySearchOpen(true)}>카테고리 추가</button>}
            {form.cpnTargetCd !== COUPON_TARGET_CODE.ALL && <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => setApplyRows(removeSelectedRows(applyRows, applySelectedKeys))}>삭제</button>}
          </div>
        </div>
        {form.cpnTargetCd === COUPON_TARGET_CODE.ALL ? <div className="alert alert-info">쿠폰 적용 타겟이 전체인 경우 적용 대상 목록이 없습니다.</div> : <CouponTargetGrid gridType={applyGridType} rows={applyRows} onSelectionChange={setApplySelectedKeys} emptyMessage="적용 대상이 없습니다." />}
        <div className="d-flex justify-content-between align-items-center mb-2 mt-4">
          <div className="fw-semibold">제외 대상(상품)</div>
          <div className="d-flex gap-2"><button type="button" className="btn btn-outline-secondary btn-sm" onClick={handleDownloadTemplate}>엑셀 템플릿 다운로드</button><button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => excludeExcelInputRef.current?.click()}>엑셀 업로드</button><button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => { setGoodsModalType('EXCLUDE'); setIsGoodsSearchOpen(true); }}>상품추가</button><button type="button" className="btn btn-outline-danger btn-sm" onClick={() => setExcludeRows(removeSelectedRows(excludeRows, excludeSelectedKeys))}>삭제</button></div>
        </div>
        <CouponTargetGrid gridType="GOODS" rows={excludeRows} onSelectionChange={setExcludeSelectedKeys} emptyMessage="제외 대상이 없습니다." />
      </div>

      <input ref={applyExcelInputRef} type="file" accept=".xlsx" style={{ display: 'none' }} onChange={(event) => void handleUploadExcel(event, 'APPLY')} />
      <input ref={excludeExcelInputRef} type="file" accept=".xlsx" style={{ display: 'none' }} onChange={(event) => void handleUploadExcel(event, 'EXCLUDE')} />

      <GoodsSelectorModal isOpen={isGoodsSearchOpen} onClose={() => setIsGoodsSearchOpen(false)} categoryOptions={categoryOptions} goodsStatList={goodsStatList} goodsDivList={goodsDivList} goodsMerchList={goodsMerchList} brandList={brandList} onApply={handleApplyGoods} />
      <ExhibitionSelectorModal isOpen={isExhibitionSearchOpen} onClose={() => setIsExhibitionSearchOpen(false)} onApply={handleApplyExhibitions} />
      <CategorySelectorModal isOpen={isCategorySearchOpen} onClose={() => setIsCategorySearchOpen(false)} categoryOptions={categoryOptions} onApply={handleApplyCategories} />
    </Modal>
  );
};

export default CouponEditModal;
