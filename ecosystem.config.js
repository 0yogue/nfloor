module.exports = {
  apps: [{
    name: 'nfloor',
    script: 'npm',
    args: 'start',
    cwd: '/home/nfloor/nfloor',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    }
  }]
}
