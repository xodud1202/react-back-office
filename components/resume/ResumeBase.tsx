import React, { useState, useEffect } from 'react';

interface ResumeBaseProps {
  usrNo: string;
}

const ResumeBase: React.FC<ResumeBaseProps> = ({ usrNo }) => {
  const [resumeData, setResumeData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResumeData = async () => {
      setLoading(true);
      try {
        const requestUri = `/api/admin/resume/${usrNo}`;
        const response = await fetch('/api/backend-api', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requestUri, requestParam: { method: 'GET' } })
        });

        if (response.ok) {
          const data = await response.json();
          setResumeData(data);
        } else {
          console.error('Failed to fetch resume data');
        }
      } catch (error) {
        console.error('Error fetching resume data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (usrNo) {
      fetchResumeData();
    }
  }, [usrNo]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!resumeData) {
    return <div>이력서 정보를 불러오지 못했습니다.</div>;
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">이력서 기본 정보</h2>
      <p><strong>사용자 번호:</strong> {resumeData.usrNo}</p>
      <p><strong>사용자 계정:</strong> {resumeData.loginId}</p>
      <p><strong>사용자명:</strong> {resumeData.userNm}</p>
      {/* 추가적인 이력서 정보 필드들을 여기에 표시 */}
    </div>
  );
};

export default ResumeBase;
