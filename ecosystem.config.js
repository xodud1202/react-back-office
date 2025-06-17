module.exports = {
    apps: [
        {
            name: "react-back-office",
            script: "npm",
            args: "start",
            autorestart: false,
            max_memory_restart: "200M"
        }
    ]
}