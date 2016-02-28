var clock = new THREE.Clock();

var viewer = buildViewer(window.innerWidth,
                         window.innerHeight,
                         window.devicePixelRatio)
var engine = buildEngine(128, viewer);

var cameraPos = vec.Vec();
var timestep = 2;
var showDebug = false;

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
  var quadtree = generateLandscape(res, 7);

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
	sun.shadow.camera.near = 100;
	sun.shadow.camera.far = 1500;
	sun.shadow.camera.fov = 50;
	sun.shadow.bias = 0.0001;
	sun.shadow.mapSize.width = 2048;
	sun.shadow.mapSize.height = 2048;

  var y = quad.valueAt(quadtree, 0, 0);

  var wheelA = new Wheel( 1, y + 4,  1, 0.6);
  var wheelB = new Wheel(-1, y + 4,  1, 0.6);
  var wheelC = new Wheel( 1, y + 4, -1, 0.6);
  var wheelD = new Wheel(-1, y + 4, -1, 0.6);
  var rover = new Rover(wheelA, wheelB, wheelC, wheelD, 2);

  scene.add(mesh);
  scene.add(sun);
  scene.add(rover.drawObject());
  scene.add(wheelA.drawObject());
  scene.add(wheelB.drawObject());
  scene.add(wheelC.drawObject());
  scene.add(wheelD.drawObject());

  rover.steer(0);

  var markerGeo = new THREE.SphereGeometry(0.2, 4, 4);
	var markerMaterial = new THREE.MeshBasicMaterial({color: 0xffff00});
  var marker = new THREE.Mesh(markerGeo, markerMaterial);
  scene.add(marker);
	var normalMarker = new THREE.Mesh(markerGeo.clone(), markerMaterial);
	scene.add(normalMarker);

  return {
    scene: scene,
    mesh: mesh,
    marker: marker,
    normalMarker: normalMarker,
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
  input.onNumber(function(i) { timestep = Math.exp(i/4) / 2 });
  input.on('i', function() { showDebug = !showDebug });
}

function onWindowResize() {
  viewer.camera.aspect = window.innerWidth / window.innerHeight;
  viewer.camera.updateProjectionMatrix();
  viewer.renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);
  update();
}

function simulate(dt, iterations) {
  var gravity = vec.Vec(0, -500, 0);
  var objs = engine.wheels.map(e => e.obj);
  dt *= timestep / iterations;
  for (var i=iterations; i; i--){
    engine.rover.update(dt, gravity, engine.quadtree);
    solveEuler(dt/2, objs);
    solveEuler(dt/2, objs);
    resetForces(objs);
  }
}

function update() {
  var dt = clock.getDelta();
  if (dt > 1) dt = 0.015; // pause simulation in background tabs
  viewer.controls.update(dt);

  var x = engine.rover.obj.pos.x;
  var z = engine.rover.obj.pos.z;
  var y = quad.valueAt(engine.quadtree, x, z);
  var n = quad.normalAt(engine.quadtree, x, z);
  engine.marker.position.set(x, y, z);
  engine.normalMarker.position.set(x+2*n.x, y+2*n.y, z+2*n.z);
  if (!showDebug) {
    engine.marker.position.set(0, -100, 0);
    engine.normalMarker.position.set(0, -100, 0);
  }

  //var p = vec.clone(engine.rover.obj.pos);
  //var pos = vec.add(p, vec.Vec(0,0,-10));
  //vec.multTo(cameraPos, 0.95);
  //vec.addTo(cameraPos, pos, 0.05);
  //viewer.camera.position.set(cameraPos.x, cameraPos.y + 5, cameraPos.z);
  //viewer.camera.lookAt(p.x, p.y-5, p.z);
  simulate(dt, 4);

  engine.rover.apply();

  if (input.up) engine.rover.addSpeed(20);
  if (input.down) engine.rover.addSpeed(-20);
  if (input.left) engine.rover.steer(-0.1);
  if (input.right) engine.rover.steer(0.1);
  engine.rover.steerAhead(0.1);

  viewer.renderer.render(engine.scene, viewer.camera);
}
