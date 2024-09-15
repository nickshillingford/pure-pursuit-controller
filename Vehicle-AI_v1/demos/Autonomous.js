import { BufferGeometry, Group, Line, LineBasicMaterial, Object3D, Vector3, Quaternion, SphereGeometry, Mesh, MeshBasicMaterial, MathUtils } from '../libs/three.module.r122.js';
import { SpringSimulator, spring } from '../core/SpringSimulator.js';
import { VehicleCamera } from '../core/VehicleCamera.js';
import { calculateSpeed, calculatePerpendicularLine, getAngleBetweenVectors, getNormalizedRotationAngle, cannonVector, threeQuat, threeVector } from '../core/Utils.js';

class AutonomousVehicle extends Object3D {
  constructor(app) {
    super();

    let _this = this;

    this.speedEl = document.getElementById('speed');
    this.visibleObjectsEl = document.getElementById('visibleObjects');

    this.speedEl.style.visibility = 'visible';
    this.visibleObjectsEl.style.visibility = 'visible';

    this.app = app;
    this.geo = new SphereGeometry(0.06, 64, 32);
    this.mat = new MeshBasicMaterial({ color: 0x00ff00 });
    this.visualPointA = new Mesh(this.geo, this.mat);
    this.visualPointB = new Mesh(this.geo, this.mat);
    this.visualPointC = new Mesh(this.geo, this.mat);
    this.road = app.data;
    this.road.lane.addPointsToScene(app.renderer);
    this.road.buildLaneSegmentCurves();
    this.arriveTarget = new Vector3(this.road.lane.endPosition.x, this.road.lane.endPosition.y, this.road.lane.endPosition.z);
    this.previousSegmentIndex = 0;
    this.currentSegmentIndex = 0;
    this.steerValue = 0;
    this.updateOrder = 2;
    this.renderer = app.renderer;
    this.inputManager = app.input;
    this.wheels = app.vehicleData.wheels;
    this.materials = app.vehicleData.materials;
    this.drive = 'awd';
    this._speed = 0;
    this.gear = 1;
    this.timeToShift = 0.2;
    this.engineForce = 200;
    this.maxGears = 5;
    this.targetSpeed = 8;
    this.inputManager.setVehicle(this);
    this.maxSpeeds = {
      '0': 0,
      '1': 5,
      '2': 9,
      '3': 13,
      '4': 17,
      '5': 22
    };
    this.vehicleCamera = new VehicleCamera(this);

    this.road.lane.laneSegments[this.currentSegmentIndex].curves.forEach((line) => {
      this.renderer.scene.add(line);
    });

    Object.defineProperty(AutonomousVehicle.prototype, "speed", {
        get: function () { return this._speed; },
        enumerable: false,
        configurable: true
    });

    this.add(app.vehicleData.container);

    this.collision = app.vehicleData.collision;
    this.steeringSimulator = new SpringSimulator(60, 10, 0.6);
    this.handlingSetup = {
      radius: 0.25,
      suspensionStiffness: 20,
      suspensionRestLength: 0.35,
      maxSuspensionTravel: 1,
      frictionSlip: 0.8,
      dampingRelaxation: 2,
      dampingCompression: 2,
      rollInfluence: 0.3
    };
    this.handlingSetup.chassisConnectionPointLocal = new CANNON.Vec3(),
    this.handlingSetup.axleLocal = new CANNON.Vec3(-1, 0, 0);
    this.handlingSetup.directionLocal = new CANNON.Vec3(0, -1, 0);
    this.rayCastVehicle = new CANNON.RaycastVehicle({
        chassisBody: this.collision,
        indexUpAxis: 1,
        indexRightAxis: 0,
        indexForwardAxis: 2
    });
    this.wheels.forEach(function (wheel) {
        _this.handlingSetup.chassisConnectionPointLocal.set(
          wheel.position.x,
          wheel.position.y + 0.2,
          wheel.position.z
        );
        let index = _this.rayCastVehicle.addWheel(_this.handlingSetup);
        wheel.rayCastWheelInfoIndex = index;
    });

    this.renderer.registerUpdatable(this);

    if (this.inputManager) {
      this.inputManager.setInputReceiver(this);
    }

    this.collision.preStep = function (body) {
      _this.physicsPreStep(body);
    }

    setTimeout(function() {
      _this.inputManager.openGUI();
    }, 1000)
  }

  containsPoint(boundingBox, point) {
    let minX = boundingBox.min.x;
    let maxX = boundingBox.max.x;
    let minZ = boundingBox.min.z;
    let maxZ = boundingBox.max.z;

    let objectX = point.x;
    let objectZ = point.z;

    return (objectX >= minX && objectX <= maxX && objectZ >= minZ && objectZ <= maxZ);
  }

  findContainingBoxIndex(position, boxArray) {
      this.previousSegmentIndex = this.currentSegmentIndex;

      for (let i = this.currentSegmentIndex; i < boxArray.length; i++)
      {
          const currentBox = boxArray[i].bbox;
          if (this.containsPoint(currentBox, this.position)) {
              this.currentSegmentIndex = i;
              if ((this.currentSegmentIndex !== this.previousSegmentIndex)) {
                this.road.lane.laneSegments[this.previousSegmentIndex].curves.forEach((line) => {
                  this.renderer.scene.remove(line);
                });
                this.road.lane.laneSegments[this.currentSegmentIndex].curves.forEach((line) => {
                  this.renderer.scene.add(line);
                });
              }
              return i;
          }
      }

      return -1;
  }

  updatePosition() {
    this.position.set(
      this.collision.interpolatedPosition.x,
      this.collision.interpolatedPosition.y,
      this.collision.interpolatedPosition.z
    );

    this.quaternion.set(
      this.collision.interpolatedQuaternion.x,
      this.collision.interpolatedQuaternion.y,
      this.collision.interpolatedQuaternion.z,
      this.collision.interpolatedQuaternion.w
    );

    if ((this.rayCastVehicle.numWheelsOnGround === 4)) {
      this.findContainingBoxIndex(this.position, this.road.lane.laneSegments);
      this.visibleObjectsEl.innerHTML = 'visible objects: ' + this.vehicleCamera.visibleObjects.length;
    }
  }

  updateWheels() {
    for (let i = 0; i < this.rayCastVehicle.wheelInfos.length; i++) {
        this.rayCastVehicle.updateWheelTransform(i);

        let transform = this.rayCastVehicle.wheelInfos[i].worldTransform;
        let wheelObject = this.wheels[i].wheelObject;

        wheelObject.position.copy(threeVector(transform.position));
        wheelObject.quaternion.copy(threeQuat(transform.quaternion));

        let upAxisWorld = new CANNON.Vec3();
        this.rayCastVehicle.getVehicleAxisWorld(this.rayCastVehicle.indexUpAxis, upAxisWorld);
    }
  }

  updateSpeed(timeStep) {
    if ((this.rayCastVehicle.numWheelsOnGround === 4)) {
      if (this.shiftTimer > 0) {
          this.shiftTimer -= timeStep;
          if (this.shiftTimer < 0) {
              this.shiftTimer = 0;
          }
      }
      else {
          let powerFactor = (this.maxSpeeds[this.gear] - this.speed) / (this.maxSpeeds[this.gear] - this.maxSpeeds[this.gear - 1]);
          if (powerFactor < 0.1 && this.gear < this.maxGears) {
                this.shiftUp();
          }
          else if (this.gear > 1 && powerFactor > 1.2) {
                this.shiftDown();
          }
          else {
              let targetSpeed = this.targetSpeed;
              let currentSpeed = this.speed;
              let maxAcceleration = 8;
              let maxDeceleration = 4;
              let distanceToTarget = this.position.distanceTo(this.arriveTarget);
              let force = calculateSpeed(currentSpeed, targetSpeed, maxAcceleration, maxDeceleration, distanceToTarget);
              let speedFactor = 12;
              this.applyEngineForce(-force * speedFactor);
          }
      }
    }
    this.speedEl.innerHTML = ('speed: ' + Math.round(this.speed));
  }

  updatePurePursuit() {
    let direction = new Vector3();
    this.getWorldDirection(direction);
    let lookAheadDistance = (-0.1);
    let pointA = new Vector3(this.position.x, 0.325, this.position.z);
    let pointD = new Vector3((this.position.x + (direction.x * 20)), 0.325, (this.position.z + (direction.z * 20)));
    let perpendicularLine = calculatePerpendicularLine(pointA.clone(), pointD.clone(), this.road.lane, lookAheadDistance);

    try {
      if (this.inputManager.params.Debug_Steering) {
        this.renderer.scene.remove(this.forwardLine);
        let geometry = new BufferGeometry().setFromPoints([pointA.clone(), pointD.clone()]);
        this.forwardLine = new Line(geometry, new LineBasicMaterial({ color: 0x00ffff }));
        this.renderer.scene.add(this.forwardLine);

        this.renderer.scene.remove(this.perpendicular);
      	geometry = new BufferGeometry().setFromPoints([perpendicularLine.perpPointA, perpendicularLine.perpPointB]);
      	this.perpendicular = new Line(geometry, new LineBasicMaterial({ color: 0x00ffff }));
      	this.renderer.scene.add(this.perpendicular);

        this.renderer.scene.remove(this.visualPointA);
        this.visualPointA.position.set(pointA.x, pointA.y, pointA.z);
        this.renderer.scene.add(this.visualPointA);

        this.renderer.scene.remove(this.visualPointB);
        this.visualPointB.position.set(perpendicularLine.pointB.x, perpendicularLine.pointB.y, perpendicularLine.pointB.z);
        this.renderer.scene.add(this.visualPointB);

        this.renderer.scene.remove(this.visualPointC);
        this.visualPointC.position.set(perpendicularLine.pointC.x, perpendicularLine.pointC.y, perpendicularLine.pointC.z);
        this.renderer.scene.add(this.visualPointC);

        this.renderer.scene.remove(this.triangleSideBC);
        geometry = new BufferGeometry().setFromPoints([perpendicularLine.pointB, perpendicularLine.pointC]);
        this.triangleSideBC = new Line(geometry, new LineBasicMaterial({ color: 0x00ffff }));
        this.renderer.scene.add(this.triangleSideBC);

        this.renderer.scene.remove(this.triangleSideCA);
        geometry = new BufferGeometry().setFromPoints([perpendicularLine.pointC, pointA]);
        this.triangleSideCA = new Line(geometry, new LineBasicMaterial({ color: 0x00ffff }));
        this.renderer.scene.add(this.triangleSideCA);
      }
      const A = [pointA.x, pointA.z];
      const B = [perpendicularLine.pointB.x, perpendicularLine.pointB.z];
      const C = [perpendicularLine.pointC.x, perpendicularLine.pointC.z];
      const normalizedAngle = getNormalizedRotationAngle(A, B, C);
      this.steerValue = (-normalizedAngle);
    }
    catch (err) {}
  }

  updateSteering(timeStep) {
    this.steeringSimulator.simulate(timeStep);
    this.setSteeringValue(this.steeringSimulator.position);
  }

  updateVehicleCameraPosition() {
    this.vehicleCamera.updatePosition();
  }

  updateVehicleCameraInput() {
    this.vehicleCamera.updateInput();
  }

  update(timeStep) {
    this.updatePosition();
    this.updateWheels();
    this.updateMatrixWorld();
    this.updateVehicleCameraPosition();
    this.updatePurePursuit();
    this.updateSpeed(timeStep);
    this.updateSteering(timeStep);
    this.updateVehicleCameraInput();
  }

  handleMouseMove(event, deltaX, deltaY) {
      this.renderer.camera.move(deltaX, deltaY);
  }

  inputReceiverInit() {
      this.collision.allowSleep = false;
      this.renderer.camera.setRadius(this.inputManager.params.Cam_Distance, true);
  }

  inputReceiverUpdate() {
      this.renderer.camera.target.set(this.position.x, (this.position.y + 0.5), this.position.z);
  }

  shiftUp() {
      this.gear++;
      this.shiftTimer = this.timeToShift;
      this.applyEngineForce(0);
  }

  shiftDown() {
      this.gear--;
      this.shiftTimer = this.timeToShift;
      this.applyEngineForce(0);
  }

  applyEngineForce(force) {
      let _this = this;
      this.wheels.forEach(function (wheel) {
          if (_this.drive === wheel.drive || _this.drive === 'awd') {
              _this.rayCastVehicle.applyEngineForce(wheel.wheelObject.name, force, wheel.rayCastWheelInfoIndex);
          }
      });
  }

  setBrake(brakeForce, driveFilter) {
      let _this = this;
      this.wheels.forEach(function (wheel) {
          if (driveFilter === undefined || driveFilter === wheel.drive) {
              _this.rayCastVehicle.setBrake(brakeForce, wheel.rayCastWheelInfoIndex);
          }
      });
  }

  setSteeringValue(value) {
      let _this = this;
      this.wheels.forEach(function (wheel) {
          if (wheel.steering) {
              _this.rayCastVehicle.setSteeringValue(value, wheel.rayCastWheelInfoIndex);
          }
      });
  }

  physicsPreStep(body) {
      let quat = threeQuat(body.quaternion);
      let forward = new Vector3(0, 0, 1).applyQuaternion(quat);
      this._speed = this.collision.velocity.dot(cannonVector(forward));
      this.steeringSimulator.target = this.steerValue;
  }
}

export { AutonomousVehicle };
