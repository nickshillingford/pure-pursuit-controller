import { Group, GridHelper, Mesh, Vector3, Quaternion } from './libs/three.module.r122.js';
import { GLTFLoader } from './libs/GLTFLoader.js';
import { RenderManager } from './core/RenderManager.js';
import { InputManager } from './core/InputManager.js';
import { SVGParser } from './core/SVGParser.js';
import { ManualVehicle } from './demos/Manual.js';
import { AutonomousVehicle } from './demos/Autonomous.js';
import { Wheel } from './core/Wheel.js';
import { BoxCollider } from './core/BoxCollider.js';
import { StaticObstacle } from './core/StaticObstacle.js';
import { cannonQuat, cannonVector } from './core/Utils.js';

const WIDTH = 450;
const HEIGHT = 450;

class Application
{
		constructor(data)
		{
				let _this = this;
				this.renderer = new RenderManager();
				this.input = new InputManager(this.renderer);
				this.plane = new GridHelper(WIDTH, HEIGHT);
				this.plane.position.y = 0.3;
				this.loader = new GLTFLoader();
				this.ground = new Mesh();
				this.selectedDemo = 'sharp-turns';

				document.getElementById('manu').addEventListener('click', function() {
						_this.startDemo('Manual');
				});

				document.getElementById('auto').addEventListener('click', function() {
						_this.selectPath();
				});

				document.getElementById('back').addEventListener('click', function() {
					document.getElementById('loading-text').innerHTML = 'Select Demo:';
					document.getElementById('back').style.visibility = 'hidden';
					document.getElementById('manu').style.visibility = 'visible';
					document.getElementById('auto').style.visibility = 'visible';
					document.getElementById('flex').style.visibility = 'hidden';
				});

				let list = document.getElementsByClassName('flex-item');
				for (let i = 0; i < list.length; i++) {
					list[i].addEventListener('click', function() {
						_this.selectedDemo = list[i].children[0].innerHTML;
						let _data_ = new SVGParser(data[_this.selectedDemo]);
						_data_.curves.forEach((curve) => {
							curve.forEach((line) => {
								_this.renderer.scene.add(line);
							});
						});
						_this.data = _data_;
						document.getElementById('flex').style.visibility = 'hidden';
						_this.startDemo('Autonomous');
					});
				}

				this.loadVehicle();
		}

	  loadVehicle()
		{
		    let _this = this;
				let el = document.getElementById('loading-text');
		    this.loader.load('./models/aston_martin_db4gt.gltf', function (gltf) {
					let materials = [];
					let wheels = [];
					let mat = new CANNON.Material('Mat');
			    mat.friction = 0.01;
			    let collision = new CANNON.Body({ mass: 50 });
			    collision.material = mat;
					gltf.scene.traverse(function (child) {
						if (child.isMesh) {
								if (child.material !== undefined) {
										materials.push(child.material);
								}
								child.visible = true;
						}
						if (child.hasOwnProperty('userData')) {
								if (child.userData.hasOwnProperty('data')) {
										if (child.userData.data === 'wheel') {
												let wheel = new Wheel(child);
												wheels.push(wheel);
										}
										if (child.userData.data === 'collision') {
												if (child.userData.shape === 'box') {
														let phys = new CANNON.Box(new CANNON.Vec3(child.scale.x, child.scale.y, child.scale.z));
														collision.addShape(phys, new CANNON.Vec3(child.position.x, child.position.y, child.position.z));
												}
												child.visible = false;
										}
								}
						}
					});
					let modelContainer = new Group();
			    modelContainer.add(gltf.scene);
					_this.vehicleData = {
						materials: materials,
						wheels: wheels,
						collision: collision,
						container: modelContainer
					};
					el.innerHTML = 'Select Demo:';
					document.getElementById('manu').style.visibility = 'visible';
					document.getElementById('auto').style.visibility = 'visible';
		    },
				function (xhr) {
					try {
						const percentageComplete = (xhr.loaded / 117124310).toFixed(2).substring(2, 4);
						el.innerHTML = 'Loading . . . ' + percentageComplete + '%';
					}
					catch (err) {
						el.innerHTML = 'Loading . . .';
					}
				},
				function (err) {
					console.error(err);
				});
	  }

		selectPath()
		{
				document.getElementById('loading-text').innerHTML = 'Select Path:';
				document.getElementById('back').style.visibility = 'visible';
				document.getElementById('manu').style.visibility = 'hidden';
				document.getElementById('auto').style.visibility = 'hidden';
				document.getElementById('flex').style.visibility = 'visible';
		}

		startDemo(mode)
		{
				let _this = this;
				document.getElementById('loading-text').innerHTML = 'Getting ready . . . one moment';
				document.getElementById('back').style.visibility = 'hidden';
				document.getElementById('manu').style.visibility = 'hidden';
				document.getElementById('auto').style.visibility = 'hidden';
				setTimeout(function() {
					document.getElementById('loading-screen').style.zIndex = -1;
					document.getElementById('flex').style.position = 'absolute';

					let phys = new BoxCollider({
						size: new Vector3((WIDTH / 2), 0.3, (HEIGHT / 2)),
						child: _this.ground
					});

					phys.body.position.copy(cannonVector(new Vector3(0, 0, 0)));
					phys.body.computeAABB();

					document.body.appendChild(_this.renderer.stats.dom);

					_this.renderer.physics.addBody(phys.body);
					_this.renderer.scene.add(_this.ground);
					_this.renderer.scene.add(_this.plane);
					_this.spawn(mode);
					_this.renderer.render(_this.renderer);
				}, 1000);
		}

		spawn(mode)
		{
				let vehicle = (mode === 'Autonomous') ? new AutonomousVehicle(this) : new ManualVehicle(this);
				let worldPos = (mode === 'Autonomous') ?
					new Vector3(vehicle.road.lane.startPosition.x, vehicle.road.lane.startPosition.y, vehicle.road.lane.startPosition.z)
					:
					new Vector3(0, 1, 0);
				let worldQuat = (mode === 'Autonomous') ? vehicle.road.lane.startRotation : new Quaternion(0, 1, 0, 0);

				worldQuat.multiply(new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), Math.PI));

				vehicle.collision.position.x = worldPos.x;
				vehicle.collision.position.y = worldPos.y;
				vehicle.collision.position.z = worldPos.z;
				vehicle.collision.quaternion.copy(cannonQuat(worldQuat));
	      vehicle.rayCastVehicle.addToWorld(this.renderer.physics);
	      vehicle.wheels.forEach((wheel) => {
					this.renderer.scene.add(wheel.wheelObject);
	      });
	      this.renderer.scene.add(vehicle);
				this.vehicle = vehicle;

				if (this.selectedDemo === 'static-obstacles') {
					this.renderer.staticObstacles.push(new StaticObstacle(this.renderer, new Vector3(-14.6, 3, 106), 0xff0000));
					this.renderer.staticObstacles.push(new StaticObstacle(this.renderer, new Vector3(-12.8, 3, -3.6), 0x00ff00));
					this.renderer.staticObstacles.push(new StaticObstacle(this.renderer, new Vector3(26.4, 3, -48.9), 0x0000ff));
				}
		}
}

export { Application };
