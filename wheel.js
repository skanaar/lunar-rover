function Wheel(x, y, z, r){
  var normalForce = 70;
  var dampening = 0.92;
  var springStep = 0.1;
  return {
    _drawObject: null,
    isTouching: false,
    pos: vec.Vec(x, y, z),
    vel: vec.Vec(0, 0, 0),
    dir: vec.Vec(1, 0, 0),
    r: r,
    rotation: 0,
    update: function (dt, gravity){
      this.rotation -= dt*vec.dot(this.dir, this.vel)*2 / (Math.PI * this.r);
      vec.addTo(this.pos, this.vel, dt);
      if (!this.isTouching) vec.addTo(this.vel, gravity, dt);
    },
    apply: function (){
      var angle = -Math.atan2(this.dir.z, this.dir.x);
      this._drawObject.rotation.set(0, angle, this.rotation);
      this._drawObject.position.set(this.pos.x, this.pos.y, this.pos.z);
    },
    _ground: function (terrain){
      var x = this.pos.x + 32;
      var z = this.pos.z + 32;
      var a = quad.at(terrain, x, z).value;
      var b = quad.at(terrain, x, z).value;
      var c = quad.at(terrain, x, z).value;
      var d = quad.at(terrain, x, z).value;
      var u = x % 1;
      var v = z % 1;
      return (a*u + b*(1-u))*v + (c*u + d*(1-u))*(1-v);
    },
    collisions: function (dt, terrain){
      var groundNormal = quad.normal(terrain, this.pos.x+32, this.pos.z+32);
      var dh = this.pos.y - this._ground(terrain) - this.r;
      this.isTouching = dh < 0;
      //this._traversalFriction(groundNormal);
      this._stopSurfacePenetration(dt, dh, groundNormal);
    },
    _stopSurfacePenetration: function (dt, dh, groundNormal){
      if (this.isTouching){
        //var dot = vec.dot(this.vel, groundNormal);
        //vec.addTo(this.vel, groundNormal, dt*dot);
        vec.addTo(this.vel, groundNormal, dt*dh*dh*normalForce);
        vec.multTo(this.vel, dampening);
      }
    },
    _traversalFriction: function (groundNormal){
      //transversal friction to damp out sliding
      if(this.isTouching){
        var transVec = vec.cross(groundNormal, this.dir);
        var dot = vec.dot(this.vel, transVec);
        vec.addTo(this.vel, transVec, -dot);
      }
    },
    addSpeed: function (dv){
      if (this.isTouching) vec.addTo(this.vel, this.dir, dv);
    },
    turn: function (dir, angle){
      var dx = dir.x*Math.cos(angle) - dir.z*Math.sin(angle);
      var dz = dir.x*Math.sin(angle) + dir.z*Math.cos(angle);
      this.dir = vec.Vec(dx, 0, dz);
    },
    drawObject: function (){
      var profile = [
        new THREE.Vector2(0,          this.r*-0.2),
        new THREE.Vector2(this.r*0.6, this.r*-0.5),
        new THREE.Vector2(this.r*0.8, this.r*-0.5),
        new THREE.Vector2(this.r*1,   this.r*-0.3),
        new THREE.Vector2(this.r*1,   this.r* 0.3),
        new THREE.Vector2(this.r*0.8, this.r* 0.5),
        new THREE.Vector2(this.r*0.6, this.r* 0.5),
        new THREE.Vector2(0,          this.r* 0.2),
      ];
      var geometry = new THREE.LatheGeometry(profile);
      var m = new THREE.Matrix4();
      m.makeRotationX(Math.PI/2);
      geometry.applyMatrix(m);
      var material = new THREE.MeshLambertMaterial({color: 0xffff00});
      this._drawObject = new THREE.Mesh(geometry, material);
      return this._drawObject;
    },
    apply: function (){
      var angle = -Math.atan2(this.dir.z, this.dir.x);
      this._drawObject.rotation.set(0, angle, this.rotation);
      this._drawObject.position.set(this.pos.x, this.pos.y, this.pos.z);
    },
    attraction: function(peer, strenght, naturalDist){
      var rv = vec.diff(this.vel, peer.vel);
      var r = vec.diff(peer.pos, this.pos);
      var d = vec.dist(this.pos, peer.pos);
      var dot = vec.dot(rv, r);
      // springing
      var f = strenght*springStep / this.r;
      vec.addTo(this.vel, vec.diff(peer.pos, this.pos), f*(d-naturalDist));
      vec.addTo(peer.vel, vec.diff(this.pos, peer.pos), f*(d-naturalDist));
      // dampening
      var damp = 0.05 / this.r; // dampening should be size dependant
      vec.addTo(this.vel, r, -damp*dot/(d*d));
      vec.addTo(peer.vel, r, damp*dot/(d*d));
    }
  }
}
