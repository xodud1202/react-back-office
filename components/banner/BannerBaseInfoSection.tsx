import React from 'react';
import type { CommonCode } from '@/components/goods/types';

interface BannerBaseInfoSectionProps {
  // 배너 구분 목록입니다.
  bannerDivList: CommonCode[];
  // 배너 구분 코드입니다.
  bannerDivCd: string;
  // 배너명입니다.
  bannerNm: string;
  // 노출 시작일입니다.
  dispStartDate: string;
  // 노출 시작시입니다.
  dispStartHour: string;
  // 노출 종료일입니다.
  dispEndDate: string;
  // 노출 종료시입니다.
  dispEndHour: string;
  // 시 선택 옵션 목록입니다.
  hourOptions: string[];
  // 노출 순서입니다.
  dispOrd: string;
  // 노출 여부입니다.
  showYn: string;
  // 배너 구분 코드 변경 함수입니다.
  setBannerDivCd: React.Dispatch<React.SetStateAction<string>>;
  // 배너명 변경 함수입니다.
  setBannerNm: React.Dispatch<React.SetStateAction<string>>;
  // 노출 시작일 변경 함수입니다.
  setDispStartDate: React.Dispatch<React.SetStateAction<string>>;
  // 노출 시작시 변경 함수입니다.
  setDispStartHour: React.Dispatch<React.SetStateAction<string>>;
  // 노출 종료일 변경 함수입니다.
  setDispEndDate: React.Dispatch<React.SetStateAction<string>>;
  // 노출 종료시 변경 함수입니다.
  setDispEndHour: React.Dispatch<React.SetStateAction<string>>;
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
  dispStartDate,
  dispStartHour,
  dispEndDate,
  dispEndHour,
  hourOptions,
  dispOrd,
  showYn,
  setBannerDivCd,
  setBannerNm,
  setDispStartDate,
  setDispStartHour,
  setDispEndDate,
  setDispEndHour,
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
          <div className="d-flex gap-2">
            <input className="form-control" type="date" value={dispStartDate} onChange={(e) => setDispStartDate(e.target.value)} />
            <select className="form-select w-auto" value={dispStartHour} onChange={(e) => setDispStartHour(e.target.value)}>
              {hourOptions.map((item) => (
                <option key={`disp-start-${item}`} value={item}>{item}시</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      <div className="col-md-2">
        <div className="form-group">
          <label>노출종료일시</label>
          <div className="d-flex gap-2">
            <input className="form-control" type="date" value={dispEndDate} onChange={(e) => setDispEndDate(e.target.value)} />
            <select className="form-select w-auto" value={dispEndHour} onChange={(e) => setDispEndHour(e.target.value)}>
              {hourOptions.map((item) => (
                <option key={`disp-end-${item}`} value={item}>{item}시</option>
              ))}
            </select>
          </div>
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
