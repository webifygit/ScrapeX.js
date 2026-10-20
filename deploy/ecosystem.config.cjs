// PM2 process file. Run from the repo root:
//   pm2 startOrRestart deploy/ecosystem.config.cjs && pm2 save
module.exports = {
  apps: [
    {
      name: "scrapex",
      cwd: __dirname + "/..",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3100",
      env: { NODE_ENV: "production", PORT: "3100" },
      instances: 1,
      autorestart: true,
      max_memory_restart: "400M",
    },
  ],
};
