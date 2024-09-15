import { Object3D, MathUtils, Group, Vector3, Quaternion } from '../libs/three.module.r122.js';
import { SpringSimulator, spring } from '../core/SpringSimulator.js';
import { KeyBinding } from '../core/KeyBinding.js';
import { threeQuat, getSignedAngleBetweenVectors, getAngleBetweenVectors, cannonVector, threeVector } from '../core/Utils.js';

class ManualVehicle extends Object3D {
  constructor(app) {
    super();

		let _this = this;
    this.app = app;
    this.updateOrder = 2;
    this.renderer = app.renderer;
    this.inputManager = app.input;
    this.inputManager.setVehicle(this);
    this.materials = app.vehicleData.materials
    this.wheels = app.vehicleData.wheels;
    this.drive = 'awd';
    this._speed = 0;
    this.gear = 1;
    this.timeToShift = 0.2;
    this.engineForce = 200;
    this.maxGears = 5;
    this.gearsMaxSpeeds = {
      'R': -4,
      '0': 0,
      '1': 5,
      '2': 9,
      '3': 13,
      '4': 17,
      '5': 22
    };

    Object.defineProperty(ManualVehicle.prototype, "speed", {
        get: function () {
            return this._speed;
        },
        enumerable: false,
        configurable: true
    });

    this.actions = {
      'throttle': new KeyBinding('KeyW'),
      'reverse': new KeyBinding('KeyS'),
      'brake': new KeyBinding('Space'),
      'left': new KeyBinding('KeyA'),
      'right': new KeyBinding('KeyD')
    };

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
  }

	setPosition(x, y, z) {
		this.collision.position.x = x;
		this.collision.position.y = y;
		this.collision.position.z = z;
	}

  update(timeStep) {
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

    for (let i = 0; i < this.rayCastVehicle.wheelInfos.length; i++) {
        this.rayCastVehicle.updateWheelTransform(i);

        let transform = this.rayCastVehicle.wheelInfos[i].worldTransform;
        let wheelObject = this.wheels[i].wheelObject;

        wheelObject.position.copy(threeVector(transform.position));
        wheelObject.quaternion.copy(threeQuat(transform.quaternion));

        let upAxisWorld = new CANNON.Vec3();
        this.rayCastVehicle.getVehicleAxisWorld(this.rayCastVehicle.indexUpAxis, upAxisWorld);
    }

    this.updateMatrixWorld();

    if (this.shiftTimer > 0) {
        this.shiftTimer -= timeStep;
        if (this.shiftTimer < 0) {
            this.shiftTimer = 0;
        }
    }
    else {
        if (this.actions.reverse.isPressed) {
            let powerFactor = (this.gearsMaxSpeeds['R'] - this.speed) / Math.abs(this.gearsMaxSpeeds['R']);
            let force = (this.engineForce / this.gear) * (Math.pow(Math.abs(powerFactor), 1));
            this.applyEngineForce(force);
        }
        else {
            let powerFactor = (this.gearsMaxSpeeds[this.gear] - this.speed) / (this.gearsMaxSpeeds[this.gear] - this.gearsMaxSpeeds[this.gear - 1]);
            if (powerFactor < 0.1 && this.gear < this.maxGears) {
                this.shiftUp();
            }
            else if (this.gear > 1 && powerFactor > 1.2) {
                this.shiftDown();
            }
            else if (this.actions.throttle.isPressed) {
                let factor = Math.pow(powerFactor, 1);
                let force = (this.engineForce / this.gear) * factor;
                this.applyEngineForce(-force);
            }
        }
    }

    this.steeringSimulator.simulate(timeStep);
    this.setSteeringValue(this.steeringSimulator.position);
  }

  handleMouseMove(event, deltaX, deltaY) {
      this.renderer.camera.move(deltaX, deltaY);
  }

  inputReceiverInit() {
      this.collision.allowSleep = false;
      this.renderer.camera.setRadius(3, true);
  }

  inputReceiverUpdate() {
      this.renderer.camera.target.set(this.position.x, (this.position.y + 0.5), this.position.z);
  }

  handleKeyboardEvent(event, code, pressed) {
    for (var action in this.actions)
    {
        if (this.actions.hasOwnProperty(action))
        {
            var binding = this.actions[action];
            if (_.includes(binding.eventCodes, code))
            {
                this.triggerAction(action, pressed);
            }
        }
    }
  }

  triggerAction(actionName, value) {
      let action = this.actions[actionName];

      if (action.isPressed !== value) {
          action.isPressed = value;
          action.justPressed = false;
          action.justReleased = false;

          if (value) {
            action.justPressed = true;
          }
          else {
            action.justReleased = true;
          }

          this.onInputChange();

          action.justPressed = false;
          action.justReleased = false;
      }
  }

  onInputChange() {
    const brakeForce = 1000000;

    if (this.actions.throttle.justReleased || this.actions.reverse.justReleased) {
        this.applyEngineForce(0);
    }

    if (this.actions.brake.justPressed) {
        this.setBrake(brakeForce, 'rwd');
    }

    if (this.actions.brake.justReleased) {
        this.setBrake(0, 'rwd');
    }
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

  setSteeringValue(val) {
      let _this = this;
      this.wheels.forEach(function (wheel) {
          if ( wheel.steering ) {
              _this.rayCastVehicle.setSteeringValue(val, wheel.rayCastWheelInfoIndex);
          }
      });
  }

  physicsPreStep(body) {
    let quat = threeQuat(body.quaternion);
    let forward = new Vector3( 0, 0, 1 ).applyQuaternion(quat);

    this._speed = this.collision.velocity.dot(cannonVector(forward));

    let velocity = new CANNON.Vec3().copy( this.collision.velocity );
    velocity.normalize();

    let driftCorrection = getSignedAngleBetweenVectors(threeVector(velocity), forward);
    let maxSteerVal = 0.9;
    let speedFactor = MathUtils.clamp(this.speed * 0.3, 1, Number.MAX_VALUE);

    if (this.actions.right.isPressed) {
        let steering = Math.min(-maxSteerVal / speedFactor, -driftCorrection);
        this.steeringSimulator.target = MathUtils.clamp(steering, -maxSteerVal, maxSteerVal);
    }
    else if (this.actions.left.isPressed) {
        let steering = Math.max(maxSteerVal / speedFactor, -driftCorrection);
        this.steeringSimulator.target = MathUtils.clamp(steering, -maxSteerVal, maxSteerVal);
    }
    else {
        this.steeringSimulator.target = 0;
    }
  }
}

export { ManualVehicle };
