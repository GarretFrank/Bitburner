/** @param {NS} ns **/
export async function main(ns) {

	/** Set everyone to Train Combat */

	function everybodyCombat (gangNames) {
		for (let i in gangNames) {
			ns.gang.setMemberTask(gangNames[i],"Train Combat")
		}
	}

	/** Use Vigilante Justice for an unnecessarily long time */

	async function vigilanteToOne (gangNames) {
		while (ns.gang.getGangInformation().wantedLevel > 1) {
			for (let i in gangNames) {
				ns.gang.setMemberTask(gangNames[i],"Vigilante Justice")
			}
			await ns.sleep(1000)
		}
	}

	/** Set to Terror, Mug, or Human Trafficking based on parameters, starting from the oldest gang member,
	 * with any remaining members set to Vigilante Justice */

	function terrorMugHuman (terrorNumber,mugNumber,humanNumber,memberCount,gangNames) {
		let i = 0
		if (terrorNumber > 0) {
			while (i < terrorNumber) {
				ns.gang.setMemberTask(gangNames[i],"Terrorism")
				i++
			}
		}
		if ((mugNumber > 0) && (i < memberCount)) {
			while ((i < mugNumber) && (i < memberCount))
			{
				ns.gang.setMemberTask(gangNames[i],"Mug People")
				i++
			}
		}
		if ((humanNumber > 0) && (i < memberCount)) {
			while ((i < humanNumber) && (i < memberCount))
			{
				ns.gang.setMemberTask(gangNames[i],"Human Trafficking")
				i++
			}
		}
		if (i < memberCount) {
			while (i < memberCount) {
				ns.gang.setMemberTask(gangNames[i],"Vigilante Justice")
				i++
			}
		}
	}

	/** Function that calls other functions to Get Things Done. */

	async function whatToDo (firstGuySTR,gangNames,newGuyNames,terrorCount,mugCount,humanCount,memberCount,strThreshold) {
		if (firstGuySTR >= strThreshold) {
			jobLoop : {
				while (ns.gang.getMemberNames().length = memberCount) {
					terrorMugHuman(terrorCount,mugCount,humanCount,memberCount,gangNames)
					if (checkRecruiting(gangNames,newGuyNames) === "Got one") {
						break jobLoop
					}
					await ns.sleep(1000)
				}
			}
			await vigilanteToOne(gangNames)
			everybodyCombat(gangNames)
		}
	}

	/** Case by case instructions for what to do with the gang at a given member count. Based off of the STR stat on
	 * the first gang member. Not suitable for hacking gangs. :-) */

	async function checkMilestoneEvents (gangNames,firstGuySTR) {
		memberCount = gangNames.length
		switch (memberCount) {
			case 0:
			case 1:
			case 2: {
				/** Steady on, babygang*/
				checkRecruiting(gangNames,newGuyNames)
				break
			}
			case 3: {
				await whatToDo(firstGuySTR,gangNames,newGuyNames,0,2,0,memberCount,40)
			}
			break
			case 4: {
				await whatToDo(firstGuySTR,gangNames,newGuyNames,0,3,0,memberCount,60)
			}
			break
			case 5: {
				await whatToDo(firstGuySTR,gangNames,newGuyNames,0,4,0,memberCount,130)
			}
			break
			case 6: {
				await whatToDo(firstGuySTR,gangNames,newGuyNames,1,0,0,memberCount,250)
			}
			break
			case 7: {
				/** Start flickering the job assignment from whatever it's set to, over to
				 * Territory Warfare, and back again as soon as the tick has happened.*/
				ns.run("gang_turf.js")
				await whatToDo(firstGuySTR,gangNames,newGuyNames,1,0,0,memberCount,350)
			}
			break
			case 8: {
				await whatToDo(firstGuySTR,gangNames,newGuyNames,1,0,0,memberCount,500)
			}
			break
			case 9: {
				await whatToDo(firstGuySTR,gangNames,newGuyNames,2,0,0,memberCount,600)
			}
			break
			case 10: {
				await whatToDo(firstGuySTR,gangNames,newGuyNames,4,0,0,memberCount,1200)
			}
			break
			case 11: {
				await whatToDo(firstGuySTR,gangNames,newGuyNames,11,0,0,memberCount,1800)
			}
			break
		}
	}

	/** Compare the product of all combat stat ascension multipliers to an arbitrarily chosen number. If the
	 * product is higher, ascend them. 5.5 means each stat multiplier is about 153% of what it was before ascension.
	 * This is just something I chose by eyeballing it, and does not have any math behind it whatsoever.*/
	function checkAscension(gangNames) {
		let ascensionMultiProduct = 5.5
		for (let i in gangNames) {
			let ascResults = ns.gang.getAscensionResult(gangNames[i]);
			try {
				if (ascResults.agi * ascResults.def * ascResults.str * ascResults.dex > ascensionMultiProduct) {
					ns.gang.ascendMember(gangNames[i]);
					ns.tprint(`Ascended ${gangNames[i]}`);
				}
			} catch {
				/** Probably not eligible for ascension */
			}
		}
	}

	/** Try to recruit new members */
	function checkRecruiting(gangNames,newGuyNames) {
		for (let i in newGuyNames) {
			if (!(gangNames.includes(newGuyNames[i]))) {
				if (ns.gang.recruitMember(newGuyNames[i])) {
					ns.gang.setMemberTask(newGuyNames[i],"Train Combat");
					ns.tprint(`Recruited ${newGuyNames[i]}`);
					return "Got one"
				}
			}
		}	
	}

	var newGuyNames = ["Paul","Pedro","Pippin","Party","Platypus","Plato","Persimmon","Percival","Pinchy","Paunchy","Pin","Prinny"]
	var memberCount = ns.gang.getMemberNames().length

	/** Main program loop. Check ascensions, check recruiting, check to see whether it's time to grow the gang. */
	while (true) {
		var gangNames = ns.gang.getMemberNames()
		var firstGuySTR = ns.gang.getMemberInformation(gangNames[0]).str

		checkAscension(gangNames)

		if (memberCount < 12) {
			checkRecruiting(gangNames,newGuyNames)
			await checkMilestoneEvents(gangNames,firstGuySTR)
		}

		await ns.sleep(1000)
	}
}