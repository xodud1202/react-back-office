import React from 'react';
import LazyQuillEditor from '@/components/common/editor/LazyQuillEditor';
import AdminFormTable from '@/components/common/AdminFormTable';
import type { BoardEditForm, CommonCode } from '@/components/board/types';

interface BoardEditModalProps {
  // 팝업 오픈 여부입니다.
  isOpen: boolean;
  // 등록 모드 여부입니다.
  isCreateMode: boolean;
  // 게시판 상세 구분 코드 목록입니다.
  detailDivList: CommonCode[];
  // 수정 폼 데이터입니다.
  editForm: BoardEditForm;
  // 저장 중 여부입니다.
  editSaving: boolean;
  // 에러 메시지입니다.
  editError: string | null;
  // 폼 입력 변경 처리입니다.
  onEditChange: (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  // 저장 처리입니다.
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  // 팝업 닫기 처리입니다.
  onClose: () => void;
  // Quill ref 객체입니다.
  quillRef: React.MutableRefObject<any>;
  // Quill modules 옵션입니다.
  quillModules: any;
  // Quill formats 옵션입니다.
  quillFormats: string[];
  // 에디터 변경 처리입니다.
  onEditorChange: (value: string) => void;
}

// 게시글 등록/수정 팝업을 렌더링합니다.
const BoardEditModal = ({
  isOpen,
  isCreateMode,
  detailDivList,
  editForm,
  editSaving,
  editError,
  onEditChange,
  onSubmit,
  onClose,
  quillRef,
  quillModules,
  quillFormats,
  onEditorChange,
}: BoardEditModalProps) => {
  if (!isOpen) {
    return null;
  }

  return (
    <>
      <div
        className="modal fade show"
        style={{
          display: 'flex',
          position: 'fixed',
          inset: 0,
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1060,
        }}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-dialog modal-lg" style={{ margin: 0, maxWidth: '90vw', width: '100%', maxHeight: '90vh' }}>
          <div className="modal-content" style={{ height: '90vh', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header position-relative">
              <h2 className="modal-title w-100 text-center">{isCreateMode ? '게시글 등록' : '게시글 수정'}</h2>
              <button type="button" className="btn p-0 position-absolute end-0 me-3" aria-label="닫기" onClick={onClose}>
                <i className="fa fa-window-close" aria-hidden="true"></i>
              </button>
            </div>
            <form className="modal-body" style={{ overflowY: 'auto', flex: 1 }} onSubmit={onSubmit}>
              {editError && <div className="text-danger mb-3">{editError}</div>}
              <AdminFormTable>
                <tbody>
                  <tr>
                    <th scope="row">게시판 상세 구분</th>
                    <td>
                      <select
                        name="boardDetailDivCd"
                        className="form-select"
                        value={editForm.boardDetailDivCd}
                        onChange={onEditChange}
                      >
                        <option value="">선택</option>
                        {detailDivList.map((code) => (
                          <option key={code.cd} value={code.cd}>{code.cdNm}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                  <tr>
                    <th scope="row">타이틀</th>
                    <td>
                      <input
                        type="text"
                        name="title"
                        className="form-control"
                        value={editForm.title}
                        onChange={onEditChange}
                      />
                    </td>
                  </tr>
                  <tr>
                    <th scope="row">본문</th>
                    <td>
                      <LazyQuillEditor
                        ref={quillRef}
                        theme="snow"
                        className="board-editor"
                        value={editForm.content}
                        onChange={onEditorChange}
                        modules={quillModules}
                        formats={quillFormats}
                      />
                    </td>
                  </tr>
                </tbody>
              </AdminFormTable>
              <div className="modal-footer">
                <button type="submit" className="btn btn-primary" disabled={editSaving}>
                  {editSaving ? '저장중...' : '저장'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={onClose}>
                  닫기
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <div
        className="modal-backdrop fade show"
        style={{ position: 'fixed', inset: 0, zIndex: 1055 }}
        onClick={onClose}
      ></div>
    </>
  );
};

export default BoardEditModal;
