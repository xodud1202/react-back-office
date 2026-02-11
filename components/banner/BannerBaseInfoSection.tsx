import React from 'react';
import type { CommonCode } from '@/components/goods/types';

interface BannerBaseInfoSectionProps {
  // 배너 구분 목록입니다.
  bannerDivList: CommonCode[];
  // 배너 구분 코드입니다.
  bannerDivCd: string;
  // 배너명입니다.
  bannerNm: string;
  // 노출 시작일시입니다.
  dispStartDt: string;
  // 노출 종료일시입니다.
  dispEndDt: string;
  // 노출 순서입니다.
  dispOrd: string;
  // 노출 여부입니다.
  showYn: string;
  // 배너 구분 코드 변경 함수입니다.
  setBannerDivCd: React.Dispatch<React.SetStateAction<string>>;
  // 배너명 변경 함수입니다.
  setBannerNm: React.Dispatch<React.SetStateAction<string>>;
  // 노출 시작일시 변경 함수입니다.
  setDispStartDt: React.Dispatch<React.SetStateAction<string>>;
  // 노출 종료일시 변경 함수입니다.
  setDispEndDt: React.Dispatch<React.SetStateAction<string>>;
  // 노출 순서 변경 함수입니다.
  setDispOrd: React.Dispatch<React.SetStateAction<string>>;
  // 노출 여부 변경 함수입니다.
  setShowYn: React.Dispatch<React.SetStateAction<string>>;
}

// 배너 기본 정보 입력 섹션을 렌더링합니다.
const BannerBaseInfoSection = ({
  bannerDivList,
  bannerDivCd,
  bannerNm,
  dispStartDt,
  dispEndDt,
  dispOrd,
  showYn,
  setBannerDivCd,
  setBannerNm,
  setDispStartDt,
  setDispEndDt,
  setDispOrd,
  setShowYn,
}: BannerBaseInfoSectionProps) => (
  <>
    <div className="row">
      <div className="col-md-3">
        <div className="form-group">
          <label>배너구분</label>
          <select className="form-select" value={bannerDivCd} onChange={(e) => setBannerDivCd(e.target.value)}>
            {bannerDivList.map((item) => (
              <option key={item.cd} value={item.cd}>{item.cdNm}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="col-md-4">
        <div className="form-group">
          <label>배너명</label>
          <input className="form-control" value={bannerNm} onChange={(e) => setBannerNm(e.target.value)} maxLength={20} />
        </div>
      </div>
      <div className="col-md-2">
        <div className="form-group">
          <label>노출시작일시</label>
          <input className="form-control" type="datetime-local" value={dispStartDt} onChange={(e) => setDispStartDt(e.target.value)} />
        </div>
      </div>
      <div className="col-md-2">
        <div className="form-group">
          <label>노출종료일시</label>
          <input className="form-control" type="datetime-local" value={dispEndDt} onChange={(e) => setDispEndDt(e.target.value)} />
        </div>
      </div>
    </div>

    <div className="row">
      <div className="col-md-2">
        <div className="form-group">
          <label>노출순서</label>
          <input className="form-control" type="number" value={dispOrd} onChange={(e) => setDispOrd(e.target.value)} min={1} />
        </div>
      </div>
      <div className="col-md-3">
        <div className="form-group">
          <label>노출여부</label>
          <select className="form-select" value={showYn} onChange={(e) => setShowYn(e.target.value)}>
            <option value="Y">Y</option>
            <option value="N">N</option>
          </select>
        </div>
      </div>
    </div>
  </>
);

export default BannerBaseInfoSection;
