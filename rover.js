function Rover(wheelA, wheelB, wheelC, wheelD, width){
  return {
    _drawObject: null,
    turn: 0,
    pos: vec.Vec(0,0,0),
    dir: vec.Vec(1,0,0),
    update: function (dt, gravity, terrain){
      this.turn *= 0.9;
      this.apply();
      [wheelA, wheelB, wheelC, wheelD].forEach(function (wheel){
        wheel.update(dt, gravity);
        wheel.collisions(dt, terrain);
        wheel.apply();
      });
      wheelA.attraction(wheelB, 1, width);
      wheelD.attraction(wheelB, 1, width);
      wheelA.attraction(wheelC, 1, width);
      wheelC.attraction(wheelD, 1, width);
      wheelA.attraction(wheelD, 1, width*1.414);
      wheelB.attraction(wheelC, 1, width*1.414);

      //make sure the wheels turn with the body of the rover boggies
      var frontBoggie = vec.add(wheelA.pos, wheelB.pos);
      var backBoggie = vec.add(wheelC.pos, wheelD.pos);
      this.pos = vec.mult(vec.add(frontBoggie, backBoggie), 0.25);
      this.dir = vec.normalize(vec.diff(frontBoggie, backBoggie));
      var leftFactor = this.turn > 0 ? 0.5 : 1;
      var rightFactor = this.turn < 0 ? 0.5 : 1;
      wheelA.turn(this.dir,  leftFactor  * this.turn);
      wheelB.turn(this.dir,  rightFactor * this.turn);
      wheelC.turn(this.dir, -leftFactor  * this.turn);
      wheelD.turn(this.dir, -rightFactor * this.turn);
    },
    drawObject: function (){
      var geometry = new THREE.BoxGeometry(width, width/3, width/2);
      var material = new THREE.MeshLambertMaterial({color: 0xffff00});
      this._drawObject = new THREE.Mesh(geometry, material);
      this._drawObject.matrixAutoUpdate = false;
      return this._drawObject;
    },
    apply: function (){
      var q = new THREE.Quaternion();
      q.setFromUnitVectors(new THREE.Vector3(1, 0, 0), this.dir);
      var p = new THREE.Vector3(this.pos.x, this.pos.y + width/3, this.pos.z);
      this._drawObject.position.copy(p);
      this._drawObject.quaternion.copy(q);
      this._drawObject.updateMatrix();
      //this._drawObject.matrix.compose(p, q, new THREE.Vector3());
    },
    addSpeed: function (dv){
      wheelA.addSpeed(dv);
      wheelB.addSpeed(dv);
      wheelC.addSpeed(dv);
      wheelD.addSpeed(dv);
    },
    steer: function (angle){
      this.turn += angle;
    }
  }
}
