sigma.classes.graph.addMethod('neighbors', function (nodeId) {
	var k,
		neighbors = {},
		index = this.allNeighborsIndex[nodeId] || {};

	for (k in index)
		neighbors[k] = this.nodesIndex[k];

	return neighbors;
});

var i,
	N = 100,
	E = 500,
	s = new sigma(),
	cam = s.addCamera();

var settings = {
	batchEdgesDrawing: true,
	hideEdgesOnMove: false,
	defaultLabelColor: 'rgba(255,255,255,1)',
	defaultNodeColor: 'rgb(255,255,255)',
	defaultEdgeColor: 'rgba(255,255,255,0.0125)',
	edgeColor: 'default',
	drawLabels: true,
	defaultEdgeLabelColor: 'rgba(255,255,255,0.05)',
	defaultEdgeLabelActiveColor: 'rgba(255,255,255,1)',
	drawEdgeLabels: true,
	defaultEdgeType: 'def',
	edgeLabelSize: 'proportional'
};

var container = document.getElementById('container');

s.addRenderer({
	container: container,
	type: "canvas",
	camera: cam,
	settings
});

s.bind('clickStage', function (e) {
	s.graph.nodes().forEach(function (n) {
		n.color = n.originalColor;
	});

	s.graph.edges().forEach(function (e) {
		e.color = e.originalColor;
		e.active = false;
	});

	s.refresh();
});

s.bind('clickNode', function (e) {
	var nodeId = e.data.node.id,
		toKeep = s.graph.neighbors(nodeId);
		toKeep[nodeId] = e.data.node;

	s.graph.nodes().forEach(function (n) {
		if (toKeep[n.id]) {
			n.color = 'rgba(255,255,255,1)';
		} else {
			n.color = 'rgba(255,0,0,0.0.5)';
		}
	});

	s.graph.edges().forEach(function (e) {
		if (toKeep[e.source] && toKeep[e.target]) {
			e.active = true;
			e.color = 'rgba(255,255,255,0.125)';
		} else {
			e.active = false;
			e.color = 'rgba(255,0,0,0.0125)';
		}
	});

	s.refresh();
});

setTimeout(() => {
	s.startForceAtlas2({gravity: 9.82, slowDown: 1});
}, 10000);

setTimeout(() => {
	s.stopForceAtlas2();
}, 60000);

var edgeId = 0;

function crawl (url) {
	const fetchUrl = `/fetch?url=${encodeURIComponent(url)}`;

	return fetch (fetchUrl)
		.then(response => {
			return response.json();
		})
		.then(data => {
			return new Promise(resolve => {
				setTimeout(() => {
					return resolve(data);
				}, 100)
			})
		})
		.then(data => {
			var node = s.graph.nodes(url);

			if (!node) {
				node = {
					id: url,
					size: 10,
					x: Math.random() * 100,
					y: Math.random() * 100,
				};

				s.graph.addNode(node);
			}

			node.label = data.title;
			node.originalColor = settings.defaultNodeColor;

			data.links.forEach(link => {
				var linkNode = s.graph.nodes(link.href);

				if (!linkNode) {
					linkNode = {
						id: link.href,
						label: link.text,
						size: 10,
						x: Math.random() * 100,
						y: Math.random() * 100,
						color: 'rgba(255,0,0,0.5)',
						originalColor: 'rgba(255,0,0,0.5)'
					};

					s.graph.addNode(linkNode);
					crawl(link.href);
				} else {
					linkNode.size += 0.1;
					delete linkNode.color;
				}

				const edgeId = `${url}::${link.href}`;

				var edge = s.graph.edges(edgeId);

				if (!edge) {
					const edge = {
						id: edgeId,
						size: 10,
						source: url,
						target: link.href,
						type: 'line',
						label: link.text,
						color: settings.defaultEdgeColor
					};

					s.graph.addEdge(edge);
				} else {
					edge.size += 0.1;
					edge.label += ', ' + link.text;
				}
			});

			s.refresh();
		});
}

var url = getParameterByName('url');

crawl(url);

function getParameterByName(name, url) {
    if (!url) {
      url = window.location.href;
    }
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}
