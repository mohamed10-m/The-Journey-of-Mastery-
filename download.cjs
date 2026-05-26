const https = require('https');
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'public', 'data');
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir, { recursive: true });
}

const file = fs.createWriteStream(path.join(dir, 'quran.json'));
https.get('https://api.alquran.cloud/v1/quran/quran-uthmani', function(response) {
  response.pipe(file);
  file.on('finish', function() {
    file.close();
    console.log('Download completed');
  });
}).on('error', function(err) {
  fs.unlink(path.join(dir, 'quran.json'), () => {});
  console.error('Error downloading:', err.message);
});
