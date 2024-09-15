import {
  SphereGeometry,
  MeshBasicMaterial,
  Mesh,
  Quaternion,
  Vector3
} from '../libs/three.module.r122.js';

const GROUND_HEIGHT = 0.325;
const NUM_POINTS = 20;
const LANE_START_OFFSET = 3;

class Lane
{
    constructor(leftBoundry, center, rightBoundry)
    {
        this.left = new paper.Path(leftBoundry);
        this.center = new paper.Path(center);
        this.right = new paper.Path(rightBoundry);

        this.laneSegments = [];
        this.segments = [];

        this.geo = new SphereGeometry(0.06, 64, 32);
        this.mat = new MeshBasicMaterial({ color: 0x00ff00 });

        this.distributedPoints = this.distributePointsAlongPath(NUM_POINTS, center);

        let start = this.center.getPointAt(LANE_START_OFFSET);
        this.startPosition = new Vector3(start.x, 1, start.y);

        let tangent = this.center.getTangentAt(LANE_START_OFFSET).normalize();
        let paperToThree = new Vector3(tangent.x, 0, tangent.y);
        let forward = new Vector3(0, 0, -1);
        this.startRotation = new Quaternion().setFromUnitVectors(forward, paperToThree);

        let end = this.center.getPointAt((this.center.length - 1));
        this.endPosition = new Vector3(end.x, GROUND_HEIGHT, end.y);
    }

    distributePointsAlongPath(n, s)
    {
        let path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttributeNS(null, 'd', s);
        const pathLength = path.getTotalLength();
        const intervalLength = pathLength / (n - 1);
        const points = [];

        for (let i = 0; i < n; i++)
        {
            const length = i * intervalLength;
            const point = path.getPointAtLength(length);
            points.push({ l: length, x: point.x, y: point.y });
        }

        return points;
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

    addPointsToScene(renderer)
    {
        this.distributedPoints.forEach((item) => {
          const v = new Vector3(item.x, GROUND_HEIGHT, item.y);
          const l = new Mesh(this.geo, this.mat);
          const r = new Mesh(this.geo, this.mat);

          let t = this.center.getTangentAt(item.l);
          t = t ? t : { x: 0, y: -1 };
          let pointA = new Vector3(item.x, GROUND_HEIGHT, item.y);
          let pointD = new Vector3((item.x + (t.x * 10)), GROUND_HEIGHT, (item.y + (t.y * 10)));
          let perp = this.calculatePerpendicularLine(pointA, pointD);
          let paperPerp = new paper.Path(('M ' + perp.perpPointA.x + ' ' + perp.perpPointA.z + ' L ' + perp.perpPointB.x + ' ' + perp.perpPointB.z));
          let leftIntersections = this.left.getIntersections(paperPerp);
          let rightIntersections = this.right.getIntersections(paperPerp);
          let lv3 = new Vector3(leftIntersections[0]._point.x, GROUND_HEIGHT, leftIntersections[0]._point.y);
          let rv3 = new Vector3(rightIntersections[0]._point.x, GROUND_HEIGHT, rightIntersections[0]._point.y);

          l.position.set(lv3.x, lv3.y, lv3.z);
          r.position.set(rv3.x, rv3.y, rv3.z);

          this.segments.push({
            pointL: lv3,
            pointR: rv3,
            offsetL: leftIntersections[0].offset,
            offsetR: rightIntersections[0].offset
          });

          renderer.scene.add(l);
          renderer.scene.add(r);
        });
    }
}

export { Lane };
