/*
License: MIT
Dynamic CGI serving using dynamic path imports for 
     CGI supporting executable for Interpreted languages Embedded Distribution
Contribution: 2018 Ganesh K. Bhat <ganeshsurfs@gmail.com> 
*/

/* eslint no-console: 0 */
const https = require('https');
const fs = require('fs');
const httpProxy = require('http-proxy');
const utils = require("./utils")();

/**
 * 
 * handler
 * 
 * @returns
 */
function handler() {
    let configurations = {}, processes = {}, processCommands = {}, instanceProxyServers = {};

    let proxyPortRanges = [[8000, 9500], [10000, 15000]];
    let validProxyHandlers = ["error", "proxyReq", "proxyRes", "open", "data", "end", "close", "upgrade"];
    let osList = ["win32", "win64", "darwin", "unix", "linux", "fedora", "debian"];
    let processList = ["httpd", "tomcat", "mongoose", "putty", "nginx", "mysql", "pgsql", "top", "mysql", "mongodb", "pgsql"];

    let configurationObject = {
        "options": {
            "target": {
                "protocol": "http:",
                "host": "127.0.0.1",
                "port": 9001,
                "pfx": null,
                "passphrase": ""
            },
            "ws": false,
            "secure": false,
            "xfwd": true,
            "toProxy": true,
            "prependPath": true,
            "ignorePath": false,
            "changeOrigin": false,
            "preserveHeaderKeyCase": true,
            "auth": ":",
            "hostRewrite": true,
            "protocolRewrite": null,
            "cookieDomainRewrite": false,
            "cookiePathRewrite": false,
            "headers": {},
            "proxyTimeout": 10000,
            "timeout": 10000,
            "selfHandleResponse": false,
            "buffer": null,
            "ssl": {
                "key": null,
                "cert": null
            }
        },
        "listenPort": 8001,
        "stream": false,
        "modify": false,
        "runtime": false
    };

    let commandObject = {
        name: "", type: "executable", env: { os: { "name": { bin: "", runtime: "", exe: '' } } },
        cmds: {
            start: { usage: "start", args: {} },
            stop: { usage: "stop", args: {} },
            restart: { usage: "restart", args: {} }
        }
    };

    function setupHandler(name, optionsObject) {
        if (!name || !optionsObject) {
            return false;
        }
        switch (name) {
            case "proxyPortRanges":
                if (Array.isArray(optionsObject)) {
                    for (let i = 0; i < optionsObject.length; i++) {
                        if (optionsObject[i] in proxyPortRanges) {
                            proxyPortRanges.push(optionsObject[i]);
                        }
                    }
                    return true;
                }
                return false;
            case "osList":
                if (Array.isArray(optionsObject)) {
                    for (let i = 0; i < optionsObject.length; i++) {
                        if (optionsObject[i] in osList) {
                            osList.push(optionsObject[i]);
                        }
                    }
                    return true;
                }
                return false;
            case "processList":
                if (Array.isArray(optionsObject)) {
                    for (let i = 0; i < optionsObject.length; i++) {
                        if (optionsObject[i] in processList) {
                            processList.push(optionsObject[i]);
                        }
                    }
                    return true;
                }
                return false;
            case "processCommands":
                if (typeof optionsObject === "object") {
                    let valid = utils.isEqual(commandObject, optionsObject);
                    if (!valid || !optionsObject.name) {
                        return false;
                    }
                    processCommands[optionsObject.name] = optionsObject;
                    return true;
                } else if (Array.isArray(optionsObject)) {
                    let oKeys = Object.keys(optionsObject);
                    for (let i = 0; i < optionsObject.length; i++) {
                        let valid = utils.isEqual(commandObject, optionsObject[i]);
                        if (!valid || !optionsObject[i].name) {
                            return false;
                        }
                        processCommands[optionsObject[oKeys[i]].name] = optionsObject[oKeys[i]];
                        return true;
                    }
                }
                return false;
            default:
                return false;
        }
    }

    function setOS(obj) { }

    function getOS(name) { }


    /**
     * 
     * setter
     *
     * @param {Object} setterObject
     * 
     * @param {Object} values
     * 
     * @returns
     * 
     */
    function setter(setterObject, values) {
        if (!values && typeof values !== "object") { return false; }
        keys = Object.keys(values);
        if (!keys.length) { return false; }
        for (let i = 0; i < keys.length; i++) {
            setterObject[keys[i]] = values[keys[i]];
        }
        return true;
    }

    /**
     * 
     * getter
     *
     * @param {Object} getterObject
     * 
     * @param {String, Array} args
     * 
     * @returns {Boolean}
     * 
     */
    function getter(getterObject, args) {
        if (!args) { return false; }
        if (typeof args === "string" || typeof args === "number") {
            return (!!getterObject[args]) ? getterObject[args] : false;
        } else if (Array.isArray(args)) {
            let tmp = {};
            for (let i = 0; i < args.length; i++) {
                if (!!getterObject[args[i]]) {
                    tmp[args[i]] = getterObject[args[i]];
                }
            }
            return (!Object.keys(tmp).length) ? false : tmp;
        }
        return false;
    }

    /**
     * REDO THIS
     * 
     * getConfig
     *
     * @param {String, Array} args
     *      args is either single configuration string key or Array of keys to be fetched
     * 
     * @returns {Object} configuration
     *      configurations: configurations object
     * 
     */
    function getConfig(args) {
        return getter(configurations, args);
    }

    /**
     * REDO THIS
     * 
     * setConfig
     *
     * @param {Object} options
     *      options is the an object of configuration with names of configuration as keys
     * 
     * @returns {Boolean} 
     * 
     */
    function setConfig(options) {
        return setter(configurations, options);
    }

    /**
     * 
     * getProcess
     * Returns the processes requested
     *
     * @param {String, Array} processIds
     *      processIds is single or Array of ids
     * 
     * @returns {Boolean, Object} processes
     *      processes: processes list object
     * 
     */
    function getProcess(processIds) {
        return getter(processes, processIds);
    }

    /**
     * 
     * setProcess
     * Sets the process of the connection key procId provided
     *
     * @param {Object} processObject
     * 
     * @returns {Boolean}
     * 
     */
    function setProcess(processObject) {
        return setter(processes, processObject);
    }

    /**
     * 
     * startProcess
     *
     * @param {Object} processObject
     * Defines the process Object needed to start the process
     * Expected Structure: {  }
     * 
     * process/server/database = 
     * 
     * @param {String} file
     * 
     * @returns {Object}
     * 
     */
    function startProcess(processObject, file) {
        // {name: {commands, instances: {pid: instance}}}
        // REDO THIS
        let processSpawn = require('child_process').spawn;
        let { exe, args, options, other } = processObject;
        args.conf = !!other.osPaths.conf ?
            (other.osPaths.conf + args.conf) : args.conf;
        exe = other.osPaths.exe + exe;
        if (!!other.serverType && !!other.command && !!file) {
            error("Server definition or process definition allowed, not both");
        }
        let e = args.entries().flat(Infinity);
        if (!!other.command && !file) { e.push(other[other.command]); }
        if (!!file && !other.serverType) { e.push(file); }
        let proc = processSpawn(exe, [...e], options);
        process.stdin.resume();
        proc.on('data', function (data) {
            console.log(data);
        });
        function cleanUpServer(options, exitCode) {
            console.log("Event Type", eventType);
            if (options.cleanup) console.log('clean');
            if (exitCode || exitCode === 0) console.log(exitCode);
            if (options.exit) process.exit();
        }
        [`exit`, `SIGINT`, `SIGUSR1`, `SIGUSR2`, `uncaughtException`, `SIGTERM`].forEach(function (eventType) {
            proc.on(eventType, cleanUpServer.bind(null, eventType));
        }.bind(proc, cleanUpServer));
        processes[proc.pid] = proc;
        return { pid: proc.pid, srv: processObject };
    }

    /**
     * 
     * stopProcess
     *
     * @param {Number, Object} proc
     * 
     * @returns {Boolean}
     * 
     */
    function stopProcess(proc, signal) {
        process.kill(proc, signal);
        console.log('Killed/Stopped process ' + processes[proc].pid);
        processes[proc] = null;
        process.stdin.end();
        return true;
    }

    /**
     * 
     * startProxy
     *
     * @param {Object} config
     * 
     * @returns {Boolean}
     * 
     */
    function startProxy(config) {
        let proxy;
        try {
            if (!!config.stream || !!config.modify || !!config.runtime) {
                proxy = new httpProxy();
            } else {
                proxy = httpProxy.createProxyServer(config.options);
            }
            return proxy;
        } catch (e) {
            return false;
        }
    }

    /**
     * 
     * stopProxy
     *
     * @param {String, Object} proxy
     * 
     * @returns {Boolean}
     * 
     */
    function stopProxy(proxy) {
        if (!proxy) { return false; }
        if (!!proxy && (typeof proxy === "string" || typeof args === "number")) {
            proxy = instanceProxyServers[proxy].proxy;
        }
        try {
            proxy.close();
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     *
     * serveProxy
     *
     * @param {String} name
     */
    function serveProxy(name) {
        let inst = getter(instanceProxyServers, name);

        let proxy = startProxy(inst.config);
        inst.proxy = proxy;
        inst.proxy.listen(inst.config.listenPort);

        let hKeys = Object.keys(inst.handlers);
        let hKeysLen = hKeys.length;
        if (!hKeysLen) { return false; }

        for (let i = 0; i < hKeysLen; i++) {
            inst.proxy.on(hKeys[i], inst.handlers[hKeys[i]]);
        }

        let proxyObject = {};
        proxyObject[name] = inst;
        let setInst = setter(instanceProxyServers, proxyObject);
        if (!setInst) { return false; }
        return getter(instanceProxyServers, name);
    }

    /**
     *
     * setupProxy
     * config and handlers validated and saved to servers object
     *
     * @param {String} name
     * 
     * @param {Object} config
     * 
     * @param {Object} handlerFunctions
     * 
     * @returns {Boolean} 
     * 
     */
    function setupProxy(name, config, handlerFunctions) {
        // let validConfig = utils.isEqual(configurationObject, config, false, false);
        let validPort = [];
        for (let i = 0; i < proxyPortRanges.length; i++) {
            if ((config.options.target.port >= proxyPortRanges[i][0] && config.options.target.port <= proxyPortRanges[i][1])) {
                break;
            }
        }
        if (validPort.length > 0) { return false; }
        let hKeys = Object.keys(handlerFunctions);
        for (let i = 0; i < hKeys.length; i++) {
            if (!(validProxyHandlers.includes(hKeys[i]))) {
                return false;
            }
        }

        let proxyObject = {};
        proxyObject[name] = { "proxy": null, "config": config, "handlers": handlerFunctions };
        let proxyset = setter(instanceProxyServers, proxyObject);
        if (!proxyset) { return false; }
        return true;
    }

    /**
     * 
     * getProxy
     * 
     * @param  {String, Array} name - name / [name]
     * 
     * @returns {Boolean, Object} false / ProxyInstance { proxy, config, handlers }
     * 
     */
    function getProxy(name) {
        return getter(instanceProxyServers, name);
    }

    /**
     * 
     * setServers
     * 
     * @param  {} obj
     * 
     * @returns {Boolean}
     * 
     */
    function setServers(obj) { }

    /**
     * 
     * getServers
     * 
     * @param  {} name
     * 
     * @returns {Boolean, Object} false / ServerInstance { process, processCommandsKey }
     * 
     */
    function getServers(name) { }

    /**
     * 
     * startServer
     * 
     * @param {*} server
     * Expected Structure: { commandObject }
     *       
     * @returns {Boolean}
     * 
     */
    function startServer(server) {

    }

    /**
     * 
     * stopServer
     * 
     * @param  {} server
     * 
     * @returns {Boolean} 
     * 
     */
    function stopServer(server) {
        // if (!!stopProcess(server.pid, 'EXIT')) { return true; }
    }

    return {
        setup: setupHandler,
        setter: {
            config: setConfig,
            os: setOS,
            servers: setServers,
            process: setProcess
        },
        getter: {
            config: getConfig,
            os: getOS,
            servers: getServers,
            process: getProcess,
            proxy: getProxy
        },
        process: {
            start: startProcess,
            stop: stopProcess,
            getProcess: getProcess,
            set: setProcess,
            cmds: getProcess
        },
        proxy: {
            start: startProxy,
            stop: stopProxy,
            serve: serveProxy,
            setup: setupProxy,
            get: getProxy
        },
        server: {
            start: startServer,
            stop: stopServer,
            get: getServers,
            set: setServers,
            cmds: getServers
        }
    }
}

module.exports = handler;
