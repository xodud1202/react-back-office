import React, { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import api from '@/utils/axios/axios';
import useQuillImageUpload from '@/hooks/useQuillImageUpload';
import { getLoginUsrNo } from '@/utils/auth';
import type { GoodsDescData } from '@/components/goods/types';

interface GoodsDescEditorProps {
  goodsId: string | null;
  isOpen: boolean;
}

// ref 전달을 위해 forwardRef로 감싼 에디터 컴포넌트를 동적으로 로드합니다.
const ReactQuill = dynamic(
  async () => {
    const mod = await import('react-quill-new');
    const Component = mod.default;
    return React.forwardRef<any, React.ComponentProps<typeof Component>>((props, ref) => (
      <Component ref={ref} {...props} />
    ));
  },
  { ssr: false }
);

// 상품 상세 설명 영역을 렌더링합니다.
const GoodsDescEditor = ({ goodsId, isOpen }: GoodsDescEditorProps) => {
  const [pcDesc, setPcDesc] = useState('');
  const [moDesc, setMoDesc] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<{ pc: 'editor' | 'html'; mo: 'editor' | 'html' }>({
    pc: 'editor',
    mo: 'editor',
  });

  const quillToolbarOptions = useMemo(
    () => ([
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link', 'image'],
      ['clean'],
    ]),
    []
  );
  const quillFormatsOptions = useMemo(
    () => ([
      'header',
      'bold',
      'italic',
      'underline',
      'strike',
      'list',
      'bullet',
      'link',
      'image',
    ]),
    []
  );

  // 상품 상세 설명을 조회합니다.
  const fetchGoodsDesc = useCallback(async () => {
    if (!goodsId) {
      setPcDesc('');
      setMoDesc('');
      return;
    }
    setLoading(true);
    try {
      const response = await api.get('/api/admin/goods/desc/list', {
        params: { goodsId },
      });
      const list = (response.data || []) as GoodsDescData[];
      const pcItem = list.find((item) => item.deviceGbCd === 'PC');
      const moItem = list.find((item) => item.deviceGbCd === 'MO' || item.deviceGbCd === 'MOBILE');
      setPcDesc(pcItem?.goodsDesc || '');
      setMoDesc(moItem?.goodsDesc || '');
    } catch (e) {
      console.error('상품 상세 정보를 불러오는 데 실패했습니다.');
      alert('상품 상세 정보를 불러오는 데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [goodsId]);

  useEffect(() => {
    if (!isOpen || !goodsId) {
      setPcDesc('');
      setMoDesc('');
      return;
    }
    fetchGoodsDesc();
  }, [fetchGoodsDesc, goodsId, isOpen]);

  const handleSave = useCallback(async () => {
    if (!goodsId) {
      alert('상품코드를 확인해주세요.');
      return;
    }
    const loginUsrNo = getLoginUsrNo();
    if (!loginUsrNo) {
      alert('로그인 정보를 확인할 수 없습니다.');
      return;
    }
    setSaving(true);
    try {
      await api.post('/api/admin/goods/desc/save', {
        goodsId,
        regNo: loginUsrNo,
        udtNo: loginUsrNo,
        list: [
          { deviceGbCd: 'PC', goodsDesc: pcDesc },
          { deviceGbCd: 'MO', goodsDesc: moDesc },
        ],
      });
      alert('상품 상세 설명이 저장되었습니다.');
    } catch (e: any) {
      console.error('상품 상세 설명 저장에 실패했습니다.');
      const message = e?.response?.data?.message;
      alert(message || '상품 상세 설명 저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  }, [goodsId, moDesc, pcDesc]);

  const pcQuill = useQuillImageUpload({
    toolbarOptions: quillToolbarOptions,
    formats: quillFormatsOptions,
    onChange: setPcDesc,
  });
  const moQuill = useQuillImageUpload({
    toolbarOptions: quillToolbarOptions,
    formats: quillFormatsOptions,
    onChange: setMoDesc,
  });

  return (
    <div className="mt-4">
      <div className="d-flex align-items-center justify-content-between mb-2">
        <h5 className="mb-0">상품 상세 설명</h5>
        <button
          type="button"
          className="btn btn-sm btn-primary"
          onClick={handleSave}
          disabled={saving || loading}
        >
          {saving ? '저장중...' : '저장'}
        </button>
      </div>
      {loading ? (
        <div className="text-center">상세 정보 로딩중...</div>
      ) : (
        <div className="table-responsive">
          <table className="table table-bordered align-middle" style={{ tableLayout: 'fixed', width: '100%' }}>
            <colgroup>
              <col style={{ width: '10%' }} />
              <col style={{ width: '90%' }} />
            </colgroup>
            <tbody>
              <tr>
                <th>PC 버전</th>
                <td>
                  <div className="goods-desc-editor">
                    <div className="d-flex justify-content-end gap-2 mb-2">
                      <button
                        type="button"
                        className={`btn btn-sm ${viewMode.pc === 'editor' ? 'btn-primary' : 'btn-outline-primary'}`}
                        onClick={() => setViewMode((prev) => ({ ...prev, pc: 'editor' }))}
                      >
                        에디터
                      </button>
                      <button
                        type="button"
                        className={`btn btn-sm ${viewMode.pc === 'html' ? 'btn-primary' : 'btn-outline-primary'}`}
                        onClick={() => setViewMode((prev) => ({ ...prev, pc: 'html' }))}
                      >
                        HTML
                      </button>
                    </div>
                    {viewMode.pc === 'editor' ? (
                      <ReactQuill
                        ref={pcQuill.quillRef}
                        theme="snow"
                        className="board-editor"
                        value={pcDesc}
                        onChange={pcQuill.handleEditorChange}
                        modules={pcQuill.quillModules}
                        formats={pcQuill.quillFormats}
                      />
                    ) : (
                      <textarea
                        className="form-control goods-desc-html"
                        value={pcDesc}
                        onChange={(e) => setPcDesc(e.target.value)}
                      />
                    )}
                  </div>
                </td>
              </tr>
              <tr>
                <th>MO 버전</th>
                <td>
                  <div className="goods-desc-editor">
                    <div className="d-flex justify-content-end gap-2 mb-2">
                      <button
                        type="button"
                        className={`btn btn-sm ${viewMode.mo === 'editor' ? 'btn-primary' : 'btn-outline-primary'}`}
                        onClick={() => setViewMode((prev) => ({ ...prev, mo: 'editor' }))}
                      >
                        에디터
                      </button>
                      <button
                        type="button"
                        className={`btn btn-sm ${viewMode.mo === 'html' ? 'btn-primary' : 'btn-outline-primary'}`}
                        onClick={() => setViewMode((prev) => ({ ...prev, mo: 'html' }))}
                      >
                        HTML
                      </button>
                    </div>
                    {viewMode.mo === 'editor' ? (
                      <ReactQuill
                        ref={moQuill.quillRef}
                        theme="snow"
                        className="board-editor"
                        value={moDesc}
                        onChange={moQuill.handleEditorChange}
                        modules={moQuill.quillModules}
                        formats={moQuill.quillFormats}
                      />
                    ) : (
                      <textarea
                        className="form-control goods-desc-html"
                        value={moDesc}
                        onChange={(e) => setMoDesc(e.target.value)}
                      />
                    )}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
      <style jsx>{`
        .goods-desc-editor :global(.ql-container) {
          height: 500px;
        }
        .goods-desc-editor :global(.ql-editor) {
          min-height: 500px;
        }
        .goods-desc-editor :global(.ql-editor img) {
          width: unset;
          max-width: 100%;
          height: auto;
          border-radius: 0;
        }
        .goods-desc-html {
          height: 500px;
          resize: vertical;
        }
      `}</style>
    </div>
  );
};

export default GoodsDescEditor;
