/** @param {NS} ns **/
export async function main(ns) {

	var debug = false

	function doHack(target,hacksRequired) {
		if (debug) ns.tprint(`${hacksRequired} hacks required on ${target}`)
		let randNumber = Math.random() * (1000000 - 1) + 1
		ns.run('hack.js',hacksRequired,target,randNumber)
	}
	
	function doGrow(target,growsRequired) {
		if (debug) ns.tprint(`${growsRequired} grows required on ${target}`)
		let randNumber = Math.random() * (1000000 - 1) + 1
		ns.run('grow.js',growsRequired,target,randNumber)
	}

	function doWeaken(target,weakensRequired) {
		if (debug) ns.tprint(`${weakensRequired} weakens required on ${target}`)
		let randNumber = Math.random() * (1000000 - 1) + 1
		ns.run('weaken.js',weakensRequired,target,randNumber)
	}

	function preGrowSecurityCalc(target) {
		var moneyNow = ns.getServerMoneyAvailable(target)
		let moneyFactor = moneyNow / moneyMax
		let growsRequired = ns.growthAnalyze(target,(1/moneyFactor))
		if (growsRequired < 600) {
			growsRequired = 600
		}
		let securityImpact = ns.growthAnalyzeSecurity(growsRequired)
		return securityImpact
	}

	function weakenCheck(target) {
		var curSecurity = ns.getServerSecurityLevel(target)
		let amountPerWeaken = ns.weakenAnalyze(1)
		let securityImpact = preGrowSecurityCalc(target)
		let weakensRequired = (curSecurity - minSecurity + securityImpact)/amountPerWeaken
		if (weakensRequired < 350) {
			weakensRequired = 350
		}
		doWeaken(target,weakensRequired)
	}

	function growCheck (target) {	
			var moneyNow = ns.getServerMoneyAvailable(target)
			var moneyMax = ns.getServerMaxMoney(target)
			let moneyFactor = moneyNow / moneyMax
			let growsRequired = ns.growthAnalyze(target,(1/moneyFactor))
			if (growsRequired < 600) {
				growsRequired = 600
			}
			doGrow(target,growsRequired)
	}

	function hackCheck (target) {
		var moneyNow = ns.getServerMoneyAvailable(target)
		if (moneyNow > (moneyMax * 0.98)) {
			let percentPerHack = ns.hackAnalyze(target)
			let hacksRequired = (0.95 * (moneyNow/moneyMax)) / percentPerHack
			doHack(target,hacksRequired)
		} else {
			/** ns.tprint(`Would have hacked, but money was ${((moneyNow/moneyMax)*100).toFixed(0)}% of full.`) */
		}
	}

	function addEvent (eventList,eventType,eventTime) {
		eventList.push({ opType: eventType })
		eventList[eventList.length - 1].opTime = eventTime
	}

	/** How far apart the individual weaken/grow/hack commands should hit from each other inside each batch*/
	/** Original spacingTime = 500 */
	var spacingTime = 50
	/** How far to separate the batches of weaken/grow/hack so they don't overlap*/

	let target = ns.args[0]
	let me = "home"
	var curSecurity = ns.getServerSecurityLevel(target)
	var minSecurity = ns.getServerMinSecurityLevel(target)
	var moneyNow = ns.getServerMoneyAvailable(target)
    var moneyMax = ns.getServerMaxMoney(target)
	var timeNow = Date.now()
	let weakenTime = ns.getWeakenTime(target)
	let growTime = ns.getGrowTime(target)
	let hackTime = ns.getHackTime(target)

/** Populate event list with first events */
	var eventList = []
	var nextWeaken = timeNow
	addEvent(eventList,"Weaken",nextWeaken)

	var nextGrow = timeNow + (weakenTime - growTime + spacingTime)
	addEvent(eventList,"Grow",nextGrow)

	var nextHack = timeNow + (weakenTime - hackTime - spacingTime)
	addEvent(eventList,"Hack",nextHack)

/**	if (debug) ns.tprint(timeNow) */
/**	if (debug) ns.tprint(`\nWeaken ${nextWeaken},\nGrow ${nextGrow},\nHack ${nextHack}`) */

/** Prep the server to ideal conditions */
	if (moneyNow !== moneyMax) {
		let moneyFactor = moneyNow / moneyMax
		let growsRequired = ns.growthAnalyze(target,(1/moneyFactor))
		let availRAM = ns.getServerMaxRam(me) - ns.getServerUsedRam(me)
		let RAMCost = ns.getScriptRam('grow.js')
		if ((RAMCost * growsRequired) < availRAM) {
			var goodForStripingGrow = true
			doGrow(target,growsRequired)
		} else {
			/** If there isn't enough RAM to initially grow it to full, then this isn't a good candidate for striping right now */
			var goodForStripingGrow = false
		}
	} else {
		var goodForStripingGrow = true
	}

	if (curSecurity !== minSecurity) {
		let amountPerWeaken = ns.weakenAnalyze(1)
		let weakensRequired = (curSecurity - minSecurity)/amountPerWeaken
		let availRAM = ns.getServerMaxRam(me) - ns.getServerUsedRam(me)
		let RAMCost = ns.getScriptRam('weaken.js')
		if ((RAMCost * weakensRequired) < availRAM) {
			var goodForStripingWeaken = true
			doWeaken(target,weakensRequired)	
		} else {
			/** If there isn't enough RAM to initially weaken it, then this isn't a good candidate for striping right now */
			var goodForStripingWeaken = false
		}
	} else {
		var goodForStripingWeaken = true
	}

	/** i */
	let timer = 0
	/** How long to sleep per loop */
	/** Original timeSlice = 1000 */
	let timeSlice = 10
	/** Original batchTime = 5000 */
	let batchTime = 1000 / timeSlice

	let maxJobCount = (weakenTime / batchTime) - 3

	while (goodForStripingGrow && goodForStripingWeaken) {

		weakenTime = ns.getWeakenTime(target)
		growTime = ns.getGrowTime(target)
		hackTime = ns.getHackTime(target)
		timeNow = Date.now()
		/** if (debug) ns.tprint(`Weaken ${weakenTime} Grow ${growTime} Hack ${hackTime}`) */
/** Every five seconds, schedule a new batch until there are weakenTime/1000/padding weaken events scheduled*/
		if (timer >= batchTime) {
			/** Max number of events, originally 15 */
			if (eventList.length <= maxJobCount) {
				var nextWeaken = timeNow
				addEvent(eventList,"Weaken",nextWeaken)
				if (debug) ns.tprint(`${timeNow} : Scheduling Weaken for ${nextWeaken}`)
				var nextGrow = timeNow + (weakenTime - growTime - spacingTime)
				addEvent(eventList,"Grow",nextGrow)
				if (debug) ns.tprint(`${timeNow} : Scheduling Grow for ${nextGrow}`)
				var nextHack = timeNow + (weakenTime - hackTime - (2*spacingTime))
				if (debug) ns.tprint(`${timeNow} : Scheduling Hack for ${nextHack}`)
				addEvent(eventList,"Hack",nextHack)
				if (debug) ns.tprint("Added batch of 3 events.")
			} else {
				if (debug) ns.tprint(`>=${maxJobCount} events already scheduled, no new ones added.`)
			}
			timer = 0
		}
/** Foreach event on the eventList array, check time and execute if it's older than now */
		for (let i in eventList) {
			let thisEvent = eventList[i]
			if (thisEvent.opTime < timeNow) {
				switch (thisEvent.opType) {
					case "Hack":
						if (debug) ns.tprint(`${thisEvent.opType} : OPTIME ${thisEvent.opTime} detected as < TIMENOW ${timeNow}`)
						hackCheck(target)
					break
					case "Grow":
						if (debug) ns.tprint(`${thisEvent.opType} : OPTIME ${thisEvent.opTime} detected as < TIMENOW ${timeNow}`)
						growCheck(target)
					break
					case "Weaken":
						if (debug) ns.tprint(`${thisEvent.opType} : OPTIME ${thisEvent.opTime} detected as < TIMENOW ${timeNow}`)
						weakenCheck(target)
					break
				}
				eventList.splice(eventList.indexOf(thisEvent),1)
			} else {
				/** ns.tprint("Didn't find any pending events") */
			}
		}
		timer++
		await ns.sleep(timeSlice)
	}
}