#! /usr/bin/env node

var fs = require('fs'),
    path = require('path'),
    program = require('commander'),
    readline = require('readline'),
    exec = require('child_process').exec,
    os = require('os'),
    rl;

var pathReg = /^(\w:(\\|\/)|\/).*/,
    cliCommand = os.platform() === 'win32' ? 'rd /s /q' : 'rm -rf';

program.version('1.1.2')
    .usage('[--confirm] <file or path>')
    .option('-c --confirm', 'without confirmation')
    .parse(process.argv);


if (program.args[0]) {
    var arg1 = program.args[0],
        match, realPath;
    if (match = pathReg.exec(arg1)) {
        realPath = match[0];
    } else {
        realPath = path.join(process.cwd(), arg1);
    }
    fs.exists(realPath, function (exists) {
        if (exists) {
            if (program.confirm) {
                removeFileOrDirector(realPath);
            } else {
                rl = readline.createInterface({
                    input: process.stdin,
                    output: process.stdout
                });
                rl.question('Confirm that you want to delete "' + realPath + '"? (y/N)', function (answer) {
                    if (answer.toUpperCase() === 'Y') {
                        removeFileOrDirector(realPath);
                    }
                    rl.close();
                });
            }
        } else {
            console.log('Error: File or directory does not exists');
        }
    });
} else {
    console.log('Missing parameters, use the "--help" parameter View Usage');
}

function removeFileOrDirector(realPath) {
    fs.stat(realPath, function (err, stats) {
        if (!err) {
            if (stats.isFile()) {
                fs.unlinkSync(realPath);
            } else if (stats.isDirectory()) {
                removeDir(realPath);
            }
        }
    });
}

function removeDir(realPath) {
    // 优先使用正常的方法删除，如果出错就是windows下目录过长导致的，于是采用遍历重命名的方式缩短目录长度
    exec([cliCommand, realPath].join(' '), function (err, stdout, stderr) {
        if (err || stderr) {
            walk(realPath);
            removeDir(realPath);
        }
    });
}

function walk(realPath) {
    var files = fs.readdirSync(realPath),
        p,
        stats,
        name = 1,
        dirName;

    // 遍历重命名目录或删除文件
    files.forEach(function (file) {
        p = path.join(realPath, file);
        stats = fs.statSync(p);
        if (stats.isDirectory()) {
            dirName = '' + name++;
            fs.renameSync(p, path.join(realPath, dirName));
            p = path.join(realPath, dirName);
            walk(p);
        } else {
            fs.unlinkSync(p);
        }
    });
}


