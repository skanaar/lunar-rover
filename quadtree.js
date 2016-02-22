var quad = {
	build: function buildQuadtree(w, h, level) {
		return {
			nodes: !level ? [] : [
				quad.build(w/2, h/2, level-1),
				quad.build(w/2, h/2, level-1),
				quad.build(w/2, h/2, level-1),
				quad.build(w/2, h/2, level-1)
			],
			level: level,
			w: w,
			h: h,
			value: 0,
			min: 0,
			max: 0
		}
	},
	at: function (node, x, y) {
		if (!node.nodes.length)
			return node;
		var i = x < node.w/2 ? 0 : 1;
		var j = y < node.h/2 ? 0 : 1;
		return quad.at(node.nodes[i+2*j], x - i*node.w/2, y - j*node.h/2);
	},
	perlinFill: function (value, range, quadtree) {
		quadtree.value = value;
		quadtree.nodes.forEach(function (e){
			quad.perlinFill(value + quad.rand(-range, range), range/2, e);
		});
	},
	rand: function (min, max) {
		return Math.random()*(max-min) + min;
	}
}
