import React, { useCallback, useMemo } from 'react';
import api from '@/utils/axios/axios';
import { requireLoginUsrNo } from '@/utils/auth';
import BannerImageGrid from '@/components/banner/BannerImageGrid';
import type { BannerImageInfo } from '@/components/banner/types';

interface BannerImageDetailSectionProps {
  // 수정 모드 여부입니다.
  isEditMode: boolean;
  // 이미지 배너 여부입니다.
  isImageBanner: boolean;
  // 수정 대상 배너 번호입니다.
  bannerNo: number | null;
  // 배너 구분 코드입니다.
  bannerDivCd: string;
  // 이미지 목록입니다.
  imageRows: BannerImageInfo[];
  // 선택된 이미지 행 키입니다.
  selectedImageRowKey: string;
  // 이미지 미리보기 맵입니다.
  imagePreviewMap: Record<string, string>;
  // 이미지 목록 상태 변경 함수입니다.
  setImageRows: React.Dispatch<React.SetStateAction<BannerImageInfo[]>>;
  // 선택 이미지 행 키 상태 변경 함수입니다.
  setSelectedImageRowKey: React.Dispatch<React.SetStateAction<string>>;
  // 이미지 파일 맵 상태 변경 함수입니다.
  setImageFileMap: React.Dispatch<React.SetStateAction<Record<string, File>>>;
  // 이미지 미리보기 맵 상태 변경 함수입니다.
  setImagePreviewMap: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

// 이미지 배너 상세 섹션을 렌더링합니다.
const BannerImageDetailSection = ({
  isEditMode,
  isImageBanner,
  bannerNo,
  bannerDivCd,
  imageRows,
  selectedImageRowKey,
  imagePreviewMap,
  setImageRows,
  setSelectedImageRowKey,
  setImageFileMap,
  setImagePreviewMap,
}: BannerImageDetailSectionProps) => {
  // 현재 선택된 이미지 행을 계산합니다.
  const selectedImageRow = useMemo(() => {
    if (!selectedImageRowKey) {
      return null;
    }
    return imageRows.find((row) => String(row.rowKey) === selectedImageRowKey) || null;
  }, [imageRows, selectedImageRowKey]);

  // 선택된 이미지 미리보기 경로를 계산합니다.
  const selectedImagePreview = useMemo(() => {
    if (!selectedImageRowKey) {
      return '';
    }
    return imagePreviewMap[selectedImageRowKey] || selectedImageRow?.imgPath || '';
  }, [imagePreviewMap, selectedImageRow, selectedImageRowKey]);

  // 새 이미지 행 키를 생성합니다.
  const createImageRowKey = useCallback(() => `new_${Date.now()}_${Math.floor(Math.random() * 10000)}`, []);

  // 이미지 행을 추가합니다.
  const handleAddImageRow = useCallback(() => {
    const nextRowKey = createImageRowKey();
    // 신규 이미지의 기본값을 구성합니다.
    const nextRow: BannerImageInfo = {
      rowKey: nextRowKey,
      bannerNm: '',
      imgPath: '',
      url: '',
      bannerOpenCd: 'S',
      dispOrd: imageRows.length + 1,
      dispStartDt: '',
      dispEndDt: '',
      showYn: 'Y',
      delYn: 'N',
    };
    setImageRows((prev) => [...prev, nextRow]);
    setSelectedImageRowKey(nextRowKey);
  }, [createImageRowKey, imageRows.length, setImageRows, setSelectedImageRowKey]);

  // 선택 이미지를 삭제합니다.
  const handleDeleteImageRow = useCallback(() => {
    if (!selectedImageRowKey) {
      alert('삭제할 이미지를 선택해주세요.');
      return;
    }
    // 목록/선택 상태를 함께 정리합니다.
    setImageRows((prev) => {
      const filtered = prev.filter((row) => String(row.rowKey) !== selectedImageRowKey)
        .map((row, index) => ({ ...row, dispOrd: index + 1 }));
      setSelectedImageRowKey(filtered[0]?.rowKey || '');
      return filtered;
    });
    // 선택된 행의 파일 임시값을 제거합니다.
    setImageFileMap((prev) => {
      const next = { ...prev };
      delete next[selectedImageRowKey];
      return next;
    });
    // 선택된 행의 미리보기 URL을 정리합니다.
    setImagePreviewMap((prev) => {
      const next = { ...prev };
      const oldPreview = next[selectedImageRowKey];
      if (oldPreview?.startsWith('blob:')) {
        URL.revokeObjectURL(oldPreview);
      }
      delete next[selectedImageRowKey];
      return next;
    });
  }, [selectedImageRowKey, setImageFileMap, setImagePreviewMap, setImageRows, setSelectedImageRowKey]);

  // 이미지 그리드 선택을 처리합니다.
  const handleSelectImageRow = useCallback((row: BannerImageInfo) => {
    if (!row.rowKey) {
      return;
    }
    setSelectedImageRowKey(String(row.rowKey));
  }, [setSelectedImageRowKey]);

  // 선택된 이미지 행의 입력값을 반영합니다.
  const handleChangeImageField = useCallback((field: keyof BannerImageInfo, value: string) => {
    if (!selectedImageRowKey) {
      return;
    }
    // 선택된 행의 특정 필드만 부분 변경합니다.
    setImageRows((prev) => prev.map((row) => (
      String(row.rowKey) === selectedImageRowKey
        ? { ...row, [field]: value }
        : row
    )));
  }, [selectedImageRowKey, setImageRows]);

  // 선택된 이미지 파일을 반영하고 수정 모드에서는 즉시 업로드합니다.
  const handleChangeImageFile = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (!file || !selectedImageRowKey) {
      return;
    }
    // 미리보기를 먼저 반영해 사용성 지연을 줄입니다.
    const localPreview = URL.createObjectURL(file);
    setImageFileMap((prev) => ({ ...prev, [selectedImageRowKey]: file }));
    setImagePreviewMap((prev) => {
      const oldPreview = prev[selectedImageRowKey];
      if (oldPreview?.startsWith('blob:')) {
        URL.revokeObjectURL(oldPreview);
      }
      return { ...prev, [selectedImageRowKey]: localPreview };
    });

    if (!bannerNo) {
      return;
    }

    const usrNo = requireLoginUsrNo();
    if (!usrNo) {
      return;
    }

    try {
      const formData = new FormData();
      // 이미지 업로드 API 필수값을 설정합니다.
      formData.append('bannerNo', String(bannerNo));
      formData.append('bannerDivCd', bannerDivCd);
      formData.append('regNo', String(usrNo));
      formData.append('image', file);
      const response = await api.post('/api/admin/banner/image/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const uploadedPath = String(response.data?.imgPath || '');
      // 업로드 완료 후 경로를 확정 반영합니다.
      setImageRows((prev) => prev.map((row) => (
        String(row.rowKey) === selectedImageRowKey
          ? { ...row, imgPath: uploadedPath }
          : row
      )));
      // 업로드가 완료된 파일 임시값을 제거합니다.
      setImageFileMap((prev) => {
        const next = { ...prev };
        delete next[selectedImageRowKey];
        return next;
      });
      setImagePreviewMap((prev) => {
        const next = { ...prev };
        delete next[selectedImageRowKey];
        return next;
      });
    } catch (error: any) {
      const message = error?.response?.data?.message || '이미지 업로드에 실패했습니다.';
      alert(message);
    }
  }, [bannerDivCd, bannerNo, selectedImageRowKey, setImageFileMap, setImagePreviewMap, setImageRows]);

  // 이미지 정렬 변경을 반영하고 수정 모드에서는 즉시 저장합니다.
  const handleChangeImageOrder = useCallback(async (rows: BannerImageInfo[]) => {
    const nextRows = rows.map((row, index) => ({ ...row, dispOrd: index + 1 }));
    const previousRows = imageRows;
    setImageRows(nextRows);

    if (!bannerNo) {
      return;
    }

    const usrNo = requireLoginUsrNo();
    if (!usrNo) {
      return;
    }

    const canImmediateSave = nextRows.every((row) => row.imageBannerNo && row.imageBannerNo > 0);
    if (!canImmediateSave) {
      alert('신규 이미지는 저장 후 정렬 즉시 저장이 가능합니다.');
      return;
    }

    try {
      await api.post('/api/admin/banner/image/order/save', {
        bannerNo,
        udtNo: usrNo,
        orders: nextRows.map((row) => ({
          imageBannerNo: row.imageBannerNo,
          dispOrd: row.dispOrd,
        })),
      });
    } catch (error: any) {
      setImageRows(previousRows);
      const message = error?.response?.data?.message || '이미지 정렬 저장에 실패했습니다.';
      alert(message);
    }
  }, [bannerNo, imageRows, setImageRows]);

  if (!isEditMode || !isImageBanner) {
    return null;
  }

  return (
    <>
      <hr />
      <div className="d-flex justify-content-end gap-2 mb-2">
        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={handleAddImageRow}>추가</button>
        <button type="button" className="btn btn-outline-danger btn-sm" onClick={handleDeleteImageRow}>선택 삭제</button>
      </div>

      <BannerImageGrid
        rows={imageRows}
        onOrderChange={handleChangeImageOrder}
        onSelectRow={handleSelectImageRow}
      />

      <div className="mt-3">
        {!selectedImageRow ? (
          <div className="alert alert-secondary mb-0">이미지 그리드에서 배너 이미지명을 선택해주세요.</div>
        ) : (
          <div className="row">
            <div className="col-md-3"><div className="form-group"><label>배너 이미지명(ALT)</label><input className="form-control" value={selectedImageRow.bannerNm || ''} onChange={(e) => handleChangeImageField('bannerNm', e.target.value)} maxLength={100} /></div></div>
            <div className="col-md-3"><div className="form-group"><label>배너 이미지</label><input type="file" className="form-control" accept="image/*" onChange={handleChangeImageFile} /><small className="text-muted d-block mt-1">{bannerDivCd === 'BANNER_DIV_01' ? '권장 규격: 1280x1280' : '권장 규격: 1280x200'}</small></div></div>
            <div className="col-md-3"><div className="form-group"><label>링크 URL</label><input className="form-control" value={selectedImageRow.url || ''} onChange={(e) => handleChangeImageField('url', e.target.value)} /></div></div>
            <div className="col-md-2"><div className="form-group"><label>오픈방식</label><select className="form-select" value={selectedImageRow.bannerOpenCd || 'S'} onChange={(e) => handleChangeImageField('bannerOpenCd', e.target.value)}><option value="S">동일창</option><option value="N">새창</option></select></div></div>
            <div className="col-md-1 d-flex align-items-end">{selectedImagePreview && (<img src={selectedImagePreview} alt="미리보기" style={{ width: '100%', maxHeight: '90px', objectFit: 'contain' }} />)}</div>
            <div className="col-md-3"><div className="form-group"><label>이미지 노출시작일시</label><input className="form-control" type="datetime-local" value={selectedImageRow.dispStartDt || ''} onChange={(e) => handleChangeImageField('dispStartDt', e.target.value)} /></div></div>
            <div className="col-md-3"><div className="form-group"><label>이미지 노출종료일시</label><input className="form-control" type="datetime-local" value={selectedImageRow.dispEndDt || ''} onChange={(e) => handleChangeImageField('dispEndDt', e.target.value)} /></div></div>
            <div className="col-md-2"><div className="form-group"><label>이미지 노출여부</label><select className="form-select" value={selectedImageRow.showYn || 'Y'} onChange={(e) => handleChangeImageField('showYn', e.target.value)}><option value="Y">Y</option><option value="N">N</option></select></div></div>
            <div className="col-md-4"><div className="form-group"><label>이미지 경로</label><input className="form-control" value={selectedImageRow.imgPath || ''} readOnly /></div></div>
          </div>
        )}
      </div>
    </>
  );
};

export default BannerImageDetailSection;
