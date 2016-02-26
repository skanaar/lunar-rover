var clock = new THREE.Clock();
var keys = {};

var viewer = buildViewer(window.innerWidth,
                         window.innerHeight,
                         window.devicePixelRatio)
var engine = buildEngine(128, viewer);

var cameraPos = vec.Vec();

init(viewer);
animate();

function buildViewer(viewW, viewH, pixelRatio) {
  var camera = new THREE.PerspectiveCamera(60, viewW / viewH, 1, 20000);
  var controls = new THREE.OrbitControls(camera);
  controls.target.set(0, 0, 0);
  controls.userPanSpeed = 100;
  controls.target.y = 0;
  camera.position.y = 16;
  camera.position.x = 50;
  var renderer = new THREE.WebGLRenderer();
  renderer.setClearColor(0x000000);
  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(viewW, viewH);
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFShadowMap;
  return {
    camera: camera,
    controls: controls,
    renderer: renderer,
    render: renderer.render.bind(renderer, camera)
  };
}

function buildEngine(res) {
  var quadtree = quad.build(res, res, 7);

  // THIS
  //
  quad.perlinFill([0, 0, 0, 0], 12, quadtree);
  // OR
  //
  // var data = generateHeight(res, res);
  //for (var x = 0; x < res; x++) {
  //  for (var y = 0; y < res; y++) {
  //    quad.at(quadtree, x, y).value = data[x+y*res];
  //  }
  //}
  //quad.precalculate(quadtree);

  function craterOffset(height, x){
  	x = Math.min(x, 1);
  	return height*(Math.pow(Math.sin(x*x*3),2) + (x*x-1)*1.5);
  }

  function addCrater(terrain, x, y, r, height){
	  for (var i = -r; i < r; i++) {
	    for (var j = -r; j < r; j++) {
	    	if (j+y<1 || j+y>res-1 || i+x<1 || i+x>res-1) continue;
	    	var offset = craterOffset(height, Math.sqrt(i*i+j*j)/r);
	      quad.at(terrain, x+i, y+j).value += offset;
	    }
	  }
  }

  function rand(min, max){
  	return Math.random() * (max-min) + min;
  }

  for (var c = 0; c<25; c++){
  	var size = 20 * Math.pow(rand(0.5,1), 2);
  	var depth = size*rand(0.02,1/6);
  	addCrater(quadtree, rand(-10,res+10), rand(-10,res+10), size, depth)
  }

  quad.precalculate(quadtree);

  var scene = new THREE.Scene();
  var geometry = new THREE.PlaneBufferGeometry(res, res, res-1, res-1);
  geometry.rotateX(- Math.PI / 2);

  var vertices = geometry.attributes.position.array;
  for (var i = 0; i < res; i++) {
    for (var j = 0; j < res; j++) {
      vertices[(i+j*res)*3 + 1] = quad.at(quadtree, i, j).value;
    }
  }

  geometry.computeFaceNormals();
  geometry.computeVertexNormals();
  var material = new THREE.MeshPhongMaterial({color: 0x888888});
  var mesh = new THREE.Mesh(geometry, material);
	mesh.receiveShadow = true;

  var sun = new THREE.SpotLight(0xffffff, 1, 0, Math.PI / 2);
  sun.position.set(100, 100, 100);
  sun.target.position.set(0, 0, 0);

	sun.castShadow = true;
	sun.shadowCameraNear = 100;
	sun.shadowCameraFar = 1500;
	sun.shadowCameraFov = 50;
	sun.shadowBias = 0.0001;
	sun.shadowMapWidth = 2048;
	sun.shadowMapHeight = 2048;

  var wheelA = new Wheel( 1, 10,  1, 0.6);
  var wheelB = new Wheel(-1, 10,  1, 0.6);
  var wheelC = new Wheel( 1, 10, -1, 0.6);
  var wheelD = new Wheel(-1, 10, -1, 0.6);
  var rover = new Rover(wheelA, wheelB, wheelC, wheelD, 2);

  scene.add(mesh);
  scene.add(sun);
  scene.add(rover.drawObject());
  scene.add(wheelA.drawObject());
  scene.add(wheelB.drawObject());
  scene.add(wheelC.drawObject());
  scene.add(wheelD.drawObject());

  rover.steer(0);

  var markerGeo = new THREE.SphereGeometry(0.1, 4, 4);
	var markerMaterial = new THREE.MeshBasicMaterial({color: 0xffff00});
	var marker = new THREE.Mesh(markerGeo, markerMaterial);
	scene.add(marker);

  return {
    scene: scene,
    mesh: mesh,
    marker: marker,
    wheels: [wheelA, wheelB, wheelC, wheelD],
    rover: rover,
  	quadtree: quadtree
  };
}

function init(viewer) {
  var container = document.getElementById('container');
  container.innerHTML = '';
  container.appendChild(viewer.renderer.domElement);
  window.addEventListener('resize', onWindowResize);
  document.addEventListener('keydown', function(event) {
  	keys[event.keyCode] = true;
	});
  document.addEventListener('keyup', function(event) {
  	keys[event.keyCode] = false;
	});
}

function onWindowResize() {
  viewer.camera.aspect = window.innerWidth / window.innerHeight;
  viewer.camera.updateProjectionMatrix();
  viewer.renderer.setSize(window.innerWidth, window.innerHeight);
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
	var gravity = vec.Vec(0, -400, 0);
  var dt = clock.getDelta();
  viewer.controls.update(dt);

  var x = engine.rover.obj.pos.x;
  var z = engine.rover.obj.pos.z;
  engine.marker.position.set(x, quad.valueAt(engine.quadtree, x, z), z);

  //var p = vec.clone(engine.rover.obj.pos);
  //var pos = vec.add(p, vec.Vec(0,0,-10));
  //vec.multTo(cameraPos, 0.95);
  //vec.addTo(cameraPos, pos, 0.05);
  //viewer.camera.position.set(cameraPos.x, cameraPos.y + 5, cameraPos.z);
  //viewer.camera.lookAt(p.x, p.y-5, p.z);

  solveEuler(dt, engine.wheels.map(e => e.obj));
  //solveLeapfrog(dt, engine.wheels.map(e => e.obj));

	engine.rover.update(dt, gravity, engine.quadtree);
	engine.rover.apply();
  if (keys[87]) engine.rover.addSpeed(20);
  if (keys[83]) engine.rover.addSpeed(-20);
  if (keys[65]) engine.rover.steer(-0.075); // left
  if (keys[68]) engine.rover.steer(0.075); // right

  viewer.renderer.render(engine.scene, viewer.camera);
}
