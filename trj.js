'use strict'
/**
* @description задать начальную точку
*/
const setState = function(V, Th, Psi,  H,  m) {
	return [V, Th, Psi, 0, H, 0, m]
} 
/**
* @description получить готовые АДХ
*/
const getADX = function(adx, _alpha) {
	const absAlpha = Math.abs(_alpha)
	let i = 0
	while(_alpha > adx[i][0]) {
		if(adx[i + 1][0] > _alpha) { break; }
		i++
	}
		
	const dCX = adx[i + 1][1] - adx[i][1]
	const dCY = adx[i + 1][2] - adx[i][2]
	const dAlpha = (absAlpha - adx[i][0]) / (adx[i + 1][0] - adx[i][0])
	const CX = adx[i][1] + dAlpha * dCX
	const CY = Math.sign(_alpha) * (adx[i][2] + dAlpha * dCY)	

	return [ CX, CY ]
}
/**
* @description Барометрическая формула
*/
const RoH = function(Ro0, kAtmo, H) { return Ro0 * Math.exp(kAtmo * H) }

const getDerivs = function(state, obj, env, t) {
	const V = state[0]
	const Th = state[1]
	const Psi = state[2]
	const X = state[3]
	const H = state[4]
	const Z = state[5]
	const M = state[6]
		
	const radRel = env.R / (env.R + H)
	const g = env.g0 * radRel * radRel
	const omega = obj.ctrls.omega(state, t)
	const alpha = obj.ctrls.alpha(state, t)
	const gamma = obj.ctrls.gamma(state, t)
		
	const V_2 = V * V
	const QS = 0.5 * RoH(env.Ro0, env.kAtmo, H) * V_2 * obj.S
	const adx = getADX(obj.ADX, alpha)
	const XA = adx[0] * QS
	const YA = adx[1] * QS
	const CFG = M * V_2 / (env.R + H)
		
	const STH = Math.sin(Th)
	const CTH = Math.cos(Th)
	
	const SPSI = Math.sin(Psi)
	const CPSI = Math.cos(Psi)
	
	const AX = alpha / 57.3
	const GX = gamma / 57.3
	
	const CA = Math.cos(AX)
	const SA = Math.sin(AX)
	
	const CG = Math.cos(GX)
	const SG = Math.sin(GX)
	
	const R = omega * obj.engine.J
	const MV = M * V
	const accel = (R * CA * CG - XA)/ M  - g * STH
	const dTh = ((R * SA + YA) * CG + CFG - M * g * CTH) / MV
	const dPsi = (YA + R * SA) * SG / MV 
	
	return [
		accel,
		dTh,
		dPsi,
		V * CTH * CPSI,
		V * STH,
		V * CTH * SPSI,
		-omega	
	]
}
/**
* @description запуск моделирования
*/
const calc = function(obj, env, V_0, Th_0, Psi_0,  H_0, dT, tauMax) {
	let tau = 0
	let i = 0
	const dT_05 = 0.5 * dT
	const result = [
		{
			t: 0,
			state: setState(V_0, Th_0, Psi_0, H_0, obj.M_DRY + obj.M_FUEL)
		}
	]

	while(result[i].state[4] > 0 && tau < tauMax ) {
		const STATE = result[i].state
		const K0 = getDerivs(STATE, obj, env, tau)
		const K1 = getDerivs(
			[
				STATE[0] + K0[0]*dT,
				STATE[1] + K0[1]*dT,
				STATE[2] + K0[2]*dT,
				STATE[3] + K0[3]*dT,
				STATE[4] + K0[4]*dT,
				STATE[5] + K0[5]*dT,
				STATE[6] + K0[6]*dT,
			],
			obj,
			env,
			tau
		)
		
		tau += dT		
		result.push({t: tau, state: [
			STATE[0] + (K0[0] + K1[0])*dT_05,
			STATE[1] + (K0[1] + K1[1])*dT_05,
			STATE[2] + (K0[2] + K1[2])*dT_05,
			STATE[3] + (K0[3] + K1[3])*dT_05,
			STATE[4] + (K0[4] + K1[4])*dT_05,
			STATE[5] + (K0[5] + K1[5])*dT_05,
			STATE[6] + (K0[6] + K1[6])*dT_05			
		]})
		i++
	}
	return result
}

const interpret = function(rawData, env, makeDetails = false) {
	const nLogs = rawData.length
	let res = makeDetails ? 't(s)\tnX\tnY\tQ(Pa)\n)' : null
	
	let nXmax = 0
	let nYmax = 0
	let qMax = 0
	let tNxMax = 0
	let tNyMax = 0
	let tQMax = 0
	let hNxMax = 0
	let hNyMax = 0
	let hQMax = 0
	
	for(let i = 1; i < nLogs; i++) {
		const state0 = rawData[i - 1].state
		const state1 = rawData[i].state
		
		const dT = rawData[i].t - rawData[i - 1].t
		const dV = (state1[0] - state0[0]) / dT
		const dTh = (state1[1] - state0[1]) / dT
		const dPsi = (state1[2] - state0[2]) / dT
		const V = 0.5 * (state0[0] + state1[0])
		const Th = 0.5 * (state0[1] + state1[1])
		const H = 0.5 * (state0[4] + state1[4])
		const Ro = RoH(env.Ro0, env.kAtmo, H)
		const hTotal = env.R + H
		const radRel = env.R / hTotal
		const V2 = V * V
		const g = env.g0 * radRel * radRel
		const nX = (dV + g * Math.sin(Th))/9.81 
		const nY_1 = (V * dTh - V2 / hTotal + g * Math.cos(Th))/9.81
		const nY_2 = V * dPsi / 9.81
		const nY = Math.hypot(nY_1, nY_2)
		const Q = 0.5 * Ro * V2
		
		if(i === 1) {
			nXmax = nX
			nYmax = nY
			qMax = Q
			tNxMax = 0
			tQMax = 0
		} else {
			if(Math.abs(nX) > Math.abs(nXmax)) {
				nXmax = nX
				tNxMax = rawData[i].t
				hNxMax = H
			}
			if(Math.abs(nY) > Math.abs(nYmax)) {
				nYmax = nY
				tNyMax = rawData[i].t
				hNyMax = H
			}
			if(Q > qMax) {
				qMax = Q
				tQMax = rawData[i].t
				hQMax = H
			}
		}

		if(makeDetails) res += `${rawData[i].t.toFixed(2)}\t${nX.toFixed(2)}\t${nY.toFixed(2)}\t${Q.toFixed(0)}\n`
	}
	
	const lastPoint = rawData[rawData.length - 1].state

	return {
		details: res,
		compact: `nxMax: ${nXmax.toFixed(2)} (t=${tNxMax.toFixed(1)}; H=${hNxMax.toFixed(0)})\nnyMax: ${nYmax.toFixed(2)} (t=${tNyMax.toFixed(1)}; H=${hNyMax.toFixed(0)})\nqMax: ${qMax.toFixed(0)} (t=${tQMax.toFixed(1)}; H=${hQMax.toFixed(0)})\nrange=${(lastPoint[3]/1E+3).toFixed(0)}km\ncrossrange=${(lastPoint[5]/1E+3).toFixed(0)}km\nVimpact=${lastPoint[0].toFixed(1)}m/s\n`
	}
}

const printRaw = function(res, step) {
	return testMod.reduce((result, item, i) => {
		const {t, state} = item
		if(i % step === 0) {
			const currentState = `${t.toFixed(1)}\t${state[0].toFixed(1)}\t${(state[1]*57.3).toFixed(2)}\t${(state[4]/1E3).toFixed(0)}\n`
			return result + currentState
		}
		return result	
	}, '')
}

const createGraphData = function(res, step, X_index, Y_index) {
	const N = Math.ceil(res.length / step)
	const XV = [X_index === -1 ? res[0].t : res[0].state[X_index]]
	const YV = [res[0].state[Y_index]]
	let index = 0
	for(let i = 1; i < N; i++) {
		index += step
		XV.push(X_index === -1 ? res[index].t : res[index].state[X_index])
		YV.push(res[index].state[Y_index])
	}
	
	return {
		XV: XV,
		YV: YV
	}
}

module.exports = {
	calc,
	interpret,
	printRaw,
	createGraphData
}