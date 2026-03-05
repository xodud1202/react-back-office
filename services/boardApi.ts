import api from '@/utils/axios/axios';
import type { BoardData, BoardEditForm, BoardListResponse, CommonCode } from '@/components/board/types';

/**
 * 게시판 상세 구분 공통코드를 조회합니다.
 * @returns 게시판 상세 구분 코드 목록입니다.
 */
export const fetchBoardDetailDivListApi = async (): Promise<CommonCode[]> => {
  const response = await api.get('/api/admin/common/code', {
    params: { grpCd: 'BOARD_DETAIL_DIV' },
  });
  return response.data || [];
};

/**
 * 게시글 상세를 조회합니다.
 * @param boardNo 게시글 번호입니다.
 * @returns 게시글 상세 데이터입니다.
 */
export const fetchBoardDetailApi = async (boardNo: number): Promise<BoardData | null> => {
  const response = await api.get('/api/admin/board/detail', { params: { boardNo } });
  return response.data || null;
};

/**
 * 게시글 목록을 조회합니다.
 * @param params 검색/페이징 파라미터입니다.
 * @returns 게시글 목록 응답입니다.
 */
export const fetchBoardListApi = async (params: Record<string, any>): Promise<BoardListResponse> => {
  const response = await api.get('/api/admin/board/list', { params });
  return (response.data || {}) as BoardListResponse;
};

/**
 * 게시글을 등록 또는 수정합니다.
 * @param editForm 수정 폼 데이터입니다.
 * @param isCreateMode 등록 모드 여부입니다.
 * @param usrNo 사용자 번호입니다.
 */
export const saveBoardApi = async (editForm: BoardEditForm, isCreateMode: boolean, usrNo: number) => {
  const apiUrl = isCreateMode ? '/api/admin/board/create' : '/api/admin/board/update';
  await api.post(apiUrl, {
    boardNo: editForm.boardNo,
    boardDetailDivCd: editForm.boardDetailDivCd,
    title: editForm.title,
    content: editForm.content,
    regNo: isCreateMode ? usrNo : undefined,
    udtNo: usrNo,
  });
};

/**
 * 게시글을 삭제합니다.
 * @param boardNo 게시글 번호입니다.
 * @param usrNo 사용자 번호입니다.
 */
export const deleteBoardApi = async (boardNo: number, usrNo: number) => {
  await api.post('/api/admin/board/delete', {
    boardNo,
    udtNo: usrNo,
  });
};
