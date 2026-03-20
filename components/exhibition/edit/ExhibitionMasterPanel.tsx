import React, { useState } from 'react';
import LazyQuillEditor from '@/components/common/editor/LazyQuillEditor';

interface QuillEditorBinding {
  // Quill ref입니다.
  quillRef: React.MutableRefObject<any>;
  // Quill modules 설정입니다.
  quillModules: any;
  // Quill formats 설정입니다.
  quillFormats: string[];
  // 에디터 변경 처리입니다.
  handleEditorChange: (value: string) => void;
}

interface ExhibitionMasterPanelProps {
  // 로딩 여부입니다.
  loading: boolean;
  // 저장 여부입니다.
  masterSaving: boolean;
  // 썸네일 업로드 여부입니다.
  thumbnailUploading: boolean;
  // 수정 모드 여부입니다.
  isEditMode: boolean;
  // 기획전명입니다.
  exhibitionNm: string;
  // 노출 시작일입니다.
  dispStartDate: string;
  // 노출 종료일입니다.
  dispEndDate: string;
  // 노출 시작 시간입니다.
  dispStartHour: string;
  // 노출 종료 시간입니다.
  dispEndHour: string;
  // 리스트 노출여부입니다.
  listShowYn: string;
  // 노출여부입니다.
  showYn: string;
  // PC 상세 HTML입니다.
  exhibitionPcDesc: string;
  // MO 상세 HTML입니다.
  exhibitionMoDesc: string;
  // 썸네일 URL입니다.
  thumbnailUrl: string;
  // 시간 옵션입니다.
  hourOptions: string[];
  // 기획전명 변경 처리입니다.
  onChangeExhibitionNm: (value: string) => void;
  // 시작일 변경 처리입니다.
  onChangeDispStartDate: (value: string) => void;
  // 종료일 변경 처리입니다.
  onChangeDispEndDate: (value: string) => void;
  // 시작시간 변경 처리입니다.
  onChangeDispStartHour: (value: string) => void;
  // 종료시간 변경 처리입니다.
  onChangeDispEndHour: (value: string) => void;
  // 리스트 노출여부 변경 처리입니다.
  onChangeListShowYn: (value: string) => void;
  // 노출여부 변경 처리입니다.
  onChangeShowYn: (value: string) => void;
  // 썸네일 업로드 처리입니다.
  onThumbnailUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  // 썸네일 미리보기 열기 처리입니다.
  onOpenThumbnailPreview: () => void;
  // 저장 처리입니다.
  onSaveMaster: () => void;
  // PC 에디터 바인딩입니다.
  pcDescEditor: QuillEditorBinding;
  // MO 에디터 바인딩입니다.
  moDescEditor: QuillEditorBinding;
}

interface ExhibitionDescViewMode {
  // PC 상세 뷰 모드입니다.
  pc: 'editor' | 'html';
  // MO 상세 뷰 모드입니다.
  mo: 'editor' | 'html';
}

// 기획전 마스터 정보 패널을 렌더링합니다.
const ExhibitionMasterPanel = ({
  loading,
  masterSaving,
  thumbnailUploading,
  isEditMode,
  exhibitionNm,
  dispStartDate,
  dispEndDate,
  dispStartHour,
  dispEndHour,
  listShowYn,
  showYn,
  exhibitionPcDesc,
  exhibitionMoDesc,
  thumbnailUrl,
  hourOptions,
  onChangeExhibitionNm,
  onChangeDispStartDate,
  onChangeDispEndDate,
  onChangeDispStartHour,
  onChangeDispEndHour,
  onChangeListShowYn,
  onChangeShowYn,
  onThumbnailUpload,
  onOpenThumbnailPreview,
  onSaveMaster,
  pcDescEditor,
  moDescEditor,
}: ExhibitionMasterPanelProps) => {
  // PC/MO 상세를 에디터 또는 HTML 모드로 전환합니다.
  const [viewMode, setViewMode] = useState<ExhibitionDescViewMode>({
    pc: 'editor',
    mo: 'editor',
  });

  return (
    <>
      <div className="row">
        <div className="col-md-5">
          <div className="form-group">
            <label>기획전명</label>
            <input
              type="text"
              className="form-control"
              value={exhibitionNm}
              onChange={(event) => onChangeExhibitionNm(event.target.value)}
              maxLength={50}
            />
          </div>
        </div>
        <div className="col-md-3">
          <div className="form-group">
            <label>노출시작일시</label>
            <div className="d-flex gap-2">
              <input
                type="date"
                className="form-control"
                value={dispStartDate}
                onChange={(event) => onChangeDispStartDate(event.target.value)}
              />
              <select className="form-select w-auto" value={dispStartHour} onChange={(event) => onChangeDispStartHour(event.target.value)}>
                {hourOptions.map((hour) => (
                  <option key={hour} value={hour}>
                    {hour}시
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="form-group">
            <label>노출종료일시</label>
            <div className="d-flex gap-2">
              <input
                type="date"
                className="form-control"
                value={dispEndDate}
                onChange={(event) => onChangeDispEndDate(event.target.value)}
              />
              <select className="form-select w-auto" value={dispEndHour} onChange={(event) => onChangeDispEndHour(event.target.value)}>
                {hourOptions.map((hour) => (
                  <option key={hour} value={hour}>
                    {hour}시
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
      <div className="row">
        <div className="col-md-2">
          <div className="form-group">
            <label>리스트노출여부</label>
            <select className="form-select" value={listShowYn} onChange={(event) => onChangeListShowYn(event.target.value)}>
              <option value="Y">Y</option>
              <option value="N">N</option>
            </select>
          </div>
        </div>
        <div className="col-md-2">
          <div className="form-group">
            <label>노출여부</label>
            <select className="form-select" value={showYn} onChange={(event) => onChangeShowYn(event.target.value)}>
              <option value="Y">Y</option>
              <option value="N">N</option>
            </select>
          </div>
        </div>
      </div>
      <div className="row">
        <div className="col-md-3">
          <div className="form-group">
            <label>기획전 썸네일(750x1024)</label>
            <input
              type="file"
              className="form-control"
              accept="image/*"
              onChange={onThumbnailUpload}
              disabled={loading || thumbnailUploading || !isEditMode}
            />
            <small className="text-muted d-block mt-1">
              {isEditMode ? '썸네일 업로드를 통해 노출 이미지를 등록해주세요.' : '기획전 등록 후 썸네일 업로드가 가능합니다.'}
            </small>
          </div>
        </div>
        <div className="col-md-3">
          <div className="form-group">
            <label>썸네일 미리보기</label>
            {thumbnailUrl ? (
              <img
                src={thumbnailUrl}
                alt="기획전 썸네일"
                className="border rounded"
                style={{ width: '100%', maxHeight: '140px', objectFit: 'contain', cursor: 'pointer' }}
                onClick={onOpenThumbnailPreview}
              />
            ) : (
              <div className="text-muted">등록된 썸네일이 없습니다.</div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3">
        <label className="d-block mb-2">PC 상세</label>
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
        <div className="exhibition-desc-editor">
          {viewMode.pc === 'editor' ? (
            <LazyQuillEditor
              id="exhibition-pc-desc"
              ref={pcDescEditor.quillRef}
              theme="snow"
              className="board-editor"
              value={exhibitionPcDesc}
              onChange={pcDescEditor.handleEditorChange}
              modules={pcDescEditor.quillModules}
              formats={pcDescEditor.quillFormats}
            />
          ) : (
            <textarea
              className="form-control exhibition-desc-html"
              value={exhibitionPcDesc}
              onChange={(event) => pcDescEditor.handleEditorChange(event.target.value)}
            />
          )}
        </div>
      </div>
      <div className="mt-4">
        <label className="d-block mb-2">MO 상세</label>
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
        <div className="exhibition-desc-editor">
          {viewMode.mo === 'editor' ? (
            <LazyQuillEditor
              id="exhibition-mo-desc"
              ref={moDescEditor.quillRef}
              theme="snow"
              className="board-editor"
              value={exhibitionMoDesc}
              onChange={moDescEditor.handleEditorChange}
              modules={moDescEditor.quillModules}
              formats={moDescEditor.quillFormats}
            />
          ) : (
            <textarea
              className="form-control exhibition-desc-html"
              value={exhibitionMoDesc}
              onChange={(event) => moDescEditor.handleEditorChange(event.target.value)}
            />
          )}
        </div>
      </div>
      <div className="d-flex justify-content-end mt-4">
        <button
          type="button"
          className="btn btn-primary"
          onClick={onSaveMaster}
          disabled={loading || masterSaving || thumbnailUploading}
        >
          {masterSaving ? '저장중...' : '저장'}
        </button>
      </div>
      <style jsx>{`
        .exhibition-desc-editor :global(.ql-container) {
          height: 500px;
        }
        .exhibition-desc-editor :global(.ql-editor) {
          min-height: 500px;
          max-height: 500px;
          height: 500px;
        }
        .exhibition-desc-editor :global(.ql-editor img) {
          width: unset;
          max-width: 100%;
          height: auto;
          border-radius: 0;
        }
        .exhibition-desc-html {
          height: 500px;
          resize: vertical;
        }
      `}</style>
    </>
  );
};

export default ExhibitionMasterPanel;
