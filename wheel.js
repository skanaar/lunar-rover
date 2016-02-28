function Wheel(x, y, z, r){
  var groundForce = 1500;
  var groundFriction = 0.5;
  var tireGrip = 2.9;
  var springConstant = 2;
  return {
    _drawObject: null,
    isTouching: false,
    isBraking: false,
    obj: Entity(1, vec.Vec(x, y, z)),
    dir: vec.Vec(1, 0, 0),
    r: r,
    rotation: 0,
    update: function (dt, gravity){
      var speedForward = vec.dot(this.dir, this.obj.vel);
      this.rotation -= dt*speedForward*2 / (Math.PI * this.r);
      vec.addTo(this.obj.force, gravity, dt*this.obj.mass);
    },
    apply: function (){
      var angle = -Math.atan2(this.dir.z, this.dir.x);
      this._drawObject.rotation.set(0, angle, this.rotation);
      this._drawObject.position.set(this.obj.x, this.obj.y, this.obj.z);
    },
    collisions: function (dt, terrain){
      var groundNormal = quad.normalAt(terrain, this.obj.pos.x, this.obj.pos.z);
      var groundHeight = quad.valueAt(terrain, this.obj.pos.x, this.obj.pos.z);
      var dh = this.obj.y - groundHeight - this.r;
      this.isTouching = dh < 0;
      if (this.isTouching){
        this._traversalFriction(dt, dh, groundNormal);
        this._stopSurfacePenetration(dt, dh, groundNormal);
        this._groundFriction();
      }
    },
    _stopSurfacePenetration: function (dt, dh, groundNormal){
      vec.addTo(this.obj.force, groundNormal, dh*dh*groundForce);
      // state modification outside integrator
      vec.addTo(this.obj.pos, groundNormal, -dh*0.25);
    },
    _groundFriction: function (){
      var speed = vec.mag(this.obj.vel);
      var vDir = vec.normalize(this.obj.vel);
      vec.addTo(this.obj.force, vDir, -groundFriction*speed);
      if (this.isBraking)
        vec.addTo(this.obj.force, vDir, -(groundFriction+tireGrip)*speed);
    },
    _traversalFriction: function (dt, dh, groundNormal){
      //transversal friction to damp out sliding
      var trans = vec.normalize(vec.cross(groundNormal, this.dir));
      var slide = vec.mult(trans, vec.dot(trans, this.obj.vel));
      vec.addTo(this.obj.force, slide, -tireGrip);
    },
    addSpeed: function (dv){
      if (this.isTouching) vec.addTo(this.obj.force, this.dir, dv);
    },
    turn: function (dir, angle){
      var dx = dir.x*Math.cos(angle) - dir.z*Math.sin(angle);
      var dz = dir.x*Math.sin(angle) + dir.z*Math.cos(angle);
      this.dir = vec.Vec(dx, 0, dz);
    },
    drawObject: function (){
      var profile = [
        new THREE.Vector2(this.r*0.4, this.r*-0),
        new THREE.Vector2(this.r*0.8, this.r*-0.5),
        new THREE.Vector2(this.r*1,   this.r*-0.3),
        new THREE.Vector2(this.r*1,   this.r* 0.3),
        new THREE.Vector2(this.r*0.8, this.r* 0.5),
        new THREE.Vector2(this.r*0.4, this.r* 0),
      ];
      var geometry = new THREE.LatheGeometry(profile);
      var m = new THREE.Matrix4();
      m.makeRotationX(Math.PI/2);
      geometry.applyMatrix(m);
      var material = new THREE.MeshLambertMaterial({color: 0xdd8800});
      material.shading = THREE.FlatShading;
      this._drawObject = new THREE.Mesh(geometry, material);
      this._drawObject.castShadow = true;
      this._drawObject.receiveShadow = true;
      return this._drawObject;
    },
    attraction: function(peer, dt, naturalDist){
      var r = vec.diff(peer.obj.pos, this.obj.pos);
      var d = vec.mag(r);
      // springing
      var f = springConstant * (d-naturalDist) / this.r;
      vec.addTo(this.obj.force, r,  f);
      vec.addTo(peer.obj.force, r, -f);
      // dampening
      var relativeVel = vec.diff(peer.obj.vel, this.obj.vel);
      var parallellVel = vec.mult(vec.normalize(r), vec.dot(relativeVel, r));
      var speed = vec.mag(parallellVel);
      var damp = 1 - 1/(1+speed*speed);
      vec.addTo(peer.obj.vel, parallellVel,-dt*damp);
      vec.addTo(this.obj.vel, parallellVel, dt*damp);
    }
  }
}
