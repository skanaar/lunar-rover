function generateLandscape(res, subdivs){

  var quadtree = quad.build(res, res, subdivs);

  // THIS
  //
  quad.perlinFill([0, 0, 0, 0], 14, quadtree);
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

  for (var c = 0; c<35; c++){
    var size = 20 * Math.pow(rand(0.5,1), 2);
    var depth = size*rand(0.02,1/6);
    addCrater(quadtree, rand(-10,res+10), rand(-10,res+10), size, depth)
  }

  quad.precalculate(quadtree);
  return quadtree;
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