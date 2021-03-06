/*
License: MIT
Dynamic CGI serving using dynamic path imports for 
     CGI supporting executable for Interpreted languages Embedded Distribution
Contribution: 2018 Ganesh K. Bhat <ganeshsurfs@gmail.com> 
*/

/* eslint no-console: 0 */
const https = require('https');
const fs = require('fs');
const util = require("util")
const utils = require("./utils")();
const setter = utils.setter, getter = utils.getter;

/**
 * 
 * handler
 * 
 * @returns
 */
function handler() {
    let processes = {}, processCommands = {};
    let osList = ["win32", "win64", "darwin", "unix", "linux", "fedora", "debian"];
    let processList = ["httpd", "tomcat", "mongoose", "putty", "nginx", "mysql", "pgsql", "top", "mysql", "mongodb", "pgsql"];

    let commandObject = {
        name: "", type: "executable", env: { os: { "name": { bin: "", runtime: "", exe: '' } } },
        cmds: {
            start: { usage: "start", args: [] },
            stop: { usage: "stop", args: [] },
            restart: { usage: "restart", args: [] }
        }
    };


    /**
     * 
     * setupHandler
     * 
     * 
     * @param {*} name 
     * 
     * @param {*} optionsObject 
     * 
     */
    function setupHandler(name, optionsObject) {
        if (!name || !optionsObject) {
            return false;
        }
        switch (name) {
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

    /**
     * 
    */
    function getOS(name) { }


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
     * @param {Object} processConf
     * 
     * @returns {Boolean}
     * 
     */
    function setProcess(processConf) {
        let setterVal = setter(processes, processConf);
        if (!!setterVal) {
            processes = setterVal;
            return processes;
        }
        return false;
    }


    /**
     * 
     * execCommand
     * 
     * 
     * @param {String} exe
     * 
     * @param {Array Object} args
     * 
     * @param {Object} cmdOptions
     * 
     * @param {Function} proc
     *
     */
    function execCommand(exe, args, cmdOptions, dataHandler) {
        let ex = require('child_process').exec;
        return ex([exe, ...args].join(" "), cmdOptions, function (error, stdout, stderr) {
            dataHandler(error, stdout, stderr);
        });
    }


    /**
     * 
     * registerEventHandlers
     * 
     * 
     * @param {Object} proc
     * 
     * @param {Object} eventHandlers
     * { event : { data: dataObject, handler: eventHandlerFunction } }
     * 
     */
    function registerEventHandlers(proc, eventHandlers) {
        let eKeys = eventHandlers.keys();
        let eKeysLen = eKeys.length;

        function cleanup(eventType, exitFunction, data, proc) {
            console.log('registerEventHandlers: Cleanup Fnc EventType and Process PID: ', eventType, proc.pid);
            exitFunction(data, proc);
        }

        for (let e = 0; e < eKeysLen; e++) {
            let { data, handler } = eventHandlers[eKeys[e]];
            proc.on(eKeys[e], cleanup.bind(null, eKeys[e], handler, data, proc));
        }
        return proc;
    }


    /**
     * 
     * startProcess
     * 
     *
     * @param {Object} processConf
     * Defines the process Object needed to start the process
     * Expected Structure: {  }
     * 
     * process/server/database = 
     *  
     * @param {String} file
     * 
     * @param {Function} dataHandler
     * 
     * @param {Function} cleanupFnc
     * 
     * @returns {Object}
     * { pid: Number, process: Object, conf: Object }
     * 
     */
    function startProcess(processConf, file, dataHandler, cleanupFnc) {
        // {name: {commands, instances: {pid: instance}}}
        let proc, bln;
        let { exe, args, options, other } = processConf, tmp = {};

        // Signal Numbers - http://people.cs.pitt.edu/~alanjawi/cs449/code/shell/UnixSignals.htm
        let evt = [`exit`, `SIGHUP`, `SIGQUIT`, `SIGKILL`, `SIGINT`, `SIGTERM`, `SIGUSR1`, `SIGUSR2`, `uncaughtException`];
        evtLen = evt.length;

        // args.conf == !!other.osPaths.conf ?
        //     (other.osPaths.conf + args.conf) : (!!args.conf) ? args.conf : "";
        exe = other.osPaths.exe + exe;
        if (!!other.serverType && !!other.command && !!file) {
            error("startProcess: Server Definition or Process Definition allowed, not both");
        }

        if (!!args && !Array.isArray(args)) {
            error("startProcess: Arguments passed is incorrect");
        } else if (!args) {
            args = [];
        }

        if (!!other.command && !file) { args.push(other[other.command]); }
        if (!!file && !other.serverType) { args.push(file); }
        proc = execCommand(exe, args, options, dataHandler);
        process.stdin.resume();

        function cleanupSrv(eventType, exitFunction, proc) {
            console.log('startProcess: Cleanup Fnc EventType and Process PID: ', eventType, proc.pid);
            exitFunction(options, proc);
        }

        tmp[proc.pid] = { process: proc, conf: processConf };
        bln = setProcess(tmp);
        if (!!bln) { /* Do something here - callback */ }

        for (let i = 0; i < evtLen; i++) {
            proc.on(evt[i], cleanupSrv.bind(null, evt[i], cleanupFnc, proc));
        }
        return { pid: proc.pid, process: proc, conf: processConf };
    }


    /**
     * 
     * execProcess
     * 
     * 
     * @param {Object} conf
     * 
     * @param {Function} dataHandler
     *  
     * @returns {Boolean, Object}
     * false / Process Instance
     * 
     */
    function execProcess(conf, dataHandler) {
        if (!!conf.command && typeof conf.command === "string") {
            try {
                return execCommand(conf.command, [], conf.options, dataHandler);
            } catch (e) {
                console.log("execProcess: Error occured: ", e.toString());
                return false;
            }
        }
        let cmdObj = getter(processCommands, conf.name);
        if (!!cmdObj) {
            // TODO: TEMP: Following two statements to be tested
            let exe = cmdObj.env.os[conf.os]['bin'] + "/" + cmdObj.env.os[conf.os]['exe'];
            let e = [cmdObj.cmds[conf.cmd]['usage'], ...cmdObj.cmds[conf.cmd]["args"]];
            return execCommand(exe, e, conf.options, dataHandler);
        }
        return false;
    }


    /**
     * 
     * execCommandAsync
     * 
     * 
     * @param {String} exe
     * 
     * @param {Array Object} args
     * 
     * @param {Object} cmdOptions
     * 
     * @param {Function} proc
     *
     */
    function execCommandAsync(exe, args, cmdOptions, dataHandler) {
        let ex = require('child_process').exec;
        return new Promise(function (resolve, reject) {
            ex([exe, ...args].join(" "), {}, function (err, stdout, stderr) {
                if (!!err) {
                    reject({ stdout: stdout, stderr: stderr });
                }
                resolve({ stdout: stdout, stderr: stderr });
            }.bind(args, resolve, reject));
        });
        // let ex = util.promisify(require('child_process').exec);
        // return ex([exe, ...args].join(" "), cmdOptions);
    }


    /**
     * 
     * TODO
     * startProcessAsync
     * All arguments and structure are the same but are async promises
     *
     * @param {Object} processConf
     * Defines the process Object needed to start the process
     * Expected Structure: {  }
     * 
     * process/server/database = 
     * 
     * @param {String} file
     * 
     * @param {Function} dataHandler
     * 
     * @param {Function} cleanupFnc
     * 
     * @returns {Object}
     * 
     */
    function startProcessAsync(processConf, file, dataHandler, cleanupHandler) {
        return false;
    }


    /**
     * 
     * TODO
     * execProcessAsync
     * 
     * 
     * @param {Object} conf
     * 
     * @param {Function} dataHandler
     *  
     * @returns {Boolean, Object}
     * false / Process Instance
     * 
     */
    function execProcessAsync(conf, dataHandler) {
        return new Promise(function (resolve, reject) {
            
        });
    }


    /**
     * 
     * killProcess
     * 
     * 
     * @param {Number} pid
     * 
     * @returns {Boolean}
     * 
     */
    function killProcess(pid, signal) {
        let proc = getProcess(pid)['process'], ob = {}, setterVal = null;
        proc.kill(signal);
        proc.stdin.end();
        ob[pid] = null;
        setterVal = setter(processes, ob);
        if (!setterVal) {
            console.error("killProcess: Error during setting object to null");
        }
        console.log('killProcess: Killed/Stopped process ' + pid, "Object is ", processes[pid]);
        return true;
    }


    /**
     * 
     * setServers
     * 
     * 
     * @param  {Object} obj
     * Expected Structure: { commandObject }
     * 
     * @returns {Boolean}
     * 
     */
    function setServers(obj) { }

    /**
     * 
     * getServers
     * 
     * 
     * @param  {String} name
     * 
     * @returns {Boolean, Object}
     * false / ServerInstance { process, processCommandsKey }
     * 
     */
    function getServers(name) { }

    /**
     * 
     * startServer
     * 
     * 
     * @param {String} name
     *       
     * @returns {Boolean}
     * 
     */
    function startServer(name) { }

    /**
     * 
     * stopServer
     * 
     * 
     * @param  {String} name
     * 
     * @returns {Boolean} 
     * 
     */
    function stopServer(name) {
        // if (!!stopProcess(server.pid, 'EXIT')) { return true; }
    }

    /**
     * 
     * restartServer
     * 
     * 
     * @param  {} server
     * 
     * @returns {Boolean} 
     * 
     */
    function restartServer(server) {

    }

    return {
        setup: setupHandler,
        os: {
            set: setOS,
            get: getOS
        },
        process: {
            set: setProcess,
            get: getProcess,
            registerHandlers: registerEventHandlers,
            exec: execCommand,
            start: startProcess,
            execProcess: execProcess,
            execAsync: execCommandAsync,
            startAsync: startProcessAsync,
            execProcessAsync: execProcessAsync,
            kill: killProcess
        },
        server: {
            set: setServers,
            get: getServers,
            start: startServer,
            stop: stopServer,
            restart: restartServer
        }
    }
}

module.exports = handler;
