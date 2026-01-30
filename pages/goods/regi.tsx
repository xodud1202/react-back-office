import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { GetServerSideProps, GetServerSidePropsContext } from 'next';
import { getCookie } from 'cookies-next';
import api from '@/utils/axios/axios';

interface CommonCode {
  grpCd: string;
  cd: string;
  cdNm: string;
  dispOrd: number;
}

interface GoodsMerch {
  goodsMerchId: string;
  goodsMerchNm: string;
}

interface GoodsRegiProps {
  goodsStatList: CommonCode[];
  goodsDivList: CommonCode[];
  goodsMerchList: GoodsMerch[];
}

// SSR에서 상품 등록 화면의 기본 옵션 데이터를 조회합니다.
export const getServerSideProps: GetServerSideProps<GoodsRegiProps> = async (ctx: GetServerSidePropsContext) => {
  const host = ctx.req.headers.host;
  const protocol = (ctx.req.headers['x-forwarded-proto'] as string) || 'http';
  const backendUrl = process.env.BACKEND_URL || (host ? `${protocol}://${host}` : '');
  const accessToken = (getCookie('accessToken', ctx) as string) ?? '';
  const cookieHeader = ctx.req.headers.cookie;

  const headers: Record<string, string> = {};
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }
  if (cookieHeader) {
    headers.Cookie = cookieHeader;
  }

  // 공통코드/분류 데이터를 병렬로 조회합니다.
  const fetchJson = async <T,>(url: string): Promise<T[]> => {
    if (!backendUrl) {
      return [];
    }
    try {
      const response = await fetch(`${backendUrl}${url}`, { headers });
      if (!response.ok) {
        return [];
      }
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (e) {
      return [];
    }
  };

  const [goodsStatList, goodsDivList, goodsMerchList] = await Promise.all([
    fetchJson<CommonCode>(`/api/admin/common/code?grpCd=${encodeURIComponent('GOODS_STAT')}`),
    fetchJson<CommonCode>(`/api/admin/common/code?grpCd=${encodeURIComponent('GOODS_DIV')}`),
    fetchJson<GoodsMerch>('/api/admin/goods/merch/list'),
  ]);

  return {
    props: {
      goodsStatList,
      goodsDivList,
      goodsMerchList,
    },
  };
};

const GoodsRegi = ({ goodsStatList: initialGoodsStatList, goodsDivList: initialGoodsDivList, goodsMerchList: initialGoodsMerchList }: GoodsRegiProps) => {
  const formRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(false);
  const [goodsStatList, setGoodsStatList] = useState<CommonCode[]>(initialGoodsStatList || []);
  const [goodsDivList, setGoodsDivList] = useState<CommonCode[]>(initialGoodsDivList || []);
  const [goodsMerchList, setGoodsMerchList] = useState<GoodsMerch[]>(initialGoodsMerchList || []);

  // 로그인 사용자 번호를 쿠키에서 조회합니다.
  const resolveLoginUsrNo = useCallback(() => {
    const cookieValue = getCookie('usrNo', { path: '/' });
    if (typeof cookieValue === 'string' && cookieValue.trim() !== '') {
      const parsed = Number(cookieValue);
      return Number.isNaN(parsed) ? null : parsed;
    }
    return null;
  }, []);

  // 상품 상태 공통코드를 조회합니다.
  const fetchGoodsStatList = useCallback(async () => {
    try {
      const response = await api.get('/api/admin/common/code', {
        params: { grpCd: 'GOODS_STAT' },
      });
      setGoodsStatList(response.data || []);
    } catch (e) {
      console.error('상품 상태 코드를 불러오는 데 실패했습니다.');
      alert('상품 상태 코드를 불러오는 데 실패했습니다.');
    }
  }, []);

  // 상품 구분 공통코드를 조회합니다.
  const fetchGoodsDivList = useCallback(async () => {
    try {
      const response = await api.get('/api/admin/common/code', {
        params: { grpCd: 'GOODS_DIV' },
      });
      setGoodsDivList(response.data || []);
    } catch (e) {
      console.error('상품 구분 코드를 불러오는 데 실패했습니다.');
      alert('상품 구분 코드를 불러오는 데 실패했습니다.');
    }
  }, []);

  // 상품 분류 목록을 조회합니다.
  const fetchGoodsMerchList = useCallback(async () => {
    try {
      const response = await api.get('/api/admin/goods/merch/list');
      setGoodsMerchList(response.data || []);
    } catch (e) {
      console.error('상품 분류 목록을 불러오는 데 실패했습니다.');
      alert('상품 분류 목록을 불러오는 데 실패했습니다.');
    }
  }, []);

  // 등록 폼 기본값을 계산합니다.
  const defaultGoodsDiv = useMemo(() => goodsDivList[0]?.cd ?? '', [goodsDivList]);
  const defaultGoodsStat = useMemo(() => goodsStatList[0]?.cd ?? '', [goodsStatList]);
  const defaultGoodsMerch = useMemo(() => goodsMerchList[0]?.goodsMerchId ?? '', [goodsMerchList]);

  // SSR에서 누락된 데이터가 있을 경우 클라이언트에서 보충합니다.
  useEffect(() => {
    if (goodsStatList.length === 0) {
      fetchGoodsStatList();
    }
    if (goodsDivList.length === 0) {
      fetchGoodsDivList();
    }
    if (goodsMerchList.length === 0) {
      fetchGoodsMerchList();
    }
  }, [fetchGoodsStatList, fetchGoodsDivList, fetchGoodsMerchList, goodsDivList.length, goodsMerchList.length, goodsStatList.length]);

  // 상품 등록 요청을 처리합니다.
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formRef.current) {
      return;
    }

    const regNo = resolveLoginUsrNo();
    if (!regNo) {
      alert('로그인 정보를 확인할 수 없습니다.');
      return;
    }

    const formData = new FormData(formRef.current);
    const payload = Object.fromEntries(formData.entries()) as Record<string, string>;

    const requestBody = {
      goodsId: payload.goodsId?.trim(),
      goodsNm: payload.goodsNm?.trim(),
      goodsStatCd: payload.goodsStatCd,
      goodsDivCd: payload.goodsDivCd,
      goodsMerchId: payload.goodsMerchId,
      goodsGroupId: payload.goodsGroupId?.trim(),
      supplyAmt: payload.supplyAmt ? Number(payload.supplyAmt) : null,
      saleAmt: payload.saleAmt ? Number(payload.saleAmt) : null,
      showYn: payload.showYn,
      erpSupplyAmt: payload.erpSupplyAmt ? Number(payload.erpSupplyAmt) : null,
      erpCostAmt: payload.erpCostAmt ? Number(payload.erpCostAmt) : null,
      erpStyleCd: payload.erpStyleCd?.trim(),
      erpColorCd: payload.erpColorCd?.trim(),
      erpMerchCd: payload.erpMerchCd?.trim(),
      regNo,
      udtNo: regNo,
    };

    setLoading(true);
    try {
      await api.post('/api/admin/goods/create', requestBody);
      alert('상품이 등록되었습니다.');
      formRef.current.reset();
    } catch (e: any) {
      console.error('상품 등록에 실패했습니다.');
      const message = e?.response?.data?.message;
      alert(message || '상품 등록에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <h3 className="page-title"> 상품 등록 </h3>
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb">
            <li className="breadcrumb-item"><a href="#">상품</a></li>
            <li className="breadcrumb-item active" aria-current="page">등록</li>
          </ol>
        </nav>
      </div>

      <div className="row">
        <div className="col-12 grid-margin stretch-card">
          <div className="card">
            <div className="card-body">
              <h4 className="card-title">상품 기본 정보</h4>
              <p className="card-description">필수 정보를 입력한 뒤 등록해 주세요.</p>
              <form ref={formRef} onSubmit={handleSubmit} className="forms-sample">
                <div className="row">
                  <div className="col-md-4">
                    <div className="form-group">
                      <label>상품코드 <span className="text-danger">*</span></label>
                      <input name="goodsId" type="text" className="form-control" required />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="form-group">
                      <label>상품명 <span className="text-danger">*</span></label>
                      <input name="goodsNm" type="text" className="form-control" required />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="form-group">
                      <label>상품상태 <span className="text-danger">*</span></label>
                      <select name="goodsStatCd" defaultValue={defaultGoodsStat} className="form-select" required>
                        {goodsStatList.map((item) => (
                          <option key={item.cd} value={item.cd}>{item.cdNm}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-4">
                    <div className="form-group">
                      <label>상품구분 <span className="text-danger">*</span></label>
                      <select name="goodsDivCd" defaultValue={defaultGoodsDiv} className="form-select" required>
                        {goodsDivList.map((item) => (
                          <option key={item.cd} value={item.cd}>{item.cdNm}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="form-group">
                      <label>상품분류 <span className="text-danger">*</span></label>
                      <select name="goodsMerchId" defaultValue={defaultGoodsMerch} className="form-select" required>
                        {goodsMerchList.map((item) => (
                          <option key={item.goodsMerchId} value={item.goodsMerchId}>{item.goodsMerchNm}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="form-group">
                      <label>상품그룹코드 <span className="text-danger">*</span></label>
                      <input name="goodsGroupId" type="text" className="form-control" required />
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-4">
                    <div className="form-group">
                      <label>공급가 <span className="text-danger">*</span></label>
                      <input name="supplyAmt" type="number" className="form-control" required />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="form-group">
                      <label>판매가 <span className="text-danger">*</span></label>
                      <input name="saleAmt" type="number" className="form-control" required />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="form-group">
                      <label>노출여부 <span className="text-danger">*</span></label>
                      <select name="showYn" defaultValue="Y" className="form-select" required>
                        <option value="Y">Y</option>
                        <option value="N">N</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-4">
                    <div className="form-group">
                      <label>ERP 공급가 <span className="text-danger">*</span></label>
                      <input name="erpSupplyAmt" type="number" className="form-control" required />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="form-group">
                      <label>ERP 원가 <span className="text-danger">*</span></label>
                      <input name="erpCostAmt" type="number" className="form-control" required />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="form-group">
                      <label>ERP 품번코드 <span className="text-danger">*</span></label>
                      <input name="erpStyleCd" type="text" className="form-control" required />
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-4">
                    <div className="form-group">
                      <label>ERP 컬러코드 <span className="text-danger">*</span></label>
                      <input name="erpColorCd" type="text" className="form-control" required />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="form-group">
                      <label>ERP 상품구분코드 <span className="text-danger">*</span></label>
                      <input name="erpMerchCd" type="text" className="form-control" required />
                    </div>
                  </div>
                </div>

                <div className="d-flex justify-content-center gap-2">
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? '등록중...' : '등록'}
                  </button>
                  <button type="reset" className="btn btn-dark">
                    초기화
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default GoodsRegi;
