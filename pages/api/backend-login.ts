import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('이게뜨나?');

  // 오직 POST 요청만 허용
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).end('Method Not Allowed')
  }

  const backendUrl = process.env.BACKEND_URL
  if (!backendUrl) {
    return res.status(500).json({ message: 'BACKEND_URL is not defined' })
  }

  try {
    console.log(`gogogo ${backendUrl}`)
    console.log(`gogogo ${backendUrl}`)

    // 클라이언트에서 넘겨준 body(id, password)를 백엔드로 전달
    const response = await fetch(`${backendUrl}/backoffice/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(req.body),
    })

    const data = await response.json()
    return res.status(response.status).json(data)
  } catch (error) {
    console.error('Proxy error:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}
