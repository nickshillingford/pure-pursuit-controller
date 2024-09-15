import { Vector3, Quaternion, MeshPhongMaterial } from '../libs/three.module.r122.js';

function threeVector(vec) {
	return new Vector3(vec.x, vec.y, vec.z);
}

function threeQuat(quat) {
	return new Quaternion(quat.x, quat.y, quat.z, quat.w);
}

function cannonVector(vec) {
	return new CANNON.Vec3(vec.x, vec.y, vec.z);
}

function cannonQuat(quat) {
	return new CANNON.Quaternion(quat.x, quat.y, quat.z, quat.w);
}

function getAngleBetweenVectors(v1, v2, dotTreshold) {
  dotTreshold = dotTreshold ? dotTreshold : 0.0005;
	let angle;
	let dot = v1.dot(v2);

	if (dot > 1 - dotTreshold)
	{
			angle = 0;
	}
	else
	{
			if (dot < -1 + dotTreshold)
			{
					angle = Math.PI;
			}
			else
			{
					angle = Math.acos(dot);
			}
	}

	return angle;
}

function getSignedAngleBetweenVectors(v1, v2, normal, dotTreshold) {
  dotTreshold = dotTreshold ? dotTreshold : 0.0005;
  normal = normal ? normal : new Vector3(0, 1, 0);

	let angle = getAngleBetweenVectors(v1, v2, dotTreshold);
	let cross = new Vector3().crossVectors(v1, v2);

	if (normal.dot(cross) < 0) {
		angle = -angle;
	}

	return angle;
}

function getNormalizedRotationAngle(a, b, c) {
	let currentAngle = Math.atan2(b[1] - a[1], b[0] - a[0]);
	let desiredAngle = Math.atan2(c[1] - a[1], c[0] - a[0]);
	let rotationAngle = desiredAngle - currentAngle;
	rotationAngle = rotationAngle / Math.PI;
	if (rotationAngle > 1) {
		rotationAngle -= 2;
	}
	else if (rotationAngle < -1) {
		rotationAngle += 2;
	}
	return rotationAngle;
}

function calculateSpeed(currentSpeed, targetSpeed, maxAcceleration, maxDeceleration, distanceToTarget) {
	const decelerationDistance = 10;
	let force = 0;
	if (distanceToTarget > decelerationDistance) {
			if (currentSpeed < targetSpeed) {
					force = maxAcceleration;
			}
			else if (currentSpeed > targetSpeed) {
					force = (-maxDeceleration);
			}
	}
	else {
			maxDeceleration = 64;
			targetSpeed = 1;
			let desiredSpeed = (distanceToTarget / decelerationDistance) * targetSpeed;
			if (currentSpeed > desiredSpeed) {
					force = -maxDeceleration;
			}
	}
	return force;
}

function calculatePerpendicularLine(pointA, pointD, road, lookAheadDistance) {
	let length = 15;
	let direction = new Vector3().subVectors(pointD, pointA).normalize();
	let perpendicular = (direction.x === 0 && direction.z === 0) ? new Vector3(1, 0, 0) : new Vector3(-direction.z, 0, direction.x).normalize();
	let lineLength = pointA.distanceTo(pointD);
	let pointB = new Vector3().addVectors(pointA, pointD).multiplyScalar(0.5);
	let displacement = direction.multiplyScalar(lookAheadDistance * lineLength);

	pointB.add(displacement);

	let perpPointA = new Vector3().addVectors(pointB, perpendicular.clone().multiplyScalar(length / 2));
	let perpPointB = new Vector3().subVectors(pointB, perpendicular.clone().multiplyScalar(length / 2));
	let line = new paper.Path(new paper.Point(perpPointA.x, perpPointA.z), new paper.Point(perpPointB.x, perpPointB.z));
	let intersections = road.center.getIntersections(line);
	let pointC = (intersections.length > 0) ? new Vector3(intersections[0]._point.x, 0.325, intersections[0]._point.y) : null;

	return {
		pointB: pointB,
		pointC: pointC,
		perpPointA: perpPointA,
		perpPointB: perpPointB
	};
}

function setupMeshProperties(child) {
		let mat = new MeshPhongMaterial();
		mat.shininess = 0;
		mat.name = child.material.name;
		mat.map = child.material.map;
		mat.aoMap = child.material.aoMap;
		mat.transparent = child.material.transparent;
		mat.skinning = child.material.skinning;
		child.material = mat;
}

export {
	cannonQuat,
	cannonVector,
	calculateSpeed,
	calculatePerpendicularLine,
	getAngleBetweenVectors,
	getSignedAngleBetweenVectors,
	getNormalizedRotationAngle,
	threeQuat,
	threeVector,
	setupMeshProperties
};
