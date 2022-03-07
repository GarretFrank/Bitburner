/** @param {NS} ns **/

/** Commit the specified crime until karma is low enough to create a gang, then create the gang, then start the
 * gang management script. */

export async function main(ns) {
	let crimeCount = 0;
	let crimeTime = ns.getCrimeStats(ns.args[0]).time + 250;
	while (true) {
		ns.commitCrime(ns.args[0]);
		crimeCount++;
		ns.toast(`${crimeCount} tries at ${ns.args[0]} complete. ${ns.heart.break().toFixed(0)} karma.`,"info",1500);
		await ns.sleep(crimeTime);
		if (ns.gang.createGang("Slum Snakes")) {
			ns.tprint("Gang created")
			break;
		}
	}
	await ns.sleep(1000)
	ns.run("gang.js")
}