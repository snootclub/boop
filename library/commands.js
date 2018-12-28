let path = require("path")
let fs = require("fs-extra")
let execa = require("execa")
let boopsDirectory = "boops"

let getBoopNames = () =>
	fs.readdir(boopsDirectory)

let getBoopPathFromName = name =>
	path.resolve(boopsDirectory, name)

let npmRun = (commandString, boopName) => {
	let command = commandString.split(/\s+/)
	let args = [
		"run-script",
		"--scripts-prepend-node-path=true"
	]

	if (boopName !== ".") {
		args.push("--prefix", getBoopPathFromName(boopName))
	}

	return execa("npm", [
		...args,
		...command
	], {
		extendEnv: true,
		env: {
			BOOP_OUTPUT_DIRECTORY: "website",
			BOOP_PUBLIC_URL: `/${boopName}`,
			// deprecated, but for old canvas sketches
			SNOOT_OUTPUT_DIRECTORY: "website",
			SNOOT_PUBLIC_URL: `/${boopName}`
		}
	})
}

let boopInParallel = async fn => {
	let names = await getBoopNames()
	let promises = names.map(name => fn(name))
	return Promise.all(promises)
}

let createTask = taskName => () =>
	boopInParallel(async name =>
		npmRun(
			taskName,
			name
		)
	)

exports.build = createTask("build")
exports.watch = createTask("watch")
exports.install = () =>
	boopInParallel(async name =>
		execa("npm", [
			"install",
			"--prefix",
			getBoopPathFromName(name)
		]))
