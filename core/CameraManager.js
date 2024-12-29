import { PerspectiveCamera, Vector3, Vector2 } from '../libs/three.module.r122.js';

class CameraManager
{
    constructor(renderer) {
      this.updateOrder = 5;
      this.renderer = renderer;
      this.cameraObject = new PerspectiveCamera(80, (window.innerWidth / window.innerHeight), 0.01, 1000);
      this.target = new Vector3();
      this.targetRadius = 1;
      this.radius = 1;
      this.phi = 12.98;
      this.theta = 180;
      this.sensitivityX = 1;
      this.sensitivityY = (this.sensitivityX * 0.8);
      this.sensitivity = new Vector2(this.sensitivityX, this.sensitivityY);
      this.renderer.registerUpdatable(this);
    }

    update() {
      this.cameraObject.position.x = this.target.x + this.radius * Math.sin(this.theta * Math.PI / 180) * Math.cos(this.phi * Math.PI / 180);
      this.cameraObject.position.y = this.target.y + this.radius * Math.sin(this.phi * Math.PI / 180);
      this.cameraObject.position.z = this.target.z + this.radius * Math.cos(this.theta * Math.PI / 180) * Math.cos(this.phi * Math.PI / 180);

      this.cameraObject.updateMatrix();
      this.cameraObject.lookAt(this.target);
    }

    move(deltaX, deltaY) {
      this.theta -= deltaX * (this.sensitivity.x / 2);
      this.theta %= 360;
      this.phi += deltaY * (this.sensitivity.y / 2);
      this.phi = Math.min(85, Math.max(-85, this.phi));
    }

    setRadius(value, instantly) {
      this.targetRadius = Math.max(0.001, value);

      if (instantly === true) {
        this.radius = value;
      }
    }
}

export { CameraManager };
