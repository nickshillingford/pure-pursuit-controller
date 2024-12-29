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

class SVGParser
{
    constructor(demo, data)
    {
        this.curves = [];

        const lane1 = this.parsePath(data[demo]);
        this.curves.push(this.buildCurves(lane1, 0xeff0000));
        this.lane = new Lane(data[demo]);

        if (demo === 'lane-change') {
          const lane2 = this.parsePath('M 1 180 L 1 -180');
          this.curves.push(this.buildCurves(lane2, 0xff0000));
          this.lane2 = new Lane('M 1 180 L 1 -180');
        }
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
            const endPoint = new Vector3(parseFloat(t.x), GROUND_HEIGHT, parseFloat(t.y));
            const geometry = new BufferGeometry().setFromPoints([startPoint, endPoint]);
            const obj = new Line(geometry, new LineBasicMaterial({ color: color }));
            curves.push(obj);
            startPoint = endPoint;
          }
          else if (t.type === 'C') {
            const p1 = new Vector3(parseFloat(t.x1), GROUND_HEIGHT, parseFloat(t.y1));
            const p2 = new Vector3(parseFloat(t.x2), GROUND_HEIGHT, parseFloat(t.y2));
            const p3 = new Vector3(parseFloat(t.x), GROUND_HEIGHT, parseFloat(t.y));
            const bezCurve = new CubicBezierCurve3(startPoint, p1, p2, p3);
            const geometry = new BufferGeometry().setFromPoints(bezCurve.getPoints(NUM_POINTS));
            const curveObj = new Line(geometry, new LineBasicMaterial({ color: color }));
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
}

export { SVGParser };
