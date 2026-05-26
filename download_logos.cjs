const https = require('https');
const fs = require('fs');
const path = require('path');

const download = (url, dest) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to get '${url}' (${response.statusCode})`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
};

const run = async () => {
  try {
    await download('https://storage.googleapis.com/aistudio-user-uploads/606990/image_1743198160408_a405903b.png', path.join(__dirname, 'public', 'logo2.png'));
    await download('https://storage.googleapis.com/aistudio-user-uploads/606990/image_1743198160408_40488f28.png', path.join(__dirname, 'public', 'logo1.png'));
    console.log('Logos downloaded successfully');
  } catch (e) {
    console.error(e);
  }
};
run();
