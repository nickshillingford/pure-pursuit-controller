import { Vector3 } from '../libs/three.module.r122.js';

class BoxCollider {
  constructor (options) {
      let defaults = {
          mass: 0,
          position: new Vector3(),
          size: new Vector3(0.3, 0.3, 0.3),
          friction: 0.3
      }

      options = _.defaults({}, _.clone(options), defaults);
      this.options = options;
      options.position = new CANNON.Vec3(options.position.x, options.position.y, options.position.z);
      options.size = new CANNON.Vec3(options.size.x, options.size.y, options.size.z);
      let mat = new CANNON.Material('boxMat');

      mat.friction = options.friction;
      mat.wireframe = true;

      let shape = new CANNON.Box(options.size);
      let physBox = new CANNON.Body({
          mass: options.mass,
          position: options.position,
          shape: shape
      });
      physBox.material = mat;
      this.body = physBox;
  }
}

export { BoxCollider };
