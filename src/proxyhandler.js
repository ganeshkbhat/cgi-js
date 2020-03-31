// License: MIT
// Dynamic CGI serving using dynamic path imports for 
//      CGI supporting executable for Interpreted languages Embedded Distribution
// Contribution: 2018 Ganesh K. Bhat <ganeshsurfs@gmail.com> 
// 

/* eslint no-console: 0 */

// command <string> The command to run.
// args <string[]> List of string arguments.

// options <Object>

//     cwd <string> Current working directory of the child process.
//     env <Object> Environment key-value pairs. Default: process.env.
//     argv0 <string> Explicitly set the value of argv[0] sent to the child process. This will be set to command if not specified.
//     stdio <Array> | <string> Child's stdio configuration (see options.stdio).
//     detached <boolean> Prepare child to run independently of its parent process. Specific behavior depends on the platform, see options.detached).
//     uid <number> Sets the user identity of the process (see setuid(2)).
//     gid <number> Sets the group identity of the process (see setgid(2)).
//     serialization <string> Specify the kind of serialization used for sending messages between processes. Possible values are 'json' and 'advanced'. See Advanced Serialization for more details. Default: 'json'.
//     shell <boolean> | <string> If true, runs command inside of a shell. Uses '/bin/sh' on Unix, and process.env.ComSpec on Windows. A different shell can be specified as a string. See Shell Requirements and Default Windows Shell. Default: false (no shell).
//     windowsVerbatimArguments <boolean> No quoting or escaping of arguments is done on Windows. Ignored on Unix. This is set to true automatically when shell is specified and is CMD. Default: false.
//     windowsHide <boolean> Hide the subprocess console window that would normally be created on Windows systems. Default: false.


// https://nodejs.org/api/child_process.html
// https://gist.github.com/ami-GS/9503132

// https://stackoverflow.com/questions/14031763/doing-a-cleanup-action-just-before-node-js-exits


    /**
     * handler
     *
     * @returns
     */
    function handler() {

    let config = {}, conn = {}, proc = {};

    /**
     * setConfig
     *
     * @param {*} options
     */
    function setConfig(options) {
        // Make it attributewise
        config = options
    }

    /**
     * getConfig
     *
     */
    function getConfig() {
        return config
    }

    /**
     * getConn
     *
     * @param {*} name
     * @returns
     */
    function getConn(name) {
        return conn[name];
    }

    /**
     * setConn
     *
     * @param {*} name
     * @param {*} connection
     */
    function setConn(name, connection) {
        conn[name] = connection;
    }

    /**
     * getProc
     *
     * @param {*} name
     * @returns
     */
    function getProc(prc) {
        return proc[prc.id];
    }

    /**
     * setProc
     *
     * @param {*} prc
     */
    function setProc(prc) {
        proc[prc.id] = prc;
    }

    /**
     * startProcess
     *
     * @param {*} cmd
     * @param {*} args
     * @param {*} options
     * @param {*} file
     * @returns
     */
    function startProcess(cmd, args, options, file) {
        options["stdio"] = 'inherit';
        let pSpawn = require('child_process').spawn;
        let prc = pSpawn(cmd, [args], options);
        // console.log(proc.pid);

        // CLEAN UP ON PROCESS EXIT
        prc.stdin.resume();

        [`exit`, `SIGINT`, `SIGUSR1`, `SIGUSR2`, `uncaughtException`, `SIGTERM`].forEach(function (eventType) {
            prc.on(eventType, cleanUpServer.bind(null, eventType));
        }.bind(prc));

        proc[prc.id] = prc;
        return prc;
    }

    /**
     * stopProcess
     *
     * @param {*} prc
     */
    function stopProcess(prc) {
        proc[prc.id].kill();
        proc[prc.id].stdin.end();
    }

    /**
     * startProxy
     *
     * @param {*} conn
     * @param {*} options
     */
    function startProxy(conn, options) {
        const gateway = require('restana')();
        const { proxy, close } = require('fast-proxy')({
            base: options.base
        });
        gateway.all(options.url, function (req, res) {
            proxy(req, res, req.url, {});
        });
        gateway.start(options.port);
        return gateway;
    }

    /**
     * stopProxy
     *
     * @param {*} conn
     * @param {*} prxy
     */
    function stopProxy(conn, prxy) {

    }

    /**
     * connect
     *
     * @param {*} name
     * @param {*} prxy
     * @returns
     */
    function connect(name, prxy) {
        return conn[name];
    }

    /** 
     * close
     *
     * @param {*} name
     */
    function close(name) {
        conn[name].close();
    }

    return {
        setConfig: setConfig,
        getConn: getConn,
        setConn: setConn,
        getProc: getProc,
        setProc: setProc,
        start: startProcess,
        stop: stopProcess,
        startProxy: startProxy,
        proxyEnd: stopProxy,
        connect: connect,
        close: close
    }
}

module.exports = handler;