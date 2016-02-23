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
	at: function (node, x, y, maxDepth) {
		maxDepth = maxDepth || 0;
		if (node.level <= maxDepth || !node.nodes.length)
			return node;
		var i = x < node.w/2 ? 0 : 1;
		var j = y < node.h/2 ? 0 : 1;
		return quad.at(node.nodes[i+2*j], x - i*node.w/2, y - j*node.h/2, maxDepth);
	},
	randomFill: function (value, range, quadtree) {
		quadtree.value = value;
		quadtree.nodes.forEach(function (e){
			quad.perlinFill(value + quad.rand(-range, range), range/2, e);
		});
	},
	/// p: array of corner values, range: random deviation, node: quadtree root
	perlinFill: function (p, range, node) {
		function r(){ return quad.rand(-range, range) }
		node.value = (p[0] + p[1] + p[2] + p[3])/4 + r();
		if (!node.nodes.length) return;
		var a = p[0];
		var b = (p[0]+p[1])/2;
		var c = p[1];
		var d = (p[0]+p[2])/2;
		var e = (p[0]+p[1]+p[2]+p[3])/4 + r();
		var f = (p[1]+p[3])/2;
		var g = p[2];
		var h = (p[2]+p[3])/2;
		var i = p[3];
		quad.perlinFill([a,b,d,e], range/2, node.nodes[0]);
		quad.perlinFill([b,c,e,f], range/2, node.nodes[1]);
		quad.perlinFill([d,e,g,h], range/2, node.nodes[2]);
		quad.perlinFill([e,f,h,i], range/2, node.nodes[3]);
	},
	precalculate: function (node) {
		if (!node.nodes.length) {
			node.max = node.value;
			node.min = node.value;
		}
		else {
			var ns = node.nodes;
			ns.forEach(quad.precalculate);
			node.max = Math.max(ns[0].max, ns[1].max, ns[2].max, ns[3].max);
			node.min = Math.min(ns[0].min, ns[1].min, ns[2].min, ns[3].min);
			node.value = (ns[0].value + ns[1].value + ns[2].value + ns[3].value)/4;
		}
	},
	rand: function (min, max) {
		return Math.random()*(max-min) + min;
	}
}
