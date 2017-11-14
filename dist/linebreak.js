'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.INFINITY = undefined;
exports.glue = glue;
exports.box = box;
exports.penalty = penalty;
exports.linebreak = linebreak;

var _linkedList = require('./linked-list');

var t = 0;

/**
 * @preserve Knuth and Plass line breaking algorithm in JavaScript
 *
 * Licensed under the new BSD License.
 * Copyright 2009-2010, Bram Stein
 * Copyright 2015, April Arcus
 * All rights reserved.
 */

var INFINITY = exports.INFINITY = 10000;

function glue(width, stretch, shrink) {
	return { Glue: true, width: width, stretch: stretch, shrink: shrink };
};

function box(width, value) {
	return { Box: true, width: width, value: value };
};

function penalty(width, penalty, flagged) {
	return { Penalty: true, width: width, penalty: penalty, flagged: flagged };
};

// TODO: type annotation
var incipit = new _linkedList.Node({
	position: 0,
	demerits: 0,
	ratio: 0,
	line: -1,
	fitnessClass: 0,
	totals: { width: 0, stretch: 0, shrink: 0 },
	previous: null
});

// function breakpoint(position, demerits, ratio, line, fitnessClass, totals, previous) {
// 	return new LinkedList.Node(
// 		{ position, demerits, ratio, line, fitnessClass, totals, previous }
// 	);
// }

function linebreak(nodes, lineLengths) {
	var _ref = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
	    _ref$tolerance = _ref.tolerance,
	    tolerance = _ref$tolerance === undefined ? 2 : _ref$tolerance,
	    _ref$demerits = _ref.demerits;

	_ref$demerits = _ref$demerits === undefined ? {} : _ref$demerits;
	var _ref$demerits$line = _ref$demerits.line,
	    line = _ref$demerits$line === undefined ? 10 : _ref$demerits$line,
	    _ref$demerits$flagged = _ref$demerits.flagged,
	    flagged = _ref$demerits$flagged === undefined ? 100 : _ref$demerits$flagged,
	    _ref$demerits$fitness = _ref$demerits.fitness,
	    fitness = _ref$demerits$fitness === undefined ? 3000 : _ref$demerits$fitness;

	var start = window.performance.now();

	function computeCost(start, end, active, currentLine) {
		var lastNode = nodes[end];
		var penaltyWidth = lastNode.Penalty ? lastNode.width : 0;
		var width = sum.width - active.totals.width + penaltyWidth;

		// If the current line index is within the list of linelengths, use it,
		// otherwise use the last line length of the list.
		var lineLength = currentLine < lineLengths.length - 1 ? lineLengths[currentLine] : lineLengths[lineLengths.length - 1];
		var availableWidth = lineLength - width;

		if (availableWidth > 0) {
			// Calculate the stretch ratio
			var stretch = sum.stretch - active.totals.stretch;
			if (stretch <= 0) return INFINITY;
			return availableWidth / stretch;
		} else if (availableWidth < 0) {
			// Calculate the shrink ratio
			var shrink = sum.shrink - active.totals.shrink;
			if (shrink <= 0) return INFINITY;
			return availableWidth / shrink;
		} else {
			// perfect match
			return 0;
		}
	}

	// Add width, stretch and shrink values from the current
	// break point up to the next box or forced penalty.
	function computeSum(breakPointIndex) {
		var width = sum.width,
		    stretch = sum.stretch,
		    shrink = sum.shrink;


		for (var i = breakPointIndex; i < nodes.length; i++) {
			var node = nodes[i];
			if (node.Glue) {
				width += node.width;
				stretch += node.stretch;
				shrink += node.shrink;
			} else if (node.Box) {
				break;
			} else if (node.Penalty) {
				if (node.penalty === -INFINITY && i > breakPointIndex) break;
			}
		}

		return { width: width, stretch: stretch, shrink: shrink };
	}

	// The main loop of the algorithm
	function mainLoop(node, index, nodes) {
		// The inner loop iterates through all the active nodes with line <
		// currentLine and then breaks out to insert the new active node candidates
		// before looking at the next active nodes for the next lines. The result
		// of this is that the active node list is always sorted by line number.
		var active = activeNodes.head;
		while (active) {

			// TODO: hoist this allocation and clean the objects here instead
			var candidates = [{ active: undefined, demerits: Infinity, ratio: undefined }, { active: undefined, demerits: Infinity, ratio: undefined }, { active: undefined, demerits: Infinity, ratio: undefined }, { active: undefined, demerits: Infinity, ratio: undefined }];

			// Iterate through the linked list of active nodes to find new potential
			// active nodes and deactivate current active nodes.
			while (active) {
				var currentLine = active.data.line + 1;
				var ratio = computeCost(active.data.position, index, active.data, currentLine);

				// Deactive nodes when the distance between the current active node
				// and the current node becomes too large (i.e. it exceeds the stretch
				// limit and the stretch ratio becomes negative) or when the current
				// node is a forced break (i.e. the end of the paragraph when we want
				// to remove all active nodes, but possibly have a final candidate
				// active node --- if the paragraph can be set using the given
				// tolerance value.)
				if (ratio < -1 || node.Penalty && node.penalty === -INFINITY) {
					activeNodes.remove(active);
				}

				// If the ratio is within the valid range of -1 <= ratio <= tolerance calculate the
				// total demerits and record a candidate active node.
				if (-1 <= ratio && ratio <= tolerance) {
					var badness = 100 * Math.pow(Math.abs(ratio), 3);
					var demerits = void 0;

					// Positive penalty
					if (node.Penalty && node.penalty >= 0) {
						demerits = Math.pow(line + badness, 2) + Math.pow(node.penalty, 2);
						// Negative penalty but not a forced break
					} else if (node.Penalty && node.penalty !== -INFINITY) {
						demerits = Math.pow(line + badness, 2) - Math.pow(node.penalty, 2);
						// All other cases
					} else {
						demerits = Math.pow(line + badness, 2);
					}

					if (node.Penalty && node.flagged && nodes[active.data.position].Penalty && nodes[active.data.position].flagged) {
						demerits += flagged;
					}

					// Calculate the fitness class for this candidate active node.
					var currentClass = ratio < -0.5 ? 0 : ratio <= 0.5 ? 1 : ratio <= 1 ? 2 : 3;
					var candidate = candidates[currentClass];

					// Add a fitness penalty to the demerits if the fitness classes of
					// two adjacent lines differ too much.
					if (Math.abs(currentClass - active.data.fitnessClass) > 1) {
						demerits += fitness;
					}

					// Add the total demerits of the active node to get the total
					// demerits of this candidate node.
					demerits += active.data.demerits;

					// Only store the best candidate for each fitness class
					if (demerits < candidate.demerits) {
						candidate.active = active;
						candidate.demerits = demerits;
						candidate.ratio = ratio;
					}
				}

				active = active.next;

				// Stop iterating through active nodes to insert new candidate active
				// nodes in the active list before moving on to the active nodes for
				// the next line.
				// TODO: The Knuth and Plass paper suggests a conditional for
				// currentLine < j0. This means paragraphs with identical line lengths
				// will not be sorted by line number. Find out if that is a desirable
				// outcome. For now I left this out, as it only adds minimal overhead
				// to the algorithm and keeping the active node list sorted has a
				// higher priority.
				if (active && active.data.line >= currentLine) break;
			} // end inner loop

			var candidatesLength = candidates.length;
			for (var fitnessClass = 0; fitnessClass < candidatesLength; fitnessClass++) {
				var _candidate = candidates[fitnessClass];
				if (_candidate.demerits === Infinity) continue;
				var newNode = new _linkedList.Node({
					position: index,
					demerits: _candidate.demerits,
					ratio: _candidate.ratio,
					line: _candidate.active.data.line + 1,
					fitnessClass: fitnessClass,
					totals: computeSum(index),
					previous: _candidate.active
				});
				if (active) {
					activeNodes.insertBefore(active, newNode);
				} else {
					activeNodes.push(newNode);
				}
			}
		} // end outer loop
	}

	// Add an active node for the start of the paragraph.
	var activeNodes = new _linkedList.LinkedList();
	activeNodes.push(incipit);

	var sum = {
		width: 0,
		stretch: 0,
		shrink: 0
	};
	nodes.forEach(function (node, index, nodes) {
		if (node.Box) {
			sum.width += node.width;
		} else if (node.Glue) {
			if (index > 0 && nodes[index - 1].Box) {
				mainLoop(node, index, nodes);
			}
			sum.width += node.width;
			sum.stretch += node.stretch;
			sum.shrink += node.shrink;
		} else if (node.Penalty) {
			if (node.penalty !== INFINITY) mainLoop(node, index, nodes);
		}
	});

	if (activeNodes.listSize === 0) return {
		positions: undefined,
		ratios: undefined,
		error: new Error('No break found for tolerance = ' + tolerance)
	};

	// Find the best active node (the one with the least total demerits.)
	var bestActiveNode = activeNodes.head;
	var cursor = activeNodes.head;
	while (cursor) {
		if (cursor.data.demerits < bestActiveNode.data.demerits) bestActiveNode = cursor;
		cursor = cursor.next;
	}

	var positions = new Array(bestActiveNode.data.line + 1);
	var ratios = new Array(bestActiveNode.data.line + 1);

	cursor = bestActiveNode;
	while (cursor !== incipit) {
		positions[cursor.data.line] = cursor.data.position;
		ratios[cursor.data.line] = cursor.data.ratio;
		cursor = cursor.data.previous;
	}

	var breaks = { positions: positions, ratios: ratios, error: undefined };

	var d = window.performance.now() - start;
	t += d;
	// console.log(`Pass at tolerance = ${tolerance} took ${d.toFixed(3)}ms; total = ${t.toFixed(3)}ms`);

	return breaks;
};
