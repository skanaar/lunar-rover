function buildQuadtree(w, h, level) {
	return {
		nodes: !level ? [] : [
			buildQuadtree(w/2, h/2, level-1),
			buildQuadtree(w/2, h/2, level-1),
			buildQuadtree(w/2, h/2, level-1),
			buildQuadtree(w/2, h/2, level-1)
		],
		level: level,
		w: w,
		h: h,
		value: 0,
		min: 0,
		max: 0
	}
}

function rand(min, max) {
	return Math.random()*(max-min) + min;
}

function perlinFill(value, range, quadtree) {
	quadtree.value = value;
	quadtree.nodes.forEach(e => perlinFill(value + rand(-range, range), range/2, e))
}

function quadSet(node, x, y, value) {
	if (!node.nodes.length)
		node.value = value;
	else {
		var i = x < node.w/2 ? 0 : 1;
		var j = y < node.h/2 ? 0 : 1;
		quadSet(node.nodes[i+2*j], x-node.w/2, y-node.h/2, value);
	}
}

function quadAt(node, x, y) {
	if (!node.nodes.length)
		return node;
	var i = x < node.w/2 ? 0 : 1;
	var j = y < node.h/2 ? 0 : 1;
	return quadAt(node.nodes[i+2*j], x - i*node.w/2, y - j*node.h/2);
}

function draw(ctx, x, y, w, h, node) {
	if (!node.nodes.length) {
		ctx.fillStyle = 'rgba(0,0,0,' + node.value + ')';
		ctx.fillRect(x, y, w, h);
	}
	else {
		draw(ctx, x,     y,     w/2, h/2, node.nodes[0]);
		draw(ctx, x+w/2, y,     w/2, h/2, node.nodes[1]);
		draw(ctx, x,     y+h/2, w/2, h/2, node.nodes[2]);
		draw(ctx, x+w/2, y+h/2, w/2, h/2, node.nodes[3]);
	}
}

var qt = buildQuadtree(64, 64, 4);
perlinFill(0.5, 0.2, qt);
draw(ctx, 0, 0, 64, 64, qt);
