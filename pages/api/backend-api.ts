// pages/api/backend-api.ts
import type {NextApiRequest, NextApiResponse} from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!req.method) {
    return res.status(405).end(`request method is null`);
  } else if (!req.body.requestUri) {
    return res.status(405).end(`request uri is null`);
  }

  try {
    // API header 정보
    let requestHeader = {
      method: req.method,
      headers: {'Content-Type': 'application/json', Authorization: req.body.Authorization},
      // 스프링 AuthController 에서는 UserBase.username, password 를 기대합니다
      body: JSON.stringify(req.body.requestParam)
    };

    // API 전달 URL
    const backendUrl = process.env.BACKEND_URL || `//127.0.0.1:3010`;

    // API REQUEST
    const backendRes = await fetch(`${backendUrl}${req.body.requestUri}`, requestHeader);

    // API 결과 성공이든 실패든 return.
    return res.status(backendRes.status).json(await backendRes.json());
  } catch (e) {
    console.error(e)
    return res.status(500).json({message: '서버 호출 중 에러가 발생했습니다.'})
  }
}