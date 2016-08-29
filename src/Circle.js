/**
* @license
* Copyright 2016 Ruben Afonso, ruben@figurebelow.com
* This source code is licensed under the Apache license (see LICENSE file)
**/

"use strict";

let Path = require ("./Path.js").Path;

/**
 * Circle class
 * @extends Path
 */
class Circle extends Path {

  /**
   * Constructor
   * @param {map} values - values to initialize the Circle
   * @param {map} style - styles to initialize the Circle
   */
  constructor (values, style) {
    var cx = values["cx"] || 0;
    var cy = values["cy"] || 0;
    var r = values["r"] || 5;
    var p0 = "M" + cx + "," + cy + " ";
    var p1 = "m" + (-r) + "," + 0 + " ";
    var p2 = "a" + r + "," + r + " " + 0 + " " + "1,0 " + (r * 2) + ",0 ";
    var p3 = "a" + r + "," + r + " " + 0 + " " + "1,0 " + -(r * 2) + ",0 ";
    var d = p0 + " " + p1 + " " + p2 + " " + p3;
    var procParams = {"d":d};
    procParams["r"] = r;
    super (procParams, style);
  }

  /**
   * Returns the center of the Circle
   * @return {map} xy position of the Circle
   */
  getCenter () {
    return this.parsedPoints[0].values[0];
  }

  /**
   * Moves the circle to the given position
   * @param {map} xyPos - the xy position
   */
  moveTo (xyPos) {
    this.parsedPoints[0].values[0].x = xyPos.x;
    this.parsedPoints[0].values[0].y = xyPos.y;
    var r = this.getAttr("r");
    var p0 = "M" + xyPos.x + "," + xyPos.y + " ";
    var p1 = "m" + r + "," + 0 + " ";
    var p2 = "a" + r + "," + r + " " + 0 + " " + "1,0 " + (r * 2) + ",0 ";
    var p3 = "a" + r + "," + r + " " + 0 + " " + "1,0 " + -(r * 2) + ",0 ";
    var d = p0 + " " + p1 + " " + p2 + " " + p3;
    this.setAttr({"d":d});
    return this;
  }
};

module.exports.Circle = Circle;
