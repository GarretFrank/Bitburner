/** @param {NS} ns **/
export async function main(ns) {
	let scannedAlready = []
	let forbidList = ["darkweb"]
	forbidList = forbidList.concat(ns.getPurchasedServers())

	async function recurseScan (scanTarget) {
		if ((!scannedAlready.includes(scanTarget)) && (!forbidList.includes(scanTarget))) {
			scannedAlready.push(scanTarget)
		} else {
			return
		}
		if (ns.fileExists("BruteSSH.exe","home")) {
			ns.brutessh(scanTarget)
		}
		if (ns.fileExists("FTPCrack.exe","home")) {
			ns.ftpcrack(scanTarget)
		}
		if (ns.fileExists("RelaySMTP.exe","home")) {
			ns.relaysmtp(scanTarget)
		}
		if (ns.fileExists("HTTPWorm.exe","home")) {
			ns.httpworm(scanTarget)
		}
		if (ns.fileExists("SQLInject.exe","home")) {
			ns.sqlinject(scanTarget)
		}
		try {
			ns.nuke(scanTarget)
		} catch {
			/** Probably didn't have enough ports open */
		}
		let hasContract = ""
		if (ns.ls(scanTarget,"cct").length > 0) {
			hasContract = "Contains a contract!"
		}

		ns.tprint(`${scanTarget} : ${ns.hasRootAccess(scanTarget)} : ${(ns.getServer(scanTarget).moneyMax/1000000000).toFixed(2)}b : ${ns.getServer(scanTarget).requiredHackingSkill} : ${hasContract}`)
		let newTargets = ns.scan(scanTarget)
		
		if (newTargets.length > 0) {
			for (let subTarget of newTargets) {
				recurseScan(subTarget)
			}
		}
		return scanTarget
	}
	recurseScan("home")
}