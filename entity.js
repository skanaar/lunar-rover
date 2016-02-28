function Entity(mass, pos, vel, force){
  return {
    mass: mass,
    pos: vec.clone(pos),
    vel: vec.clone(vel || vec.Vec()),
    force: vec.clone(force || vec.Vec()),
    get x (){ return this.pos.x },
    get y (){ return this.pos.y },
    get z (){ return this.pos.z },
    clone: function (){
      var c = vec.clone;
      return Entity(this.mass, c(this.pos), c(this.vel), c(this.force));
    }
  };
}

function solveEuler(dt, entities){
  entities.forEach(function (e){
    vec.addTo(e.vel, e.force, dt/e.mass);
    vec.addTo(e.pos, e.vel, dt);
  })
}

function resetForces(entities){
  entities.forEach(function (e){
    vec.multTo(e.force, 0);
  })
}

var even = false;

function solveLeapfrog(dt, entities){
  even = !even;
  if (even){
    entities.forEach(function (e){
      vec.addTo(e.pos, e.vel, 2*dt);
    })
  }
  else {
    entities.forEach(function (e){
      vec.addTo(e.vel, e.force, 2*dt/e.mass);
      vec.multTo(e.force, 0);
    })
  }
}

function solveRungeKutta(dt, entities){
  entities.forEach(function (e){
    var x1 = e.pos;
    var v1 = e.vel;
    var a = e.force/e.mass;
    var x2 = e.pos + dt*0.5*e.vel;
    var v2 = e.vel + dt*0.5*a;
    var x3 = e.pos + dt*0.5*v2;
    var v3 = e.vel + dt*0.5*a;
    var x4 = e.pos + dt*0.5*v3;
    var v4 = e.vel + dt*0.5*a;
    e.pos = e.pos + dt/6 * (v1+2*(v2+v3)+v4)
  })
}