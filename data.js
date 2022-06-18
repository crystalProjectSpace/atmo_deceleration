'use strict'
/** ИД для запуска моделирования */
module.exports = {
	locations: {
		ARES: {
			R: 3.3895E+6,
			g0: 3.13,
			kAtmo:-0.0000756769825918762,
			Ro0: 0.02343
		},
		EARTH: {
			R: 6.3711E+6,
			g0: 9.807,
			kAtmo: -0.0001261574074074074,
			Ro0: 1.21	
		},
	},
	vehicles: {
			TEST_FLYER: {
		engine: {
			J: 3000,
			omega_max: 2500
		},
		M_DRY: 1000,
		M_FUEL: 0,
		S: (1000 / 1500),
		ADX: [
			[0, 1.2, 0],
			[45, 0.85, 0.15],
			[90, 0.65, -0.05],
		],
		ctrls: {
			omega: function(state, tau){ return 0 },
			alpha: function(state, tau){ return state[0] > 4000 ? (state[1] > -0.035 ? -45 : 0) : 45 },
			gamma: function(state, tau){ return 0}
		}
	}
	}
}