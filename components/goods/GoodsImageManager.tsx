import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import api from '@/utils/axios/axios';
import { getLoginUsrNo } from '@/utils/auth';
import type { GoodsImageData } from '@/components/goods/types';

interface GoodsImageManagerProps {
  goodsId: string | null;
  isOpen: boolean;
}

// 상품 이미지 관리 영역을 렌더링합니다.
const GoodsImageManager = ({ goodsId, isOpen }: GoodsImageManagerProps) => {
  const [imageList, setImageList] = useState<GoodsImageData[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [hoveredImgNo, setHoveredImgNo] = useState<number | null>(null);
  const [draggingImgNo, setDraggingImgNo] = useState<number | null>(null);
  const [dragOverImgNo, setDragOverImgNo] = useState<number | null>(null);
  const [dragOverPosition, setDragOverPosition] = useState<'left' | 'right' | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // 이미지 목록을 조회합니다.
  const fetchGoodsImages = useCallback(async () => {
    if (!goodsId) {
      setImageList([]);
      return;
    }
    setLoading(true);
    try {
      const response = await api.get('/api/admin/goods/image/list', {
        params: { goodsId },
      });
      setImageList(response.data || []);
    } catch (e) {
      console.error('상품 이미지를 불러오는 데 실패했습니다.');
      alert('상품 이미지를 불러오는 데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [goodsId]);

  // 팝업 상태 변경 시 이미지 목록을 갱신합니다.
  useEffect(() => {
    if (!isOpen || !goodsId) {
      setImageList([]);
      return;
    }
    fetchGoodsImages();
  }, [fetchGoodsImages, goodsId, isOpen]);

  // 이미지 업로드 버튼을 클릭합니다.
  const handleClickUpload = useCallback(() => {
    if (!goodsId) {
      alert('상품코드를 확인해주세요.');
      return;
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  }, [goodsId]);

  // 이미지 업로드 유효성을 검사합니다.
  const validateImageFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      return '이미지 파일만 업로드할 수 있습니다.';
    }
    const img = new Image();
    const url = URL.createObjectURL(file);
    try {
      const result = await new Promise<string | null>((resolve) => {
        img.onload = () => {
          const width = img.width;
          const height = img.height;
          URL.revokeObjectURL(url);
          if (width !== height) {
            resolve('정사각형 이미지만 업로드할 수 있습니다.');
            return;
          }
          if (width < 500 || width > 1500) {
            resolve('이미지 크기는 500x500 ~ 1500x1500px만 가능합니다.');
            return;
          }
          resolve(null);
        };
        img.onerror = () => {
          URL.revokeObjectURL(url);
          resolve('이미지 파일을 확인해주세요.');
        };
        img.src = url;
      });
      return result;
    } catch (e) {
      return '이미지 파일을 확인해주세요.';
    }
  }, []);

  // 이미지 업로드를 처리합니다.
  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!goodsId) {
      return;
    }
    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }
    const file = files[0];
    const validationMessage = await validateImageFile(file);
    if (validationMessage) {
      alert(validationMessage);
      return;
    }
    const loginUsrNo = getLoginUsrNo();
    if (!loginUsrNo) {
      alert('로그인 정보를 확인할 수 없습니다.');
      return;
    }
    const formData = new FormData();
    formData.append('image', file);
    formData.append('goodsId', goodsId);
    formData.append('regNo', String(loginUsrNo));

    setUploading(true);
    try {
      await api.post('/api/admin/goods/image/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await fetchGoodsImages();
    } catch (e: any) {
      console.error('상품 이미지 업로드에 실패했습니다.');
      const message = e?.response?.data?.message;
      alert(message || '상품 이미지 업로드에 실패했습니다.');
    } finally {
      setUploading(false);
    }
  }, [fetchGoodsImages, goodsId, validateImageFile]);

  // 이미지 삭제를 처리합니다.
  const handleDeleteImage = useCallback(async (imgNo: number) => {
    if (!goodsId) {
      return;
    }
    const loginUsrNo = getLoginUsrNo();
    if (!loginUsrNo) {
      alert('로그인 정보를 확인할 수 없습니다.');
      return;
    }
    const shouldDelete = window.confirm('이미지를 삭제하시겠습니까?');
    if (!shouldDelete) {
      return;
    }
    try {
      await api.post('/api/admin/goods/image/delete', {
        goodsId,
        imgNo,
        udtNo: loginUsrNo,
      });
      setImageList((prev) => prev.filter((item) => item.imgNo !== imgNo));
    } catch (e: any) {
      console.error('상품 이미지 삭제에 실패했습니다.');
      const message = e?.response?.data?.message;
      alert(message || '상품 이미지 삭제에 실패했습니다.');
    }
  }, [goodsId]);

  const gridStyle = useMemo(() => ({
    display: 'grid',
    gridTemplateColumns: 'repeat(6, minmax(0, 1fr))',
    gap: '12px',
  }), []);

  // 이미지 순서를 저장합니다.
  const saveImageOrder = useCallback(async (nextList: GoodsImageData[]) => {
    if (!goodsId) {
      return;
    }
    const loginUsrNo = getLoginUsrNo();
    if (!loginUsrNo) {
      return;
    }
    const orders = nextList.map((item, index) => ({
      imgNo: item.imgNo,
      dispOrd: index + 1,
    }));
    try {
      await api.post('/api/admin/goods/image/order/save', {
        goodsId,
        udtNo: loginUsrNo,
        orders,
      });
    } catch (e: any) {
      console.error('상품 이미지 순서 저장에 실패했습니다.');
      const message = e?.response?.data?.message;
      alert(message || '상품 이미지 순서 저장에 실패했습니다.');
      await fetchGoodsImages();
    }
  }, [fetchGoodsImages, goodsId]);

  // 드래그 시작을 처리합니다.
  const handleDragStart = useCallback((imgNo: number) => (event: React.DragEvent<HTMLDivElement>) => {
    setDraggingImgNo(imgNo);
    setDragOverImgNo(null);
    setDragOverPosition(null);
    event.dataTransfer.effectAllowed = 'move';
  }, []);

  // 드래그 오버를 처리합니다.
  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // 드롭을 처리합니다.
  const handleDrop = useCallback((targetImgNo: number) => async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (draggingImgNo == null || draggingImgNo === targetImgNo) {
      setDraggingImgNo(null);
      setDragOverImgNo(null);
      setDragOverPosition(null);
      return;
    }
    setImageList((prev) => {
      const currentList = [...prev];
      const fromIndex = currentList.findIndex((item) => item.imgNo === draggingImgNo);
      const toIndex = currentList.findIndex((item) => item.imgNo === targetImgNo);
      if (fromIndex < 0 || toIndex < 0) {
        return prev;
      }
      const [moved] = currentList.splice(fromIndex, 1);
      const baseIndex = fromIndex < toIndex ? toIndex - 1 : toIndex;
      const insertIndex = dragOverPosition === 'right' ? baseIndex + 1 : baseIndex;
      currentList.splice(insertIndex, 0, moved);
      saveImageOrder(currentList);
      return currentList;
    });
    setDraggingImgNo(null);
    setDragOverImgNo(null);
    setDragOverPosition(null);
  }, [draggingImgNo, saveImageOrder]);

  // 드래그 종료를 처리합니다.
  const handleDragEnd = useCallback(() => {
    setDraggingImgNo(null);
    setDragOverImgNo(null);
    setDragOverPosition(null);
  }, []);

  // 드래그 진입을 처리합니다.
  const handleDragEnter = useCallback((imgNo: number) => (event: React.DragEvent<HTMLDivElement>) => {
    if (draggingImgNo == null) {
      return;
    }
    if (imgNo === draggingImgNo) {
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    const midX = rect.left + rect.width / 2;
    const nextPosition: 'left' | 'right' = event.clientX < midX ? 'left' : 'right';
    setDragOverImgNo(imgNo);
    setDragOverPosition(nextPosition);
  }, [draggingImgNo]);

  // 드래그 이탈을 처리합니다.
  const handleDragLeave = useCallback((imgNo: number) => () => {
    if (dragOverImgNo === imgNo) {
      setDragOverImgNo(null);
      setDragOverPosition(null);
    }
  }, [dragOverImgNo]);

  return (
    <div className="mt-4">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <h5 className="mb-0">상품 이미지</h5>
        <div className="d-flex gap-2">
          <button
            type="button"
            className="btn btn-sm btn-secondary"
            onClick={handleClickUpload}
            disabled={uploading}
          >
            {uploading ? '업로드중...' : '이미지 추가'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="d-none"
            onChange={handleFileChange}
          />
        </div>
      </div>
      {loading ? (
        <div className="text-center">이미지 로딩중...</div>
      ) : (
        <>
          {imageList.length === 0 ? (
            <div className="text-center text-muted">등록된 이미지가 없습니다.</div>
          ) : (
            <div style={gridStyle}>
              {imageList.map((item) => {
                const imgUrl = item.imgUrl || item.imgPath;
                const isDragging = draggingImgNo === item.imgNo;
                const isDropTarget = dragOverImgNo === item.imgNo;
                const showLeftLine = isDropTarget && dragOverPosition === 'left';
                const showRightLine = isDropTarget && dragOverPosition === 'right';
                return (
                  <div
                    key={item.imgNo}
                    className="position-relative border rounded"
                    style={{
                      aspectRatio: '1 / 1',
                      overflow: 'hidden',
                      cursor: 'grab',
                      opacity: isDragging ? 0.6 : 1,
                      transform: isDragging ? 'scale(1.03)' : 'scale(1)',
                      boxShadow: isDragging ? '0 6px 14px rgba(0, 0, 0, 0.2)' : 'none',
                      border: isDropTarget ? '2px dashed #0d6efd' : undefined,
                      backgroundColor: isDropTarget ? 'rgba(13, 110, 253, 0.08)' : undefined,
                      transition: 'transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease',
                    }}
                    onMouseEnter={() => setHoveredImgNo(item.imgNo)}
                    onMouseLeave={() => setHoveredImgNo(null)}
                    draggable
                    onDragStart={handleDragStart(item.imgNo)}
                    onDragOver={handleDragOver}
                    onDragEnter={handleDragEnter(item.imgNo)}
                    onDragLeave={handleDragLeave(item.imgNo)}
                    onDrop={handleDrop(item.imgNo)}
                    onDragEnd={handleDragEnd}
                  >
                    {showLeftLine && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 0,
                          bottom: 0,
                          left: '-8.5px',
                          width: '5px',
                          backgroundColor: '#0d6efd',
                          borderRadius: '2px',
                          zIndex: 2,
                          pointerEvents: 'none',
                        }}
                      />
                    )}
                    {showRightLine && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 0,
                          bottom: 0,
                          right: '-8.5px',
                          width: '5px',
                          backgroundColor: '#0d6efd',
                          borderRadius: '2px',
                          zIndex: 2,
                          pointerEvents: 'none',
                        }}
                      />
                    )}
                    <img
                      src={imgUrl}
                      alt="상품 이미지"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                      }}
                    />
                    {hoveredImgNo === item.imgNo && (
                      <button
                        type="button"
                        className="btn btn-sm btn-danger"
                        style={{
                          position: 'absolute',
                          top: '6px',
                          right: '6px',
                          padding: '2px 6px',
                          lineHeight: '1',
                        }}
                        onClick={() => handleDeleteImage(item.imgNo)}
                      >
                        X
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default GoodsImageManager;
