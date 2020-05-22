const Koa = require('koa')
const Router = require('@koa/router')
const ejs = require('koa-ejs')
const fs = require('fs')
const path = require('path')
const redis = require('redis')
const child_process = require('child_process')
const request = require('request')
const ping = require('ping')
const argv = require('minimist')(process.argv.slice(2))
const port = argv.port || argv.p || 8888

async function exec(cmd){
	return new Promise((res,rej)=>{
		child_process.exec(cmd, (e,o,eo)=>{
			if (e) {
				rej(e)
			} else if (eo) {
				rej(eo)
			} else {
				res(o)
			}
		})
	})
}

const app = new Koa()
const router = new Router()

ejs(app, {
	root: path.join(__dirname, 'views'),
	layout: 'template',
	viewExt: 'html',
	cache: false,
	debug: false
})

app
.use(router.routes())
.use(router.allowedMethods())

app.listen(port)
console.log('listening on port',port)

async function get_port(name){
	if (name.length > 9) {//lsof进程名字只显示9位
		name = name.substr(0,9)
	}
	const o = await exec(`lsof -i -P -n|grep LISTEN|grep ${name}`)
	const reg = new RegExp(`${name}.*:([0-9]+)`)
	const list = o.split('\n').map(a=>{
		const m = a.match(reg)
		return m && m[1]
	}).filter(a=>a).reduce((acc,val)=>{ //去重
		if(!acc.includes(val)){
			acc.push(val)
		}
		return acc
	},[])
	return list
}

function error(msg,data){
	const e = {msg}
	if (data) {
		e.data = data
	}
	const es = JSON.stringify(e)
	throw new Error(es)
}

async function has(cmd){
	return !!await exec(`which ${cmd}`)
}

async function system_info(){
	const os = process.platform
	const node_version = process.version

	//redis是否正在运行？
	const redis_ports = await get_port('redis-server')

	if (redis_ports.length) {//正在运行
		for(const r of redis_ports){//尝试连接
			//连接上就断开
		}
	} else {
		//是否安装？
		const installed = await exec('which redis-server')
		if (installed) {//未开启
			//搜索配置文件
		} else {//未安装
		}
	}

	const gfwed = await is_gfwed()
	const has_brew = await has('brew')

	return {os,node_version,redis_ports,gfwed,has_brew}
}

async function is_gfwed(){
	const res = await ping.promise.probe('google.com',{timeout:2})
	return !res.alive
}

async function install_brew(){
}

async function fuck_gfw_brew(){
}

async function fuck_gfw_npm(){
}

router.get('/',async ctx=>{
	const info = await system_info()
	const p = {info:JSON.stringify(info,0,2)}
	await ctx.render('index',p)
})
