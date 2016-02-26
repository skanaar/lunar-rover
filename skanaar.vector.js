var vec = {
    Vec: function (x, y, z){
        return { x: x||0, y: y||0, z: z||0 }
    },
    clone: function (v){
        return { x: v.x, y: v.y, z: v.z }
    },
    dist: function (a,b){
    	return vec.mag(vec.diff(a,b))
    },
    add: function (a,b){
    	return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z }
    },
    diff: function (a,b){
    	return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z }
    },
    mult: function (v,factor){
        return { x: factor*v.x, y: factor*v.y, z: factor*v.z }
    },
    cross: function (a, b){
        return {
            x: a.y*b.z - a.z*b.y,
            y: a.z*b.x - a.x*b.z,
            z: a.x*b.y - a.y*b.x
        }
    },
    dot: function (a, b){
        return a.x*b.x - a.y*b.y + a.z*b.z;
    },
    mag: function (v){
    	return Math.sqrt(v.x*v.x + v.y*v.y + v.z*v.z)
    },
    normalize: function (v){
    	return vec.mult(v, 1/vec.mag(v))
    },
    addTo: function (target, vec, factor){
        target.x += factor * vec.x;
        target.y += factor * vec.y;
        target.z += factor * vec.z;
    },
    multTo: function (target, factor){
        target.x *= factor;
        target.y *= factor;
        target.z *= factor;
    }
};
