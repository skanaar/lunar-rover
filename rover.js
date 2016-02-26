function Rover(wheelA, wheelB, wheelC, wheelD, width){
  return {
    _drawObject: null,
    turn: 0,
    obj: Entity(0, vec.Vec(0,0,0)),
    dir: vec.Vec(1,0,0),
    update: function (dt, gravity, terrain){
      this.turn *= 0.9;
      this.apply();
      [wheelA, wheelB, wheelC, wheelD].forEach(function (wheel){
        wheel.update(dt, gravity);
        wheel.collisions(dt, terrain);
        wheel.apply();
      });
      wheelA.attraction(wheelB, dt, width);
      wheelD.attraction(wheelB, dt, width);
      wheelA.attraction(wheelC, dt, width);
      wheelC.attraction(wheelD, dt, width);
      wheelA.attraction(wheelD, dt, width*1.414);
      wheelB.attraction(wheelC, dt, width*1.414);

      //make sure the wheels turn with the body of the rover boggies
      var frontBoggie = vec.add(wheelA.obj.pos, wheelB.obj.pos);
      var backBoggie = vec.add(wheelC.obj.pos, wheelD.obj.pos);
      this.obj.pos = vec.mult(vec.add(frontBoggie, backBoggie), 0.25);
      this.dir = vec.normalize(vec.diff(frontBoggie, backBoggie));
      var leftFactor = this.turn > 0 ? 0.5 : 1;
      var rightFactor = this.turn < 0 ? 0.5 : 1;
      wheelA.turn(this.dir,  leftFactor  * this.turn);
      wheelB.turn(this.dir,  rightFactor * this.turn);
      wheelC.turn(this.dir, -leftFactor  * this.turn);
      wheelD.turn(this.dir, -rightFactor * this.turn);
    },
    drawObject: function (){
      var shape = new THREE.Shape([
        new THREE.Vector2( width/2,-width/16),
        new THREE.Vector2( width/2, 0),
        new THREE.Vector2( width/4, width/8),
        new THREE.Vector2(-width/4, width/8),
        new THREE.Vector2(-width/2, 0),
        new THREE.Vector2(-width/2,-width/16)
      ]);
      var extrude = {
        amount: 0,
        steps: 1,
        material: 1,
        extrudeMaterial: 0,
        bevelEnabled: true,
        bevelThickness: width/3,
        bevelSize: 0.2,
        bevelSegments: 1
      };
      var geometry = new THREE.ExtrudeGeometry(shape, extrude);

      //var geometry = new THREE.BoxGeometry(width, width/3, width/2);
      var material = new THREE.MeshLambertMaterial({color: 0xdd8800});
      this._drawObject = new THREE.Mesh(geometry, material);
      this._drawObject.matrixAutoUpdate = false;
      this._drawObject.castShadow = true;
      return this._drawObject;
    },
    apply: function (){
      var q = new THREE.Quaternion();
      q.setFromUnitVectors(new THREE.Vector3(1, 0, 0), this.dir);
      var p = new THREE.Vector3(this.obj.x, this.obj.y + width/3, this.obj.z);
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
