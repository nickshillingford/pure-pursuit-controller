import {
	WebGLRenderer,
	ACESFilmicToneMapping,
	PerspectiveCamera,
	Vector3,
  Quaternion,
  Frustum,
  Matrix4
} from '../libs/three.module.r122.js';

class VehicleCamera
{
	  constructor(vehicle)
	  {
				this.vehicle = vehicle;
	      this.renderer = vehicle.renderer;
				this.inputManager = vehicle.inputManager;
	      this.camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
	      this.frustum = new Frustum();
				this.webgl = new WebGLRenderer({ antialias: false });
	      this.webgl.setPixelRatio(window.devicePixelRatio);
	      this.webgl.setSize(500, 350);
	      this.webgl.toneMapping = ACESFilmicToneMapping;
	      this.webgl.toneMappingExposure = 1.0;
				this.webgl.domElement.id = 'canvas';
				document.getElementById('camera').appendChild(this.webgl.domElement);
				this.visibleObjects = [];
				this.render(this);
	  }

	  updatePosition()
	  {
		    let position = new Vector3();
		    let quaternion = new Quaternion();
		    let scale = new Vector3();
		    let direction = new Vector3();

		    this.vehicle.matrixWorld.decompose(position, quaternion, scale);
		    this.vehicle.getWorldDirection(direction);

		    this.camera.position.set(
		      (position.x + (direction.x * 1.32)),
		      (position.y + (direction.y * 0.48) + 0.0),
		      (position.z + (direction.z * 1.32))
		    );

		    this.camera.lookAt(
		      (position.x + (direction.x * 24.0)),
		      (position.y + (direction.y * 24.0)),
		      (position.z + (direction.z * 24.0))
		    );

		    this.frustum.setFromProjectionMatrix(
		      new Matrix4().multiplyMatrices(
		        this.camera.projectionMatrix,
		        this.camera.matrixWorldInverse
		      )
		    );
	  }

		updateInput()
		{
				this.visibleObjects = [];
				this.renderer.staticObstacles.forEach((obstacle) => {
					if (this.frustum.containsPoint(obstacle.mesh.position)) {
							this.visibleObjects.push(obstacle);
					}
				});
		}

		render(renderer)
		{
				requestAnimationFrame(function () {
						renderer.render(renderer);
				});
				if (this.inputManager.params.Debug_Camera) {
					this.webgl.render(this.renderer.scene, this.camera);
				}
		}
}

export { VehicleCamera };
