module.exports = {
    apps: [
        {
            name: "react-back-office",
            // npm start 대신 next를 직접 실행
            script: "./node_modules/next/dist/bin/next",
            args: "start",
            // 메모리 제한을 현실적으로 조정 (또는 삭제)
            max_memory_restart: "200M",
            // 재시작 전략 수정
            autorestart: true,
            watch: false,
            env: {
                NODE_ENV: "production"
            }
        }
    ]
}