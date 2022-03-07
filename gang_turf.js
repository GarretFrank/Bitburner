/** @param {NS} ns **/
export async function main(ns) {

	/** Territory Warfare script for a growing gang. Switches everyone to Territory Warfare before the tick, then back
	 * to whatever they were doing. Same effectiveness for power as leaving everyone set to Territory Warfare all the time,
	 * while also almost as productive as leaving them set to whatever else they were doing all the time. */

	var gangNames = ns.gang.getMemberNames()
	var ourPower = ns.gang.getGangInformation().power
	var otherGangs = ns.gang.getOtherGangInformation()
	var origTasks = new Object
	
	/** Check to see what everyone is doing, then make a record of it. */
	for (let i in gangNames) {
		let memberName = gangNames[i]
		let originalTask = ns.gang.getMemberInformation(memberName).task
		origTasks[memberName] = originalTask
	}
	
	/** Black Hand almost always has territory, so watch their territory until it changes. When it changes, we just saw a tick
	 * and have about twenty seconds before the next one. Set everyone back to their original task, wait 18.5 seconds, then
	 * set them to Territory Warfare. Repeat.
	 */
	while (ourPower < 1500) {
		otherGangs = ns.gang.getOtherGangInformation()
		let startTerritory = otherGangs["The Black Hand"].territory
		let nowTerritory = startTerritory
		while (nowTerritory === startTerritory) {
			await ns.sleep(100)
			var nowGangInfo = ns.gang.getOtherGangInformation()
			nowTerritory = nowGangInfo["The Black Hand"].territory
		}
		
		/** Just saw a territory tick, so set everyone back to what they were doing before the tick */

		for (let i in gangNames) {
			let memberName = gangNames[i]
			ns.gang.setMemberTask(memberName,origTasks[memberName])
		}
		await ns.sleep(18500)

		/** It's been about twenty seconds and the tick is close, so check everyone's tasks again in case they've
		 * been changed, then set everyone to Territory Warfare */

		for (let i in gangNames) {
			let memberName = gangNames[i]
			let originalTask = ns.gang.getMemberInformation(memberName).task
			origTasks[memberName] = originalTask
			ns.gang.setMemberTask(memberName,"Territory Warfare")
		}
		ourPower = ns.gang.getGangInformation().power
	}
	
	/** Power's high enough for now, set everyone back to their original tasks before moving on. */
	for (let i in gangNames) {
		let memberName = gangNames[i]
		ns.gang.setMemberTask(memberName,origTasks[memberName])
	}

	/** Turn on territory warfare, wait to have all of the territory, then turn it back off. */
	ns.gang.setTerritoryWarfare(true)

	while (ns.gang.getGangInformation().territory < 1) {
		await ns.sleep(60000)
	}

	ns.gang.setTerritoryWarfare(false)
}