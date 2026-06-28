import { Client } from 'ssh2';

const conn = new Client();

const config = {
  host: '157.15.40.27',
  port: 3176,
  username: 'root',
  password: '@amuy6u7'
};

conn.on('ready', () => {
  console.log('SSH Client :: ready');
  
  const cmds = [
    'cd /root/chikoattendance || cd /var/www/chikoattendance',
    'pwd',
    'git fetch origin',
    'git reset --hard origin/main',
    'git pull origin main',
    'cd backend',
    'npm install',
    'npm run build',
    'pm2 restart all',
    'echo "Deployment Finished Successfully!"'
  ].join(' && ');

  console.log('Executing command on VPS:', cmds);

  conn.exec(cmds, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      console.log('Stream :: close :: code: ' + code + ', signal: ' + signal);
      conn.end();
    }).on('data', (data) => {
      console.log('STDOUT: ' + data);
    }).stderr.on('data', (data) => {
      console.log('STDERR: ' + data);
    });
  });
}).connect(config);
