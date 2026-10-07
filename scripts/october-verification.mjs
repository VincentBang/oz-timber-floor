import fs from 'node:fs';
const tag='<meta name="google-site-verification" content="QaPyqRWcckOb0jkUyaeeRYh6E49kBUF6CySJBpnXYGk">';
const file='index.html';
const html=fs.readFileSync(file,'utf8');
if (!html.includes('name="google-site-verification"')) fs.writeFileSync(file,html.replace('</head>',tag+'</head>'));
else if (!html.includes('QaPyqRWcckOb0jkUyaeeRYh6E49kBUF6CySJBpnXYGk')) throw new Error('Different verification tag: review instead of overwrite');
