import React, {useEffect, useState} from 'react'
import {useRouter} from 'next/router'
import api, { ensureAccessToken, setAccessToken } from '@/utils/axios/axios';
import {setCookie} from 'cookies-next';
import {useAppDispatch} from '@/utils/hooks/redux';
import {loginSuccess} from '@/store/loginUser/loginUser';

export default function Login() {
  const dispatch = useAppDispatch();
  // const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const [id, setId] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    ensureAccessToken()
      .then((token) => {
        if (token) {
          router.replace('/main');
        }
      })
      .catch(() => {
        // 아무 처리를 하지 않음
      });
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const requestParam = {
      loginId: id,
      pwd: password,
      rememberMe: rememberMe
    };

    try {
      const response = await api.post('/api/backoffice/login', requestParam);
      const body = response.data;

      setAccessToken(body.accessToken);

      const cookieOptions = {
        path: '/',
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        maxAge: 30 * 60,
      };

      setCookie('loginId', body.userInfo.loginId, cookieOptions);
      setCookie('userNm', body.userInfo.userNm, cookieOptions);
      setCookie('usrNo', body.userInfo.usrNo, cookieOptions);

      const userData = {
        usrNo: body.userInfo.usrNo,
        userNm: body.userInfo.userNm,
        loginId: body.userInfo.loginId,
        hPhoneNo: body.userInfo.hPhoneNo,
        email: body.userInfo.email,
        usrGradeCd: body.userInfo.usrGradeCd,
        usrStatCd: body.userInfo.usrStatCd
      };

      dispatch(loginSuccess(userData));
      router.replace('/');
    } catch (e: any) {
      alert('로그인 실패: ' + (e.message ?? '알 수 없는 오류'));
    }
  }
  return (
    <div className="container-scroller">
      <div className="container-fluid page-body-wrapper full-page-wrapper">
        <div className="row w-100">
          <div className="content-wrapper full-page-wrapper d-flex align-items-center auth login-bg">
            <div className="card col-lg-4 mx-auto">
              <div className="card-body px-5 py-5">
                <h3 className="card-title text-start mb-3">로그인</h3>
                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label>아이디 *</label>
                    <input
                      type="text"
                      className="form-control p_input"
                      value={id}
                      onChange={e => setId(e.target.value)}
                      required
                      placeholder="아이디를 입력하세요"
                    />
                  </div>
                  <div className="form-group">
                    <label>비밀번호 *</label>
                    <input
                      type="password"
                      className="form-control p_input"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      placeholder="비밀번호를 입력하세요"
                    />
                  </div>
                  <div className="form-group d-flex align-items-center justify-content-between">
                    <div className="form-check">
                      <label className="form-check-label">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={rememberMe}
                          onChange={e => setRememberMe(e.target.checked)}
                        /> 로그인 상태 유지
                        <i className="input-helper"></i>
                      </label>
                    </div>
                    <a href="#" className="forgot-pass">비밀번호 찾기</a>
                  </div>
                  {error && (
                    <div className="text-danger small mb-3">
                      {error}
                    </div>
                  )}
                  <div className="text-center d-grid gap-2">
                    <button type="submit" className="btn btn-primary btn-block enter-btn">
                      로그인
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          {/* content-wrapper ends */}
        </div>
        {/* row ends */}
      </div>
      {/* page-body-wrapper ends */}
    </div>
  )
}
