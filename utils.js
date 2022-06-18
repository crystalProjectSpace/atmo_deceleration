'use strict'

const getVectStats = function(XV, YV) {
	const nPoints = XV.length
	let x_min = XV[0], x_max = XV[0], y_min = YV[0], y_max = YV[0], x_s = XV[0], y_s = YV[0]
	
	for(let i = 1; i < nPoints; i++){
		if(x_min > XV[i]) {
			x_min = XV[i]
		} else if(x_max < XV[i]) {
			x_max = XV[i]
		}
		
		if(y_min > YV[i]) {
			y_min = YV[i]
		} else if(y_max < YV[i]) {
			y_max = YV[i]
		}
		
		x_s += XV[i]
		y_s += YV[i]
	}
	x_s /= nPoints
	y_s /= nPoints
	
	return { x_min, x_max, y_min, y_max, x_s, y_s }
}

const getPointStats = function(points) {
	const nPoints = points.length
	let x_min = points[0].X, x_max = points[0].X, y_min = points[0].Y, y_max = points[0].Y, x_s = points[0].X, y_s = points[0].Y
	
	for(let i = 1; i < nPoints; i++){
		const X = points[i].X
		const Y = points[i].Y
		if(x_min > X) {
			x_min = X
		} else if(x_max < X) {
			x_max = X
		}
		
		if(y_min > Y) {
			y_min = Y
		} else if(y_max < Y) {
			y_max = Y
		}
		
		x_s += X
		y_s += Y
	}
	x_s /= nPoints
	y_s /= nPoints
	
	return { x_min, x_max, y_min, y_max, x_s, y_s }
}

module.exports = { getVectStats, getPointStats }