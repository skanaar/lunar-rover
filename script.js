var clock = new THREE.Clock();
var keys = {};

var viewer = buildViewer(window.innerWidth,
                         window.innerHeight,
                         window.devicePixelRatio)
var engine = buildEngine(64, viewer);

init(viewer);
animate();

function buildViewer(viewW, viewH, pixelRatio) {
  var camera = new THREE.PerspectiveCamera(60, viewW / viewH, 1, 20000);
  var controls = new THREE.OrbitControls(camera);
  controls.target.set(0, 0, 0);
  controls.userPanSpeed = 100;
  controls.target.y = 0;
  camera.position.y = 0;
  camera.position.x = 32;
  var renderer = new THREE.WebGLRenderer();
  renderer.setClearColor(0x444444);
  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(viewW, viewH);
  return {
    camera: camera,
    controls: controls,
    renderer: renderer,
    render: renderer.render.bind(renderer, camera)
  };
}

function buildEngine(res) {
  var scene = new THREE.Scene();
  var geometry = new THREE.PlaneBufferGeometry(res, res, res-1, res-1);
  geometry.rotateX(- Math.PI / 2);

  var quadtree = quad.build(res, res, 6);

  // THIS
  //
  quad.perlinFill([0, 0, 0, 0], 20, quadtree);
  // OR
  //
  // var data = generateHeight(res, res);
  //for (var x = 0; x < res; x++) {
  //  for (var y = 0; y < res; y++) {
  //    quad.at(quadtree, x, y).value = data[x+y*res];
  //  }
  //}
  //quad.precalculate(quadtree);

  var vertices = geometry.attributes.position.array;
  for (var i = 0; i < res; i++) {
    for (var j = 0; j < res; j++) {
      vertices[(i+j*res)*3 + 1] = quad.at(quadtree, i, j).value;//data[i];
    }
  }

  geometry.computeFaceNormals();
  geometry.computeVertexNormals();
  var material = new THREE.MeshPhongMaterial({color: 0xffaa00});
  var mesh = new THREE.Mesh(geometry, material);

  var sun = new THREE.DirectionalLight(0xffffff, 1);
  sun.position.set(1000, 1000, 1000);

  var wheel = new Wheel(0, 10, 0, 2);

  scene.add(mesh);
  scene.add(wheel.drawObject());
  scene.add(sun);

  return {
    scene: scene,
    mesh: mesh,
    wheel: wheel,
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
	var gravity = vec.Vec(0, -20, 0);
  var dt = clock.getDelta();
  viewer.controls.update(dt);
  engine.wheel.update(dt, gravity);
  engine.wheel.apply();
  engine.wheel.collisions(dt, engine.quadtree);
  viewer.renderer.render(engine.scene, viewer.camera);

  if (keys[87]) engine.wheel.addSpeed(0.6);
  if (keys[65]) engine.wheel.turn(-0.05); // left
  if (keys[83]) engine.wheel.addSpeed(-0.6);
  if (keys[68]) engine.wheel.turn(0.05); // right
}
