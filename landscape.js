
var perlin = ImprovedNoise();
function terrainHeightAt(x, y, sampleSize){
  var levelOfDetail = Math.round(8 - Math.log(sampleSize) / Math.LN2);
  var z = 16*perlin(x, y, 128, levelOfDetail);
  for(var i=7; i>2; i--) {
    var cx = 0.5 + (Math.round(x) >> i);
    var cy = 0.5 + (Math.round(y) >> i);
    if (perlin(cx+0.2, cy+0.3, 1, 1) > 0){
      var dx = 0.25 * perlin(cx, cy, 1, 1);
      var dy = 0.25 * perlin(cx, cy+0.5, 1, 1);
      var d = 4 * vec.mag({
        x: dx + x/(1<<i) - cx,
        y: dy + y/(1<<i) - cy, 
        z: 0
      });
      z += 0.8 * (1 << i) * craterOffset(i, d) / 128;
    }
  }
  return z;
}

function craterOffset(height, x){
  x = Math.min(x, 1);
  return height*(Math.pow(Math.sin(x*x*3),2) + (x*x-1)*1.1);
}

function generateLandscape(res, subdivs){

  function addCrater(terrain, x, y, r, height){
    var centerHeight = quad.at(terrain, x,y).value;
    for (var i = -r; i < r; i++) {
      for (var j = -r; j < r; j++) {
        var coord = Math.sqrt(i*i+j*j) / r;
        if (coord>1 || j+y<1 || j+y>res-1 || i+x<1 || i+x>res-1) continue;
        var offset = craterOffset(height, coord);
        var node = quad.at(terrain, x+i, y+j);
        var smoothness = 0.75 + 0.25*coord;
        node.value = offset + (smoothness)*node.value + (1-smoothness)*centerHeight;
      }
    }
  }

  function rand(min, max){
    return Math.random() * (max-min) + min;
  }

  var quadtree = quad.build(res, res, subdivs);

  for (var x = 0; x < res; x++) {
    for (var y = 0; y < res; y++) {
      quad.at(quadtree, x, y).value = terrainHeightAt(x, y, 1);//0.3*perlin(x, y, 1.5, 8);
    }
  }
  quad.precalculate(quadtree);

  //for (var c = 0; c<35; c++){
  //  var size = 20 * Math.pow(rand(0.5,1), 2);
  //  var depth = size*rand(0.02,0.2);
  //  addCrater(quadtree, rand(-10,res+10), rand(-10,res+10), size, depth)
  //}

  quad.precalculate(quadtree);
  return quadtree;
}
