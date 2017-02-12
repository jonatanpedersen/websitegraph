const express = require('express');
const request = require('request');
const htmlparser2 = require('htmlparser2');
const url = require('url');

function main () {
	const app = express();
	const port = process.env.PORT || 8877;

	app.get('/fetch', (req, res, next) => {
		const baseUrl = req.query.url;

		request(baseUrl, (err, response, body) => {
			if (err || response.statusCode !== 200) {
				return next(err);
			}
			
			var links = [];
			var tag;
			var link;
			var title;

			const parser = new htmlparser2.Parser({
				onopentag: (name, attrs) => {
					tag = name;
					link = null;
					
					if (name === 'a' && attrs.href) {
						const linkUrl = url.resolve(baseUrl, attrs.href);

						if (url.parse(linkUrl).host === url.parse(baseUrl).host && url.parse(linkUrl).protocol === url.parse(baseUrl).protocol) {
							link = {
								href: linkUrl
							};

							links.push(link);
						}
					}
				},
				ontext: text => {
					if (tag === 'a' && link) {
						link.text = text;
					}

					if (tag === 'title') {
						title = text;
					}
				}
			});

			parser.write(body);
			parser.end();

			res.json({title, links});
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