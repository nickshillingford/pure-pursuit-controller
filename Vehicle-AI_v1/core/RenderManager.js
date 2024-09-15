import { WebGLRenderer, Scene, ACESFilmicToneMapping, Clock, HemisphereLight, DirectionalLight, Vector3, Color } from '../libs/three.module.r122.js';
import { CameraManager } from './CameraManager.js';
import Stats from '../libs/stats.module.js';

class RenderManager
{
    constructor() {
      this.webgl = new WebGLRenderer({ antialias: false });
      this.webgl.setPixelRatio(window.devicePixelRatio);
      this.webgl.setSize(window.innerWidth, window.innerHeight);
      this.webgl.toneMapping = ACESFilmicToneMapping;
      this.webgl.toneMappingExposure = 1.0;

      document.body.appendChild(this.webgl.domElement);
      this.webgl.domElement.id = 'canvas';

      this.updatables = [];
      this.staticObstacles = [];

      this.scene = new Scene();
			this.scene.background = new Color(0xa0a0a0);

			let hemiLight = new HemisphereLight(0xffffff, 0x444444);
			hemiLight.position.set(0, 200, 0);
			this.scene.add(hemiLight);

			let dirLight = new DirectionalLight(0xffffff);
			dirLight.position.set(0, 75, 75);
			dirLight.intensity = 2;
			this.scene.add(dirLight);

      this.camera = new CameraManager(this);
      this.physics = new CANNON.World();
      this.physics.gravity.set(0, -9.81, 0);
      this.physics.broadphase = new CANNON.SAPBroadphase(this.physics);
      this.physics.solver.iterations = 10;
      this.physics.allowSleep = true;
      this.physicsFrameRate = 60;
      this.physicsFrameTime = 1 / this.physicsFrameRate;
      this.physicsMaxPrediction = this.physicsFrameRate;
      this.clock = new Clock();
      this.renderDelta = 0;
      this.logicDelta = 0;
      this.sinceLastFrame = 0;
      this.requestDelta = 0;

	  	this.stats = new Stats();
    	this.stats.showPanel(0);
    }

    registerUpdatable(registree) {
      this.updatables.push(registree);
      this.updatables.sort(function (a, b) {
        return (a.updateOrder > b.updateOrder) ? 1 : -1;
      });
    }

    updatePhysics(timeStep) {
      this.physics.step(this.physicsFrameTime, timeStep);
    }

    update(timeStep, unscaledTimeStep) {
      this.updatePhysics(timeStep);
      this.updatables.forEach(function (entity) {
          entity.update(timeStep);
      });
    }

    render(renderer) {
      this.requestDelta = this.clock.getDelta();

      requestAnimationFrame(function () {
          renderer.render(renderer);
      });

	  	this.stats.begin();

      let unscaledTimeStep = (this.requestDelta + this.renderDelta + this.logicDelta);
      let timeStep = unscaledTimeStep * 1;
      timeStep = Math.min(timeStep, 1 / 30);

      renderer.update(timeStep, unscaledTimeStep);

      this.logicDelta = this.clock.getDelta();
      this.webgl.render(this.scene, this.camera.cameraObject);
      this.renderDelta = this.clock.getDelta();

	  	this.stats.end();
    }
}

export { RenderManager };
