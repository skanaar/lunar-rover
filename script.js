var clock = new THREE.Clock();

var engine = buildEngine(64, window.innerWidth, window.innerHeight);
var quadtree;

init(engine);
animate();

function getMarker() {
	var geometry = new THREE.CylinderGeometry(0, 20, 100, 3);
	geometry.translate(0, 50, 0);
	geometry.rotateX(Math.PI / 2);
	return new THREE.Mesh(geometry, new THREE.MeshNormalMaterial());
}

function getBall() {
	var geometry = new THREE.IcosahedronGeometry(50, 2);
	geometry.translate(0, 0, 0);
	return new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({color: 0xffff00}));
}

function buildEngine(res, viewW, viewH) {
	var camera = new THREE.PerspectiveCamera(60, viewW / viewH, 1, 20000);
	var scene = new THREE.Scene();
	var controls = new THREE.OrbitControls(camera);
	controls.target.set(0.0, 100.0, 0.0);
	controls.userPanSpeed = 100;
	var data = generateHeight(res, res);
	controls.target.y = data[res/2 + res/2 * res] + 500;
	camera.position.y =  controls.target.y + 2000;
	camera.position.x = 2000;
	var geometry = new THREE.PlaneBufferGeometry(7500, 7500, res - 1, res - 1);
	geometry.rotateX(- Math.PI / 2);

	quadtree = quad.build(res, res, 6);

	// THIS
	//
	quad.perlinFill([100, 100, 100, 100], 2000, quadtree);
	// OR
	//
	//for (var x = 0; x < res; x++) {
	//	for (var y = 0; y < res; y++) {
	//		quad.at(quadtree, x, y).value = data[x+y*res];
	//	}
	//}
	//quad.precalculate(quadtree);

	var vertices = geometry.attributes.position.array;
	for (var i = 0; i < res; i++) {
		for (var j = 0; j < res; j++) {
			var lod_level = Math.floor(Math.max(Math.abs(i - res/2), Math.abs(j-res/2)) / 20);
			vertices[(i+j*res)*3 + 1] = -Math.floor(quad.at(quadtree, i, j, lod_level).value) ;//data[i];
		}
	}

	geometry.computeFaceNormals();
	geometry.computeVertexNormals();
	var mesh = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({color: 0xffaa00}));
	scene.add(mesh);

	var marker = getMarker();
	scene.add(marker);
	scene.add(getBall());
	var sun = new THREE.DirectionalLight(0xffffff, 1);
	sun.position.set(1000, 1000, 1000);
	scene.add( sun );
	var renderer = new THREE.WebGLRenderer();
	renderer.setClearColor(0x444444);
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);

	return {
		camera: camera,
		scene: scene,
		controls: controls,
		mesh: mesh,
		renderer: renderer,
		marker: marker,
		render: renderer.render.bind(renderer, scene, camera)
	};
}

function init(engine) {
	var container = document.getElementById('container');
	container.innerHTML = '';
	container.appendChild(engine.renderer.domElement);
	container.addEventListener('mousemove', onMouseMove, false);
	window.addEventListener('resize', onWindowResize, false);
}

function onWindowResize() {
	engine.camera.aspect = window.innerWidth / window.innerHeight;
	engine.camera.updateProjectionMatrix();
	engine.renderer.setSize(window.innerWidth, window.innerHeight);
}

function generateHeight(width, height) {
	var size = width * height;
	var data = new Uint16Array(size);
	var perlin = new ImprovedNoise();
	var z = Math.random() * 100;
	for (var i = 0; i < size; i ++) {
		var x = (i % width) / 10;
		var y = (Math.floor(i / width)) / 10;
		data[i] += (1+perlin.noise(x, y, z)) * 500;
	}

	return data;
}

function animate() {
	requestAnimationFrame(animate);
	render();
}

function render() {
	engine.controls.update(clock.getDelta());
	engine.render();
}

function onMouseMove(event) {
	var mouse = new THREE.Vector2();
	mouse.x = (event.clientX / engine.renderer.domElement.clientWidth) * 2 - 1;
	mouse.y = - (event.clientY / engine.renderer.domElement.clientHeight) * 2 + 1;
	var raycaster = new THREE.Raycaster();
	raycaster.setFromCamera(mouse, engine.camera);
	// See if the ray from the camera into the world hits one of our meshes
	var intersects = raycaster.intersectObject(engine.mesh);
	// Toggle rotation bool for meshes that we clicked
	if (intersects.length > 0) {
		engine.marker.position.set(0, 0, 0);
		engine.marker.lookAt(intersects[0].face.normal);
		engine.marker.position.copy(intersects[0].point);
	}
}
