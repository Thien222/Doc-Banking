module.exports = {
  apps: [
    {
      name: 'docbanking-server',
      script: './server/bin/www',
      cwd: './server',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G'
    },
    {
      name: 'docbanking-client',
      script: 'serve',
      args: '-s build -l 3000',
      cwd: './client',
      env: {
        NODE_ENV: 'production'
      },
      instances: 1,
      autorestart: true,
      watch: false
    }
  ]
};
