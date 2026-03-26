import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import api from '@/utils/axios/axios';
import { requireLoginUsrNo } from '@/utils/auth';
import AdminFormTable from '@/components/common/AdminFormTable';
import AdminResetButton from '@/components/common/AdminResetButton';

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

interface BrandOption {
  brandNo: number;
  brandNm: string;
}

interface GoodsRegiProps {
  goodsStatList: CommonCode[];
  goodsDivList: CommonCode[];
  goodsMerchList: GoodsMerch[];
  brandList: BrandOption[];
}

// 상품 등록 화면을 렌더링합니다.
const GoodsRegi = ({ goodsStatList: initialGoodsStatList, goodsDivList: initialGoodsDivList, goodsMerchList: initialGoodsMerchList, brandList: initialBrandList }: GoodsRegiProps) => {
  const formRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(false);
  const [goodsStatList, setGoodsStatList] = useState<CommonCode[]>(initialGoodsStatList || []);
  const [goodsDivList, setGoodsDivList] = useState<CommonCode[]>(initialGoodsDivList || []);
  const [goodsMerchList, setGoodsMerchList] = useState<GoodsMerch[]>(initialGoodsMerchList || []);
  const [brandList, setBrandList] = useState<BrandOption[]>(initialBrandList || []);

  // 상품 상태 공통코드를 조회합니다.
  const fetchGoodsStatList = useCallback(async () => {
    try {
      const response = await api.get('/api/admin/common/code', {
        params: { grpCd: 'GOODS_STAT' },
      });
      setGoodsStatList(response.data || []);
    } catch {
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
    } catch {
      console.error('상품 구분 코드를 불러오는 데 실패했습니다.');
      alert('상품 구분 코드를 불러오는 데 실패했습니다.');
    }
  }, []);

  // 상품 분류 목록을 조회합니다.
  const fetchGoodsMerchList = useCallback(async () => {
    try {
      const response = await api.get('/api/admin/goods/merch/list');
      setGoodsMerchList(response.data || []);
    } catch {
      console.error('상품 분류 목록을 불러오는 데 실패했습니다.');
      alert('상품 분류 목록을 불러오는 데 실패했습니다.');
    }
  }, []);

  // 브랜드 목록을 조회합니다.
  const fetchBrandList = useCallback(async () => {
    try {
      const response = await api.get('/api/admin/brand/list');
      setBrandList(response.data || []);
    } catch {
      console.error('브랜드 목록을 불러오는 데 실패했습니다.');
      alert('브랜드 목록을 불러오는 데 실패했습니다.');
    }
  }, []);

  // 등록 폼 기본값을 계산합니다.
  const defaultGoodsDiv = useMemo(() => goodsDivList[0]?.cd ?? '', [goodsDivList]);
  const defaultGoodsStat = useMemo(() => goodsStatList[0]?.cd ?? '', [goodsStatList]);
  const defaultGoodsMerch = useMemo(() => goodsMerchList[0]?.goodsMerchId ?? '', [goodsMerchList]);
  const defaultBrandNo = useMemo(() => brandList[0]?.brandNo ?? '', [brandList]);

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
    if (brandList.length === 0) {
      fetchBrandList();
    }
  }, [brandList.length, fetchBrandList, fetchGoodsStatList, fetchGoodsDivList, fetchGoodsMerchList, goodsDivList.length, goodsMerchList.length, goodsStatList.length]);

  // 상품 등록 요청을 처리합니다.
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formRef.current) {
      return;
    }

    const regNo = requireLoginUsrNo();
    if (!regNo) {
      return;
    }

    const formData = new FormData(formRef.current);
    const payload = Object.fromEntries(formData.entries()) as Record<string, string>;

    const requestBody = {
      goodsId: payload.goodsId?.trim(),
      brandNo: payload.brandNo ? Number(payload.brandNo) : null,
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
              <form ref={formRef} onSubmit={handleSubmit} className="forms-sample">
                <AdminFormTable>
                  <tbody>
                    <tr>
                      <th scope="row">상품코드 <span className="text-danger">*</span></th>
                      <td>
                        <input name="goodsId" type="text" className="form-control" required />
                      </td>
                      <th scope="row">상품명 <span className="text-danger">*</span></th>
                      <td>
                        <input name="goodsNm" type="text" className="form-control" required />
                      </td>
                    </tr>
                    <tr>
                      <th scope="row">상품상태 <span className="text-danger">*</span></th>
                      <td>
                        <select name="goodsStatCd" defaultValue={defaultGoodsStat} className="form-select" required>
                          {goodsStatList.map((item) => (
                            <option key={item.cd} value={item.cd}>{item.cdNm}</option>
                          ))}
                        </select>
                      </td>
                      <th scope="row">상품구분 <span className="text-danger">*</span></th>
                      <td>
                        <select name="goodsDivCd" defaultValue={defaultGoodsDiv} className="form-select" required>
                          {goodsDivList.map((item) => (
                            <option key={item.cd} value={item.cd}>{item.cdNm}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                    <tr>
                      <th scope="row">상품분류 <span className="text-danger">*</span></th>
                      <td>
                        <select name="goodsMerchId" defaultValue={defaultGoodsMerch} className="form-select" required>
                          {goodsMerchList.map((item) => (
                            <option key={item.goodsMerchId} value={item.goodsMerchId}>{item.goodsMerchNm}</option>
                          ))}
                        </select>
                      </td>
                      <th scope="row">브랜드 <span className="text-danger">*</span></th>
                      <td>
                        <select name="brandNo" defaultValue={defaultBrandNo} className="form-select" required>
                          {brandList.map((item) => (
                            <option key={item.brandNo} value={item.brandNo}>{item.brandNm}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                    <tr>
                      <th scope="row">상품그룹코드 <span className="text-danger">*</span></th>
                      <td>
                        <input name="goodsGroupId" type="text" className="form-control" required />
                      </td>
                      <th scope="row">노출여부 <span className="text-danger">*</span></th>
                      <td>
                        <select name="showYn" defaultValue="Y" className="form-select" required>
                          <option value="Y">Y</option>
                          <option value="N">N</option>
                        </select>
                      </td>
                    </tr>
                    <tr>
                      <th scope="row">공급가 <span className="text-danger">*</span></th>
                      <td>
                        <input name="supplyAmt" type="number" className="form-control" required />
                      </td>
                      <th scope="row">판매가 <span className="text-danger">*</span></th>
                      <td>
                        <input name="saleAmt" type="number" className="form-control" required />
                      </td>
                    </tr>
                    <tr>
                      <th scope="row">ERP 공급가 <span className="text-danger">*</span></th>
                      <td>
                        <input name="erpSupplyAmt" type="number" className="form-control" required />
                      </td>
                      <th scope="row">ERP 원가 <span className="text-danger">*</span></th>
                      <td>
                        <input name="erpCostAmt" type="number" className="form-control" required />
                      </td>
                    </tr>
                    <tr>
                      <th scope="row">ERP 품번코드 <span className="text-danger">*</span></th>
                      <td>
                        <input name="erpStyleCd" type="text" className="form-control" required />
                      </td>
                      <th scope="row">ERP 컬러코드 <span className="text-danger">*</span></th>
                      <td>
                        <input name="erpColorCd" type="text" className="form-control" required />
                      </td>
                    </tr>
                    <tr>
                      <th scope="row">ERP 상품구분코드 <span className="text-danger">*</span></th>
                      <td colSpan={3}>
                        <input name="erpMerchCd" type="text" className="form-control" required />
                      </td>
                    </tr>
                  </tbody>
                </AdminFormTable>

                <div className="admin-form-actions">
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? '등록중...' : '등록'}
                  </button>
                  <AdminResetButton type="reset" />
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
