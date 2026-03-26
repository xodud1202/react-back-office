module.exports = {
    apps: [
        {
            name: "react-backoffice",
            // standalone 빌드 결과물의 서버 엔트리를 PM2로 직접 실행합니다.
            cwd: __dirname,
            script: "./server.js",
            interpreter: "node",
            // 메모리 제한을 현실적으로 조정 (또는 삭제)
            max_memory_restart: "300M",
            // 재시작 전략 수정
            autorestart: false,
            watch: false,
            env: {
                HOSTNAME: "0.0.0.0",
                PORT: 3011,
                NODE_ENV: "production"
            }
        }
    ]
}
