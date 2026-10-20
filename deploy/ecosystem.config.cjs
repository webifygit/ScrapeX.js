// PM2 process file. Run from the repo root:
//   pm2 startOrRestart deploy/ecosystem.config.cjs && pm2 save
module.exports = {
  apps: [
    {
      name: "scrapex",
      cwd: __dirname + "/..",
      script: "node_modules/next/dist/bin/next",
      // Loopback only: nginx is the public entry point.
      args: "start -p 3300 -H 127.0.0.1",
      exec_mode: "fork",
      env: { NODE_ENV: "production", PORT: "3300" },
      autorestart: true,
      max_memory_restart: "400M",
    },
  ],
};
