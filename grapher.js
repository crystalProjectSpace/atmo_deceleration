'use strict'

const { STYLES } = require('./styles.js')
const { getVectStats, getPointStats } = require('./utils.js')

const H_LINE = '_'
const V_LINE = '|'
const CROSS = '+'
const BLANK = ' '
const AXIS = '-'

const Grapher = function() {
	this.WIDTH = 0
	this.HEIGHT = 0
	
	this.x0 = 0
	this.x1 = 0
	this.y0 = 0
	this.y1 = 0
	
	this.kX = 1
	this.kY = 1
}
/**
* @description задать границы области отрисовки в пространстве экрана
*/
Grapher.prototype.init = function(WIDTH, HEIGHT) {
	this.WIDTH = WIDTH
	this.HEIGHT = HEIGHT
}
/**
* @description задать границы области отрисовки в реальном пространстве для набора векторов
*/
Grapher.prototype.setBoundsVect = function(XV, YV, dX = 0, dY = 0) {
	const bounds = getVectStats(XV, YV)
	
	this.x0 = bounds.x_min - dX
	this.x1 = bounds.x_max + dX
	this.y0 = bounds.y_min - dY
	this.y1 = bounds.y_max + dY
	
	this.kX = this.WIDTH / (this.x1 - this.x0)
	this.kY = this.HEIGHT / (this.y1 - this.y0)
}
/**
* @description задать границы области отрисовки в реальном пространстве для набора точек со значением
*/
Grapher.prototype.setBoundsPoint = function(vals, dX = 0, dY = 0) {
	const bounds = getPointStats(vals)
	
	this.x0 = bounds.x_min - dX
	this.x1 = bounds.x_max + dX
	this.y0 = bounds.y_min - dY
	this.y1 = bounds.y_max + dY
	
	this.kX = this.WIDTH / (this.x1 - this.x0)
	this.kY = this.HEIGHT / (this.y1 - this.y0)
}
/**
* @description сформировать чистую канву для отрисовки
*/
Grapher.prototype.createCanvas = function(xZero, yZero) {
	const hMax = this.HEIGHT + 2
	const wMax = this.WIDTH + 2
	const hBorder = H_LINE.repeat(wMax)
	const j_zero = Math.max(Math.round((yZero - this.y0) * this.kY), 1)
	const i_zero = Math.max(Math.round((xZero - this.x0) * this.kX), 1)
	
	const result = [hBorder]
	
	for(let j = 0; j < this.HEIGHT; j++) {
		let sym = '', axis = ''
		if(j === j_zero) {
			sym = AXIS
			axis = CROSS
		} else {
			sym = BLANK
			axis = V_LINE
		}

		result.push(`${V_LINE}${sym.repeat(i_zero - 1)}${axis}${sym.repeat(this.WIDTH - i_zero)}${V_LINE}`);
		
	}
	result.push(hBorder);
	
	return result
}
/**
* @description вывести набор окрашенных точек
*/
Grapher.prototype.putColoredPoints = function(XV, YV, xZero, yZero, sym, cl) {
	const nPoints = XV.length
	const rawCanvas = this.createCanvas(xZero, yZero)
	const nRow = this.HEIGHT + 2
	const clSym = `${STYLES[cl]}${sym}${STYLES.Reset}`

	for(let i = 0; i < nPoints; i++) {
		const iX = Math.round((XV[i] - this.x0) * this.kX) + 1
		const jY = nRow - Math.round((YV[i] - this.y0) * this.kY) - 1
		rawCanvas[jY] = `${rawCanvas[jY].slice(0, iX - 1)}S${rawCanvas[jY].slice(iX)}`
	}
	
	for(let j = 0; j < nRow; j++) {
		rawCanvas[j] = rawCanvas[j].replace(/S/g, clSym)
	}	
	
	return rawCanvas
}
/**
* @description вывести набор точек в монохроме
*/
Grapher.prototype.putBlankPoints = function(XV, YV, xZero, yZero, sym) {
	const nPoints = XV.length
	const rawCanvas = this.createCanvas(xZero, yZero)
	const nRow = this.HEIGHT + 2

	for(let i = 0; i < nPoints; i++) {
		const iX = Math.round((XV[i] - this.x0) * this.kX) + 1
		const jY = nRow - Math.round((YV[i] - this.y0) * this.kY) - 1
		rawCanvas[jY] = `${rawCanvas[jY].slice(0, iX - 1)}${sym}${rawCanvas[jY].slice(iX)}`
	}
	
	return rawCanvas
}
/**
* @description вывести графику для векторов аргумента и значения
*/
Grapher.prototype.renderPoints = function(XV, YV, xZero, yZero, sym, cl, dX = 0, dY = 0) {
	this.setBoundsPoint(XV, YV, dX, dY)
	return cl
		? this.putColoredPoints(XV, YV, xZero, yZero, sym, cl)
		: this.putBlankPoints(XV, YV, xZero, yZero, sym)
}
/**
* @description вывести графику для набора точек, цвет вывода определяется значением функции в точке
*/
Grapher.prototype.renderValuedPoints = function(vals, graphMap) {
	const nPoints = vals.length
	const nRow = this.HEIGHT + 2
	const { mapFunc, index2codeMap } = graphMap
	const nMap = index2codeMap.length
	
	this.setBoundsPoint(vals)
		
	const rawCanvas = this.createCanvas(0, 0)
	for(let i = 0; i < nPoints; i++){
		const X = vals[i].X
		const Y = vals[i].Y
		const val = vals[i].val
		const iX = Math.round((X - this.x0) * this.kX) + 1
		const jY = nRow - Math.round((Y - this.y0) * this.kY) - 1
		const clCode = mapFunc(val)
		rawCanvas[jY] = `${rawCanvas[jY].slice(0, iX - 1)}${index2codeMap[clCode][0]}${rawCanvas[jY].slice(iX)}`
	}
	
	let rawPrn = rawCanvas.join('\n')
	for(let i = 0; i < nMap; i++){
		const [code, color] = index2codeMap[i]
		rawPrn = rawPrn.replace(new RegExp(`${code}`, 'g', 'm'), `${color} ${STYLES.Reset}`)
	}
	
	return rawPrn
}

module.exports = { Grapher }