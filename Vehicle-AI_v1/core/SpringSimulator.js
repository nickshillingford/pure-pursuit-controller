import { MathUtils } from '../libs/three.module.r122.js';

class SimulatorBase {
  constructor(fps, mass, damping) {
      this.mass = mass;
      this.damping = damping;
      this.frameTime = 1 / fps;
      this.offset = 0;
  }

  setFPS(value) {
      this.frameTime = 1 / value;
  }

  lastFrame() {
      return this.cache[this.cache.length - 1];
  }

  generateFrames(timeStep) {
      // Update cache
      // Find out how many frames needs to be generated
      var totalTimeStep = this.offset + timeStep;
      var framesToGenerate = Math.floor(totalTimeStep / this.frameTime);
      this.offset = totalTimeStep % this.frameTime;
      // Generate simulation frames
      if (framesToGenerate > 0) {
          for (var i = 0; i < framesToGenerate; i++) {
              this.cache.push(this.getFrame(i + 1 === framesToGenerate));
          }
          this.cache = this.cache.slice(-2);
      }
  }
}

class SpringSimulator extends SimulatorBase {
    constructor(fps, mass, damping, startPosition, startVelocity) {
        if (startPosition === void 0) { startPosition = 0; }
        if (startVelocity === void 0) { startVelocity = 0; }
        // Construct base
        super(fps, mass, damping);
        let _this = this;
        _this.position = startPosition;
        _this.velocity = startVelocity;
        // Simulation parameters
        _this.target = 0;
        // Initialize cache by pushing two frames
        _this.cache = []; // At least two frames
        for (let i = 0; i < 2; i++) {
            _this.cache.push(new SimulationFrame(startPosition, startVelocity));
        }
    }

    simulate(timeStep) {
        // Generate new frames
        this.generateFrames(timeStep);
        // Return values interpolated between cached frames
        this.position = MathUtils.lerp(this.cache[0].position, this.cache[1].position, this.offset / this.frameTime);
        this.velocity = MathUtils.lerp(this.cache[0].velocity, this.cache[1].velocity, this.offset / this.frameTime);
    }

    getFrame(isLastFrame) {
        return spring(this.lastFrame().position, this.target, this.lastFrame().velocity, this.mass, this.damping);
    }
}

class SimulationFrame {
  constructor(position, velocity) {
      this.position = position;
      this.velocity = velocity;
  }
}

function spring(source, dest, velocity, mass, damping) {
	let acceleration = dest - source;
	acceleration /= mass;
	velocity += acceleration;
	velocity *= damping;

	let position = source + velocity;

	return new SimulationFrame(position, velocity);
}

export { SpringSimulator, spring };
