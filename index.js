const express = require('express');
const request = require('request');
const htmlparser2 = require('htmlparser2');
const url = require('url');
const mime = require('mime');

function main () {
	const app = express();
	const port = process.env.PORT || 8877;

	mime.default_type = 'text/html';

	app.get('/fetch', (req, res, next) => {
		const baseUrl = req.query.url;
		const parsedBaseUrl = url.parse(baseUrl);

		request(baseUrl, (err, response, body) => {
			if (err || response.statusCode !== 200) {
				return next(err);
			}
			var mimeType = response.headers['content-type'] && response.headers['content-type'].split(' ')[0];
			var links = [];
			var tag;
			var link;
			var title = '';
			var level = 0;
			var main = null;

			const parser = new htmlparser2.Parser({
				onopentag: (name, attrs) => {
					level++;
					tag = name;
					link = null;

					if (name === 'main') {
						main = level;
					}

					if (main && name === 'a' && attrs.href) {
						const linkUrl = url.resolve(baseUrl, attrs.href);
						const parsedLinkUrl = url.parse(linkUrl);
						const linkMimeType = mime.lookup(linkUrl);

						if (linkMimeType === 'text/html' && !parsedLinkUrl.hash && parsedLinkUrl.host === parsedBaseUrl.host && parsedLinkUrl.protocol === parsedBaseUrl.protocol) {
							link = {
								href: linkUrl,
								mimeType: linkMimeType
							};

							links.push(link);
						}
					}
				},
				ontagclose: () => {
					if (main === level) {
						main = null;
					}

					level--;
				},
				ontext: text => {
					if (tag === 'a' && link) {
						link.text = text;
					}

					if (tag === 'title') {
						title += text;
					}
				}
			});

			parser.write(body);
			parser.end();

			res.json({title, links, mimeType});
		})
	});

	app.use(express.static('./public'));

	app.use((err, req, res, next) => {
		if (err) {
			console.error(err, err.stack);

			res.status(500);
			res.end();
		} else {
			next();
		}
	});

	app.listen(port, () => {
		console.log(`listening on port ${port}`);
	});
}

main();
