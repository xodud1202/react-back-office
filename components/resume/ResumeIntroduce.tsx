import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';
import api from '@/utils/axios/axios';
import useQuillImageUpload from '@/hooks/useQuillImageUpload';

export interface ResumeIntroduceType {
  usrNo: string;
  introduce: string;
}

interface ResumeIntroduceProps {
  usrNo: string;
  onClose?: () => void;
}

// ref 전달을 위해 forwardRef로 감싼 에디터 컴포넌트를 동적으로 로드합니다.
const ReactQuill = dynamic(
  async () => {
    const mod = await import('react-quill-new');
    const Component = mod.default;
    const ForwardedQuill = React.forwardRef<any, React.ComponentProps<typeof Component>>((props, ref) => (
      <Component ref={ref} {...props} />
    ));
    ForwardedQuill.displayName = 'ResumeIntroduceQuill';
    return ForwardedQuill;
  },
  { ssr: false }
);

const ResumeIntroduce: React.FC<ResumeIntroduceProps> = ({ usrNo, onClose }) => {
  const [formData, setFormData] = useState<ResumeIntroduceType | null>(null);
  const [footerEl, setFooterEl] = useState<Element | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const quillToolbarOptions = useMemo(
    () => ([
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link'],
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

  useEffect(() => {
    if (!usrNo) return;

    // 자기소개 데이터를 조회합니다.
    const fetchIntroduce = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/api/admin/resume/introduce/${usrNo}`);
        const body = response.data;
        setFormData({
          usrNo,
          introduce: body?.introduce || '',
        });
      } catch (error) {
        console.error('Failed to fetch introduce data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchIntroduce();
  }, [usrNo]);
  useEffect(() => {
    if (typeof document !== 'undefined') {
      setFooterEl(document.querySelector('.modal-footer-actions'));
    }
  }, []);

  // 자기소개 저장을 처리합니다.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;

    setSaving(true);
    try {
      const response = await api.put(`/api/admin/resume/introduce/${usrNo}`, {
        usrNo,
        introduce: formData.introduce,
      });
      const body = response.data;
      if (body?.result === 'success') {
        alert(body.message);
        if (onClose) onClose();
      } else if (body?.message) {
        alert(body.message);
      }
    } catch (error) {
      console.error('Failed to update introduce data:', error);
    } finally {
      setSaving(false);
    }
  };

  const {
    quillRef,
    quillModules,
    quillFormats,
    handleEditorChange,
  } = useQuillImageUpload({
    toolbarOptions: quillToolbarOptions,
    formats: quillFormatsOptions,
    onChange: (value) => setFormData((prev) => ({
      ...(prev || {}),
      usrNo,
      introduce: value,
    })),
  });

  if (loading || !formData) {
    return <div>Loading...</div>;
  }

  return (
    <form id="resume-introduce-form" className="forms-sample" onSubmit={handleSubmit}>
      <h4 className="card-title text-center mb-3">자기소개</h4>
      <div className="mx-auto" style={{ maxWidth: '960px', width: '100%' }}>
        <div className="table-responsive">
          <table className="table table-bordered" style={{ tableLayout: 'fixed', width: '100%' }}>
            <colgroup>
              <col style={{ width: '18%' }} />
              <col style={{ width: '82%' }} />
            </colgroup>
            <tbody>
              <tr>
                <th className="align-middle">자기소개</th>
                <td>
                  <ReactQuill
                    ref={quillRef}
                    theme="snow"
                    value={formData.introduce || ''}
                    onChange={handleEditorChange}
                    modules={quillModules}
                    formats={quillFormats}
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      {footerEl && createPortal(
        <button type="submit" form="resume-introduce-form" disabled={saving} className="btn btn-primary">
          {saving ? '저장 중...' : '저장'}
        </button>,
        footerEl
      )}
    </form>
  );
};

export default ResumeIntroduce;
