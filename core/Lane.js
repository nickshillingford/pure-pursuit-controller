import {
  Quaternion,
  Vector3
} from '../libs/three.module.r122.js';

const GROUND_HEIGHT = 0.325;
const NUM_POINTS = 20;
const LANE_START_OFFSET = 3;

class Lane
{
    constructor(center)
    {
        this.center = new paper.Path(center);

        this.laneSegments = [];
        this.segments = [];

        let start = this.center.getPointAt(LANE_START_OFFSET);
        this.startPosition = new Vector3(start.x, 1, start.y);

        let tangent = this.center.getTangentAt(LANE_START_OFFSET).normalize();
        let paperToThree = new Vector3(tangent.x, 0, tangent.y);
        let forward = new Vector3(0, 0, -1);
        this.startRotation = new Quaternion().setFromUnitVectors(forward, paperToThree);

        let end = this.center.getPointAt((this.center.length - 1));
        this.endPosition = new Vector3(end.x, GROUND_HEIGHT, end.y);
    }

    calculatePerpendicularLine(pointA, pointD)
    {
      	let length = 15;
      	let direction = new Vector3().subVectors(pointD, pointA).normalize();
      	let perpendicular = (direction.x === 0 && direction.z === 0) ? new Vector3(1, 0, 0) : new Vector3(-direction.z, 0, direction.x).normalize();
      	let lineLength = pointA.distanceTo(pointD);
      	let pointB = new Vector3().addVectors(pointA, pointD).multiplyScalar(0.5);
      	let displacement = direction.multiplyScalar(-0.5 * lineLength);

      	pointB.add(displacement);

      	let perpPointA = new Vector3().addVectors(pointB, perpendicular.clone().multiplyScalar(length / 2));
      	let perpPointB = new Vector3().subVectors(pointB, perpendicular.clone().multiplyScalar(length / 2));

      	return {
      		perpPointA: perpPointA,
      		perpPointB: perpPointB
      	};
    }
}

export { Lane };
