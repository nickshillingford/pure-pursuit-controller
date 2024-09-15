import { AutonomousVehicle } from '../demos/Autonomous.js';

class InputManager
{
    constructor(renderer) {
      let _this = this;

      this.updateOrder = 4;
      this.domElement = renderer.webgl.domElement;
      this.renderer = renderer;
      this.inputReceiver = undefined;
      this.pointerLock = true;
      this.isLocked = false;
      this.isAutonomous = false;

      this.boundOnKeyDown = function (evt) {
        return _this.onKeyDown(evt);
      }

      this.boundOnKeyUp = function (evt) {
        return _this.onKeyUp(evt);
      }

      document.addEventListener('keydown', this.boundOnKeyDown, false);
      document.addEventListener('keyup', this.boundOnKeyUp, false);

      this.boundOnPointerlockChange = function (evt) {
        return _this.onPointerlockChange(evt);
      }

      this.boundOnPointerlockError = function (evt) {
        return _this.onPointerlockError(evt);
      }

      this.boundOnMouseDown = function (evt) {
        return _this.onMouseDown(evt);
      }

      this.boundOnMouseMove = function (evt) {
        return _this.onMouseMove(evt);
      }

      this.boundOnMouseUp = function (evt) {
        return _this.onMouseUp(evt);
      }

      this.domElement.addEventListener('mousedown', this.boundOnMouseDown, false);

      document.addEventListener('pointerlockchange', this.boundOnPointerlockChange, false);
      document.addEventListener('pointerlockerror', this.boundOnPointerlockError, false);

      this.renderer.registerUpdatable(this);
    }

    update() {
      this.inputReceiver.inputReceiverUpdate();
    }

    setInputReceiver(receiver) {
      this.isAutonomous = (receiver instanceof AutonomousVehicle);
      this.inputReceiver = receiver;
      this.inputReceiver.inputReceiverInit();
    }

    onPointerlockChange(event) {
        if (document.pointerLockElement === this.domElement) {
            this.domElement.addEventListener('mousemove', this.boundOnMouseMove, false);
            this.domElement.addEventListener('mouseup', this.boundOnMouseUp, false);
            this.isLocked = true;
        }
        else {
            this.domElement.removeEventListener('mousemove', this.boundOnMouseMove, false);
            this.domElement.removeEventListener('mouseup', this.boundOnMouseUp, false);
            this.isLocked = false;
        }
    }

    onPointerlockError(event) {
        console.error('PointerLockControls: Unable to use Pointer Lock API');
    }

    onKeyDown(event) {
       if ((this.inputReceiver !== undefined) && !this.isAutonomous) {
           this.inputReceiver.handleKeyboardEvent(event, event.code, true);
       }
    }

   onKeyUp(event) {
       if ((this.inputReceiver !== undefined) && !this.isAutonomous) {
           this.inputReceiver.handleKeyboardEvent(event, event.code, false);
       }
    }

    onMouseDown(event) {
        if (this.pointerLock) {
            this.domElement.requestPointerLock();
        }
        else {
            this.domElement.addEventListener('mousemove', this.boundOnMouseMove, false);
            this.domElement.addEventListener('mouseup', this.boundOnMouseUp, false);
        }
    }

    onMouseMove(event) {
        if (this.inputReceiver !== undefined) {
            this.inputReceiver.handleMouseMove(event, event.movementX, event.movementY);
        }
    }

    onMouseUp(event) {
        if (!this.pointerLock) {
            this.domElement.removeEventListener('mousemove', this.boundOnMouseMove, false);
            this.domElement.removeEventListener('mouseup', this.boundOnMouseUp, false);
        }
    }

    createParamsGUI()
    {
				this.gui = new dat.GUI();

	      let _this = this;
	      let settingsFolder = this.gui.addFolder('Settings');
				settingsFolder.open();

				settingsFolder.add(this.params, 'Cam_Distance', 1, 18).listen().step(1)
	        .onChange((value) => {
	          _this.renderer.camera.setRadius(value, true);
	        });

				settingsFolder.add(this.params, 'Debug_Steering').onChange((enabled) => {
		          if (!enabled) {
                _this.renderer.scene.remove(_this.vehicle.forwardLine);
		            _this.renderer.scene.remove(_this.vehicle.perpendicular);
                _this.renderer.scene.remove(_this.vehicle.visualPointA);
		            _this.renderer.scene.remove(_this.vehicle.visualPointB);
		            _this.renderer.scene.remove(_this.vehicle.visualPointC);
		            _this.renderer.scene.remove(_this.vehicle.triangleSideBC);
		            _this.renderer.scene.remove(_this.vehicle.triangleSideCA);
		          }
		      });

        settingsFolder.add(this.params, 'Target_Speed', 1, 18).listen().step(1)
             .onChange((value) => {
               _this.vehicle.targetSpeed = value;
             });

        settingsFolder.add(this.params, 'Debug_Camera').onChange((enabled) => {
		          if (!enabled) {
                document.getElementById('camera').style.visibility = 'hidden';
		          }
              else {
                document.getElementById('camera').style.visibility = 'visible';
              }
		      });

				this.gui.open();
	  }

    setVehicle(vehicle)
    {
        const isStaticObstacles = (vehicle.app.selectedDemo === 'static-obstacles');
        document.getElementById('camera').style.visibility = isStaticObstacles ? 'visible' : 'hidden';
				this.vehicle = vehicle;
				this.params = {
            Cam_Distance: 4,
            Target_Speed: vehicle.targetSpeed,
            Debug_Steering: false,
            Debug_Camera: isStaticObstacles
        };
		}

		openGUI()
    {
				this.createParamsGUI();
		}
}

export { InputManager };
