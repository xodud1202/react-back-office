import React, { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import api from '@/utils/axios/axios';

export interface ResumeIntroduceType {
  usrNo: string;
  introduce: string;
}

interface ResumeIntroduceProps {
  usrNo: string;
  onClose?: () => void;
}

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

const ResumeIntroduce: React.FC<ResumeIntroduceProps> = ({ usrNo, onClose }) => {
  const [formData, setFormData] = useState<ResumeIntroduceType | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const quillModules = useMemo(
    () => ({
      toolbar: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['link'],
        ['clean'],
      ],
    }),
    []
  );

  useEffect(() => {
    if (!usrNo) return;

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

  if (loading || !formData) {
    return <div>Loading...</div>;
  }

  return (
    <form className="" onSubmit={handleSubmit}>
      <div className="text-[24px] font-bold text-center mb-[10px]">자기소개</div>
      <table className="w-full table-fixed border-collapse">
        <tbody>
          <tr>
            <th className="p-2 text-left bg-blue-50 w-1/6">자기소개</th>
            <td className="p-2">
              <ReactQuill
                theme="snow"
                value={formData.introduce || ''}
                onChange={(value) => setFormData({ ...formData, introduce: value })}
                modules={quillModules}
              />
            </td>
          </tr>
        </tbody>
      </table>
      <div className="mt-4 flex justify-end">
        <button type="submit" disabled={saving} className="m-auto px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-500 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-60">
          {saving ? '저장 중...' : '저장'}
        </button>
      </div>
    </form>
  );
};

export default ResumeIntroduce;
