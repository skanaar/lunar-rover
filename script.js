var cameraPos = vec.Vec(100,100,100);
var timestep = 2;
var showDebug = false;
var showOverview = false;
var isPaused = false;
var unit = {
  '#scout': 0.25,
  '#ranger': 0.60,
  '#juggernaut': 1.5
}[location.hash] || 0.4

var clock = new THREE.Clock();

var viewer = buildViewer(window.innerWidth,
                         window.innerHeight,
                         window.devicePixelRatio)
var engine = buildEngine(256, viewer);

init(viewer);
animate();

function buildViewer(viewW, viewH, pixelRatio) {
  var camera = new THREE.PerspectiveCamera(60, viewW / viewH, 1, 20000);
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
    //controls: controls,
    renderer: renderer,
    render: renderer.render.bind(renderer, camera)
  };
}

function buildEngine(res) {
  var quadtree = generateLandscape(res, 8);

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
  sun.position.set(250, 70, 0);
  sun.target.position.set(0, 0, 0);

	sun.castShadow = true;
	sun.shadow.camera.near = 100;
	sun.shadow.camera.far = 1500;
	sun.shadow.camera.fov = 60;
	sun.shadow.bias = 0.0001;
	sun.shadow.mapSize.width = 2048;
	sun.shadow.mapSize.height = 2048;

  var y = quad.valueAt(quadtree, 0, 0);

  var wheelA = new Wheel( unit, y + 4,  unit, unit*0.6);
  var wheelB = new Wheel(-unit, y + 4,  unit, unit*0.6);
  var wheelC = new Wheel( unit, y + 4, -unit, unit*0.6);
  var wheelD = new Wheel(-unit, y + 4, -unit, unit*0.6);
  var rover = new Rover(wheelA, wheelB, wheelC, wheelD, 2*unit);

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
  input.on(' ', function() { showOverview = !showOverview });
  input.on('p', function() { isPaused = !isPaused });
}

function onWindowResize() {
  viewer.camera.aspect = window.innerWidth / window.innerHeight;
  viewer.camera.updateProjectionMatrix();
  viewer.renderer.setSize(window.innerWidth, window.innerHeight);
}
var even = true;
function animate() {
  requestAnimationFrame(animate);
  even = !even;
  if (even) update();
}

function simulate(dt, iterations) {
  var gravity = vec.Vec(0, -300, 0);
  var objs = engine.wheels.map(e => e.obj);
  dt *= timestep / iterations;
  for (var i=iterations; i; i--){
    engine.rover.update(dt, gravity, engine.quadtree);
    solveEuler(dt/2, objs);
    solveEuler(dt/2, objs);
    resetForces(objs);
  }
}

function updateDebugInfo() {
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
}

function updateChaseCam() {
  var p = vec.clone(engine.rover.obj.pos);
  var dir = engine.rover.dir;
  var camDist = showOverview ? 40 : 8*unit;
  var pos = vec.add(p, vec.Vec(dir.x*-camDist, camDist, dir.z*-camDist));
  vec.multTo(cameraPos, 0.98);
  vec.addTo(cameraPos, pos, 0.02);
  viewer.camera.position.set(cameraPos.x, cameraPos.y, cameraPos.z);
  viewer.camera.lookAt(new THREE.Vector3(p.x, p.y, p.z));
}

function update() {
  var dt = clock.getDelta();
  if (dt > 1) dt = 0.015; // pause simulation in background tabs

  if (!isPaused){
    updateDebugInfo();
    updateChaseCam();

    simulate(dt, 4);

    engine.rover.apply();

    if (input.up) engine.rover.addSpeed(10);
    if (input.down) engine.rover.addSpeed(-10);
    if (input.left) engine.rover.steer(-0.025);
    if (input.right) engine.rover.steer(0.025);
    engine.rover.steerAhead(0.1);
  }

  viewer.renderer.render(engine.scene, viewer.camera);
}
