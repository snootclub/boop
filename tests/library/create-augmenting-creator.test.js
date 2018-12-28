let tap = require("tap")
let create = require("../../library/augment.js")
let http = require("http")

tap.test("it creates a simple merge by default", test => {
	let merge = create()
	test.equal(typeof merge, "function")
	let source = {a: 1, b: 2, c: 4}
	let augmentation = {c: 3, d: 4}
	let result = merge(source, augmentation)
	test.strictSame(result, {
		a: 1,
		b: 2,
		c: 3,
		d: 4
	})
	test.end()
})
