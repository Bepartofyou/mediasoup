const fs = require('fs');
const { version } = require('./package.json');

function replaceVersion(file)
{
	const text = fs.readFileSync(file, { encoding: 'utf8' });
	const result = text.replace(/__MEDIASOUP_VERSION__/g, version);

	fs.writeFileSync(file, result, { encoding: 'utf8' });
}

replaceVersion('build/index.js');
replaceVersion('build/Worker.js');
