'use strict'

const { locations, vehicles } = require('./data.js')
const { calc, interpret, printRaw, createGraphData } = require('./trj.js')
const { Grapher } = require('./grapher.js')

const STARTING_POINT = {
	Th0: -11.15 / 57.3,
	Psi0: 0,
	V0: 7000,
	H0: 115000,
	dT_base: 0.1,	
}

const flightExperiment = function(initData, vehicle, locus, dataStep, graphData, graphResolution) {
	const { Th0, Psi0, V0, H0, dT_base } = initData
	
	const testData = calc(
		vehicle,
		locus,
		V0,
		Th0,
		Psi0,
		H0,
		dT_base,
		100500
	)
	
	let result = ''
	const nGraphs = graphData.length
	let graphs = ''
	const grapher = new Grapher()
	grapher.init(graphResolution.width, graphResolution.height)
	
	for(let i = 0; i < nGraphs; i++ ) {
		const graphPoints = createGraphData(testData, dataStep, graphData[i].xIndex, graphData[i].yIndex)
		grapher.setBoundsVect(graphPoints.XV, graphPoints.YV)
		const graph = '\n' + graphData[i].header + '\n' + grapher.putColoredPoints(
			graphPoints.XV,
			graphPoints.YV,
			0,
			0,
			graphData[i].symbol,
			'FgGreen',
		).join('\n')
		
		graphs += graph
	}
	
	const report = interpret(testData, locus)
	result = graphs + '\n' + report.compact
	
	return result
}

const modResult = flightExperiment(
STARTING_POINT,
	vehicles.TEST_FLYER,
	locations.ARES,
	100,
	[
		{ xIndex: 3, yIndex: 0, symbol: '+', header: 'V(Range)' },
		{ xIndex: 3, yIndex: 4, symbol: '+', header: 'H(Range)' }
	],
	{ width: 128, height: 36 }
)

console.log(modResult)
