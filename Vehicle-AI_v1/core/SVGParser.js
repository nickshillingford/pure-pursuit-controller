import {
  Box3,
  BufferGeometry,
  CubicBezierCurve3,
  Float32BufferAttribute,
  LineBasicMaterial,
  Line,
  Vector3
} from '../libs/three.module.r122.js';

import { Lane } from './Lane.js';

const PATH_COMMANDS =
{
    'M': ['x', 'y'],
    'L': ['x', 'y'],
    'C': ['x1', 'y1', 'x2', 'y2', 'x', 'y']
};

const GROUND_HEIGHT = 0.325;
const NUM_POINTS = 800;

var raphael = Raphael('paper-canvas');

class SVGParser
{
    constructor(data)
    {
        this.curves = [];

        let lane = data.split('M');

        lane.shift();

        let leftBoundry = ('M ' + lane[0]).trim();
        let center = ('M ' + lane[1]).trim();
        let rightBoundry = ('M ' + lane[2]).trim();

        let leftBoundryTokens = this.parsePath(leftBoundry);
        let leftBoundryCurves = this.buildCurves(leftBoundryTokens, 0x0000ff);

        let centerTokens = this.parsePath(center);
        let centerCurves = this.buildCurves(centerTokens, 0xe67e22);

        let rightBoundryTokens = this.parsePath(rightBoundry);
        let rightBoundryCurves = this.buildCurves(rightBoundryTokens, 0x0000ff);

        this.curves.push(leftBoundryCurves);
        this.curves.push(centerCurves);
        this.curves.push(rightBoundryCurves);

        let laneObj = new Lane(leftBoundry, center, rightBoundry);

        laneObj.raphaelL = raphael.path(leftBoundry);
        laneObj.raphaelR = raphael.path(rightBoundry);

        this.lane = laneObj;
    }

    buildCurves(tokens, color)
    {
        let curves = [];
        let startPoint;
        tokens.forEach((t) => {
          if (t.type === 'M') {
            startPoint = new Vector3(parseFloat(t.x), GROUND_HEIGHT, parseFloat(t.y));
          }
          else if (t.type === 'L') {
            let endPoint = new Vector3(parseFloat(t.x), GROUND_HEIGHT, parseFloat(t.y));
            let geometry = new BufferGeometry().setFromPoints([startPoint, endPoint]);
            let obj = new Line(geometry, new LineBasicMaterial({ color: color }));
            curves.push(obj);
            startPoint = endPoint;
          }
          else if (t.type === 'C') {
            let p1 = new Vector3(parseFloat(t.x1), GROUND_HEIGHT, parseFloat(t.y1));
            let p2 = new Vector3(parseFloat(t.x2), GROUND_HEIGHT, parseFloat(t.y2));
            let p3 = new Vector3(parseFloat(t.x), GROUND_HEIGHT, parseFloat(t.y));
            let bezCurve = new CubicBezierCurve3(startPoint, p1, p2, p3);
            let geometry = new BufferGeometry().setFromPoints(bezCurve.getPoints(NUM_POINTS));
            let curveObj = new Line(geometry, new LineBasicMaterial({ color: color }));
            curves.push(curveObj);
            startPoint = p3;
          }
        });
        return curves;
    }

    parsePath(path)
    {
        const items = path.replace(/[\n\r]/g, '').
                      replace(/-/g, ' -').
                      replace(/(\d*\.)(\d+)(?=\.)/g, '$1$2 ').
                      trim().
                      split(/\s*,|\s+/);

        const segments = [];
        let currentCommand = '';
        let currentElement = {};

        while (items.length > 0) {
          let it = items.shift();
          if (PATH_COMMANDS.hasOwnProperty(it)) {
            currentCommand = it;
          }
          else {
            items.unshift(it);
          }

          currentElement = { type: currentCommand };

          PATH_COMMANDS[currentCommand].forEach((prop) => {
            it = items.shift();
            currentElement[prop] = it;
          });

          if (currentCommand === 'M'){
            currentCommand = 'L';
          }
          else if (currentCommand === 'm'){
            currentCommand = 'l';
          }

          segments.push(currentElement);
        }

        return segments;
    }

    buildLaneSegmentCurves()
    {
            for (let j = 0; j < (this.lane.segments.length - 1); j++)
            {
                let subPathL = this.sanitizePath(this.lane.raphaelL.getSubpath(this.lane.segments[j].offsetL, this.lane.segments[j + 1].offsetL));
                let subPathR = this.sanitizePath(this.lane.raphaelR.getSubpath(this.lane.segments[j].offsetR, this.lane.segments[j + 1].offsetR));

                let l = subPathL.split(' ');
                let r = subPathR.split(' ');

                let s = 'M ' + l[2] + ' ' + l[4] + ' L ' + r[2] + ' ' + r[4];
                let e = 'M ' + l[l.length - 3] + ' ' + l[l.length - 1] + ' L ' + r[r.length - 3] + ' ' + r[r.length - 1];
                let pathString = (s + ' ' + subPathL + ' ' + subPathR  + ' ' + e);

                let tokens = this.parsePath(pathString);
                let curves = this.buildCurves(tokens, 0x00ff00);

                let combinedGeometry = new BufferGeometry();
                let material = new LineBasicMaterial({ color: 0x00ff00 });
                let positions = [];

                curves.forEach(function(line) {
                    let geometry = line.geometry;
                    let linePositions = geometry.attributes.position.array;

                    for (let i = 0; i < linePositions.length; i++) {
                        positions.push(linePositions[i]);
                    }
                });

                combinedGeometry.setAttribute('position', new Float32BufferAttribute(positions, 3));

                let combinedMesh = new Line(combinedGeometry, material);
                let boundingBox = new Box3().setFromObject(combinedMesh);

                this.lane.laneSegments.push({
                  path: pathString,
                  bbox: boundingBox,
                  curves: curves,
                  xA: parseFloat(l[2].trim()),
                  yA: parseFloat(l[4].trim()),
                  xB: parseFloat(l[l.length - 3].trim()),
                  yB: parseFloat(l[l.length - 1].trim())
               });
            }
    }

    sanitizePath(path)
    {
        path = path.replace(/,/g, ' ');
        path = path.replace(/([MLC])/g, ' $1 ');
        path = path.replace(/([0-9.-]+)/g, ' $1');

        return path.trim();
    }
}

export { SVGParser };
