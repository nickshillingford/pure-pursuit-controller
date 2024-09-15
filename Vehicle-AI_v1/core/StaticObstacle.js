import {
  Color,
	Mesh,
	Vector3,
	MeshPhongMaterial,
	BoxGeometry,
  Object3D
} from '../libs/three.module.r122.js';

class StaticObstacle extends Object3D {
  constructor(renderer, pos, col) {
    super();
    this.updateOrder = 3;
    this.renderer = renderer;

	  let scale = 0.4;
    let shape = new CANNON.Box(new CANNON.Vec3(scale, scale, scale));

    this.collision = new CANNON.Body({ mass: 1 });
    this.collision.addShape(shape);
    this.collision.position.set(pos.x,pos.y,pos.z);
    this.renderer.physics.addBody(this.collision);

    let cubeGeo = new BoxGeometry((scale * 2), (scale * 2), (scale * 2));
    let cubeMaterial = new MeshPhongMaterial( { color: new Color(col) } );

    this.mesh = new Mesh(cubeGeo, cubeMaterial);
    this.renderer.scene.add(this.mesh);
    this.renderer.registerUpdatable(this);
  }

  update(timeStep) {
    this.mesh.position.set(
      this.collision.interpolatedPosition.x,
      this.collision.interpolatedPosition.y,
      this.collision.interpolatedPosition.z
    );

    this.mesh.quaternion.set(
      this.collision.interpolatedQuaternion.x,
      this.collision.interpolatedQuaternion.y,
      this.collision.interpolatedQuaternion.z,
      this.collision.interpolatedQuaternion.w
    );

    this.mesh.updateMatrixWorld();
  }
}

export { StaticObstacle };
