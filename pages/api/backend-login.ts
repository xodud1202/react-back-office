// pages/api/backend-login.ts
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const backendUrl = process.env.BACKEND_URL || `//127.0.0.1:3010`;
   console.log('📝 [backend-login] req.body =', req.body);
   console.log('📝 [backend-login] BACKEND_URL =', process.env.BACKEND_URL);

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  const { id, password } = req.body;

  try {
    const backendRes = await fetch(`${backendUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // 스프링 AuthController 에서는 UserBase.username, password 를 기대합니다
      body: JSON.stringify({ loginId: id, pwd: password })
    });

    const data = await backendRes.json();

    if (!backendRes.ok) {
      return res.status(backendRes.status).json(data)
    }

    // JWT 토큰을 그대로 클라이언트에 내려줍니다
    return res.status(200).json({ token: data.token || data.accessToken })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ message: '서버 호출 중 에러가 발생했습니다.' })
  }
}