const fs = require("fs")
const path = require("path")

module.exports = class liveJSON {
	constructor(file){
		try {
			fs.accessSync(file, fs.constants.W_OK | fs.constants.R_OK)
		} catch (error) {
			throw Error(`Unable to open ${file},check that the user running has write and read access`)
		}
		let json
		try {
			json = JSON.parse(fs.readFileSync(file))
		} catch (error) {
			throw Error(`Unable to parse JSON file (${file})`)
		}
		let handler = {
			// eslint-disable-next-line no-unused-vars
			get: (obj,prop) => {
				if(prop === "__stack" || typeof(prop) == "symbol"){
					return obj[prop]
				}
				let json
				let stack = obj.__stack ? obj.__stack : []
				try {
					json = JSON.parse(fs.readFileSync(file))
				} catch (error) {
					throw Error(`Unable to parse JSON file (${file})`)
				}
				let current = json
				for (let i = 0; i < stack.length; i++) {
					current = current[stack[i]]
					
				}
				let retval = current[prop] ? current[prop] : null
				if(typeof(retval) === "object" && prop !== "__proto__" && retval !== null){
					retval = new Proxy(current[prop],handler)
					stack.push(prop)
					retval["__stack"] = stack
				}
				return retval
			},
			// eslint-disable-next-line no-unused-vars
			set: (obj,prop,value) => {
				if(prop === "__stack"){
					obj[prop] = value
					return true
				}
				let json
				let stack = obj.__stack ? obj.__stack : []
				try {
					json = JSON.parse(fs.readFileSync(file))
				} catch (error) {
					throw Error(`Unable to parse JSON file (${error})`)
				}

				let current = json
				for (let i = 0; i < stack.length - 1; i++) {
					current = current[stack[i]]
					
				}

				if(current === json){
					json[prop] = value
				}else{
					obj[prop] = value
					current[stack[stack.length-2]] = obj
				}
				try {
					fs.writeFileSync(file,JSON.stringify(json))
				} catch (error) {
					throw Error(`Unable to write JSON file (${error})`)
				}

			},
			// eslint-disable-next-line no-undef
			has: (obj,prop) => {
				let json
				let stack = obj.__stack ? obj.__stack : []

				try {
					json = JSON.parse(fs.readFileSync(file))
				} catch (error) {
					throw Error(`Unable to parse JSON file (${file})`)
				}

				let current = json
				for (let i = 0; i < stack.length - 1; i++) {
					current = current[stack[i]]
				}
				return current.has(prop)
			}
		}
		return new Proxy(json,handler)
	}
}