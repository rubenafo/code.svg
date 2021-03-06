/**
* @license
* Copyright 2017 Ruben Afonso, rubenaf.com
* This source code is licensed under the Apache license (see LICENSE file)
**/

"use strict";

let SVGBase = require ("./SVGBase.js").SVGBase;
let Functions = require ("./utils/Functions.js").Functions;
let PointsParser = require ("./grammars/PathGrammar.js");
let PolygonParser = require ("./grammars/PolygonGrammar.js");
let Gradient = require ( "./Gradients.js");
let Pattern  = require ( "./Pattern.js").Pattern;

let D3 = require ("d3");

/**
 * Class Path
 * @extends SVGBase
 */
class Path extends SVGBase {

  /**
   * Path constructor
   * @override
   */
  constructor (values) {
    super ("path", values);
    if (values && "d" in values) {
      this.parsePoints (values["d"]);
    }
    else {
      this.setAttr({d:""});
      this.parsedPoints = [];
    }
  }

  parsePoints (dStr) {
    let d = dStr
    if (!d.startsWith("M")) { // array of points
      var pts  = PolygonParser.parse(d);
      d = "M" + pts[0].x + "," + pts[0].y + " ";
      pts.forEach (function (point, i) {
        if (i > 0) {
          d += "L" + point.x + "," + point.y + " "
        }
      });
      d += " z";
    }
    this.parsedPoints = PointsParser.parse (d);
    this.updateD();
  }

  /**
   * Clones a Path
   * @override
   * @return the new object
   */
  clone () {
    var newElem = new Path (this.attributes);
    newElem.setInnerAttr (this.innerAttributes)
    return newElem;
  }

  /**
   * Returns the Path's center
   * @return {object} {x:val,y:val} position of the Path's center
   * @override
   */
  getCenter () {
     let center = Functions.getPathCenter(this.parsedPoints);
     return Functions.NonIntersecPolCenter (center);
  }

  /**
   * Moves the object to the given xy point
   * @param {object} {x:val,y:val} position to move the Path's center to.
   * @return the object
   * @example
   * path.moveTo({x:10,y:10});
   */
  moveTo (xyPos, point) {
    var currentCenter = point || this.getCenter();
    var distance = {x: xyPos.x - currentCenter.x, y: xyPos.y - currentCenter.y};
    Functions.moveInsts (this.parsedPoints, distance);
    this.updateD();
    return this;
  }

  /**
   * Rotates the object
   * @param {number} deg degrees to rotate, clockwise
   * @param {object} point (optional) xy point, center of the rotation
   * @override
   * @returns the object
   * @example
   *  rect.rotate(45); // rotates around its center
   * @example
   * rect.rotate(45, new Point(12,14)); // rotates around the given point
   */
   rot (deg, origin) {
     var around = origin || this.getCenter();
     if (around == Path.UP || around == Path.DOWN || around == Path.RIGHT || around == Path.LEFT)
       around = this.pointAt(around);
     this.parsedPoints.forEach (function (inst) {
       Functions.rotateInst(inst, deg, around);
     });
     this.updateD();
     return this;
   }

  pointAt (pos) {
    if (pos == Path.UP) {
      let yVals = this.parsedPoints.filter(p => p != undefined && p.values != undefined).map(p2 => p2.values[0].y);
      return this.parsedPoints[yVals.indexOf(Math.min.apply(Math,yVals))].values[0];
    }
    else if (pos == Path.RIGHT) {
        let xVals = this.parsedPoints.filter(p => p != undefined && p.values != undefined).map(p2 => p2.values[0].x);
        return this.parsedPoints[xVals.indexOf(Math.max.apply(Math,xVals))].values[0];
    }
    else if (pos == Path.DOWN) {
        let yVals = this.parsedPoints.filter(p => p != undefined && p.values != undefined).map(p2 => p2.values[0].y);
        return this.parsedPoints[yVals.indexOf(Math.max.apply(Math,yVals))].values[0];
    }
    else if (pos == Path.LEFT) {
        let xVals = this.parsedPoints.filter(p => p != undefined && p.values != undefined).map(p2 => p2.values[0].x);
        return this.parsedPoints[xVals.indexOf(Math.min.apply(Math,xVals))].values[0];
    }
    else {
      let point = this.parsedPoints[pos].values[0];
      return {x:point.x, y:point.y};
    }
  }

  getPoints () {
    let xyPoints = this.parsedPoints.map (function (item) {
      if (item.type.toLowerCase() != "z")
        return {x:item.values[0].x, y:item.values[0].y};
    });
    return xyPoints.filter (function (elem) { return elem != undefined });
  }

  /**
   * Updates the 'd' coordinate of the Path.
   * @ignore
   */
  updateD () {
    var newD = "";
    this.parsedPoints.forEach (function (point, i, sourceList) {
      newD += point.type;
      if (point.type.toLowerCase() != 'z') {
        for (let key in point.values[0]) {
          newD += point.values[0][key] + ",";
        }
        newD = newD.slice(0,-1);
        if (i < sourceList.length-1)
          newD += " ";
      }
    });
    this.setAttr ({"d":newD});
  }

  /**
   * Subdivides the Path by adding a new point between each pair of coordinates
   * @param {number} its number of subdivision operations, 1 by default
   * @return the object
   * @example
   * line.subdivide(2); // subdivide twice
   */
  subdivide (its) {
    var iterations = its || 1;
    while (iterations > 0) {
      var clonedPoints = this.parsedPoints.slice(0);
      var interpolated = 0;
      for (var i  = 1; i < clonedPoints.length; i++) {
        if (clonedPoints[i].type == "L") {
          var intermediatePoint = Functions.NonIntersecPolCenter ([clonedPoints[i].values[0], clonedPoints[i-1].values[0]]);
          this.parsedPoints.splice (i + interpolated,0,{type:'L', values:[{x:intermediatePoint.x, y:intermediatePoint.y}]});
          interpolated++;
        }
        if (clonedPoints[i].type == "z") {
          var intermediatePoint = Functions.NonIntersecPolCenter ([clonedPoints[0].values[0], clonedPoints[i-1].values[0]]);
          this.parsedPoints.splice (i + interpolated,0,{type:'L', values:[{x:intermediatePoint.x, y:intermediatePoint.y}]});
        }
      }
      iterations--;
    }
    this.updateD();
    return this;
  }

  /**
   * Apply the given noise function to each point.
   * The noise function must return a pair of {xy} values when invoked.
   * @param {xyFun} xyFun the function to Apply
   * @return the object
   * @example
   * mymultiline.noise(function f () { return x: Math.random(), y:Math.random()});
   */
  noise (xyFun) {
    var that = this;
    for (var i = 0; i < this.parsedPoints.length; i++) {
      var point = this.parsedPoints[i];
      if (point.type != "z") {
        var values = xyFun (point.values[0], i);
        if (!Array.isArray(values)) {
          values = [values];
        }
        var mapped = (values == this.parsedPoints.length) || false;
        if (mapped) {
          point.values[0].x += values[i].x;
          point.values[0].y += values[i].y;
        }
        else {
          point.values[0].x += values[0].x;
          point.values[0].y += values[0].y;
        }
      }
    }
    this.updateD();
    return this;
  }
};

module.exports.Path = Path;
