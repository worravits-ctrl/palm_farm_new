const http = require('http');
const fs = require('fs');
const path = require('path');

const port = 3000;

const server = http.createServer((req, res) => {
    console.log('Request URL:', req.url);
    
    // Handle different routes
    let filePath;
    if (req.url === '/' || req.url === '/index.html') {
        filePath = path.join(__dirname, 'palm-oil-database-app.html');
    } else if (req.url === '/app') {
        filePath = path.join(__dirname, 'palm-oil-database-app.html');
    } else if (req.url === '/old') {
        filePath = path.join(__dirname, 'palm-oil-app.html');
    } else if (req.url === '/db' || req.url === '/db-viewer') {
        filePath = path.join(__dirname, 'public', 'db-viewer.html');
    } else {
        filePath = path.join(__dirname, req.url);
    }
    
    console.log('Serving file:', filePath);

    const extname = String(path.extname(filePath)).toLowerCase();
    const mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.jsx': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.wav': 'audio/wav',
        '.mp4': 'video/mp4',
        '.woff': 'application/font-woff',
        '.ttf': 'application/font-ttf',
        '.eot': 'application/vnd.ms-fontobject',
        '.otf': 'application/font-otf',
        '.wasm': 'application/wasm'
    };

    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code == 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 Not Found</h1><p>ไม่พบไฟล์: ' + filePath + '</p>', 'utf-8');
            } else {
                res.writeHead(500);
                res.end('Server Error: ' + error.code, 'utf-8');
            }
        } else {
            res.writeHead(200, { 
                'Content-Type': contentType,
                'Access-Control-Allow-Origin': '*'
            });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(port, () => {
    console.log(`🚀 Frontend Server running at http://localhost:${port}/`);
    console.log('📁 Files available:');
    console.log('   http://localhost:3000/ - Palm Oil App (Database Version)');
    console.log('   http://localhost:3000/old - Palm Oil App (LocalStorage Version)');
    console.log('   http://localhost:3000/db - Database Viewer (Admin)');
    console.log('🔗 API Server: http://localhost:3001');
    console.log('💡 กดปุ่ม Ctrl+C เพื่อหยุด server');
});