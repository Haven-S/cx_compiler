const { spawn } = require('child_process')
const fs = require('fs');
const path = require('path');

function runCompiler({ inputFilePath,fcodePath,fresultPath,foutputPath,fstackPath,fcodeIndexPath,fdebugPath,ftablePath}, { onData, getInput, getDebugCommand },debugSwitch) {
  return new Promise((resolve, reject) => {
    console.log(inputFilePath);
    let watching = true;
    let running = true;

    const checkFile = (filePath, callback) => {
      fs.readFile(filePath, 'utf-8', (err, data) => {
        if (err) {
          reject(err);
          return;
        }
        if(data){
          callback(data);
        }
        
      });
    };

    let watchingFiles = [];

    const watchFile = (filePath, callback,...args) => {
      fs.watchFile(filePath, { interval: 1000 }, (curr, prev) => {
        if (curr.mtime > prev.mtime) {
          callback(...args)
        }
      });

      watchingFiles.push({filePath,callback,args}); // 将文件路径添加到监听列表
    };

    const watchFileThenCheck = (filePath, callback) => {
      watchFile(filePath, checkFile,filePath,callback);
    };

    const unwatchAllFiles = () => {
      running = false

      watchingFiles.forEach(({filePath,callback,args}) => {
        fs.unwatchFile(filePath);
        if(callback === checkFile){
          callback(...args)
        }
        
      });

      watchingFiles = []; // 清空监听列表
    };

    const compilerPath = path.resolve(__dirname,'..','..','compiler','test.exe')
    const compilerFolderPath =  path.resolve(__dirname,'..','..','compiler')

    const childProcess = spawn(compilerPath,{
      cwd: compilerFolderPath
    });

    childProcess.on('close', (code) => {
      console.log(`Executable exited with code ${code}`);
      unwatchAllFiles();
      resolve();
    });

    childProcess.on('error', (error) => {
      unwatchAllFiles();
      reject(error);
    });

    childProcess.stderr.on('data', (data) => {
      unwatchAllFiles();
      const errorOutput = data.toString();
      reject(new Error(errorOutput));
    });

    const checkResult = (data)=>{
      const output = data;
      onData({ result: output });

      if (output.trim().endsWith('?') && watching) {
        console.log('waiting for input');
        watching = false; // 暂停文件监视

        getInput()
          .then((input) => {
            childProcess.stdin.write(input + '\n');

            // 继续文件监视
            watching = true;
          })
          .catch((error) => {
            reject(error);
          });
      }
    }

    function splitInstructions(data) {
      const lines = data.split('\n');
      let text = [];
      let instructions = [];

    
      for (let i = 0; i < lines.length; i++) {
        const parts = lines[i].trim().split(' ');
    
        text.push(parts.filter((val,idx)=>idx<3).join(' '));
        instructions.push(lines[i].split(' '))
      }
    
      return {
        text: text.join('\n'),
        lines:instructions
      };
    }

    watchFileThenCheck(fresultPath, checkResult);
    watchFileThenCheck(foutputPath, (data) =>{
      onData({ output: data });
    });
    watchFileThenCheck(fcodePath, (data) =>{
      let {text,lines} = splitInstructions(data)
      onData({ assemblyCode: text,pcodes:lines});
    });

    if(debugSwitch){
      const parseCode = (text)=> {
        const regex = /#start([\s\S]*?)#end/g;
        const matches = text.matchAll(regex);
        const commands = [];
      
        for (const match of matches) {
          const codeBlock = match[1];
          const codeLines = codeBlock.split('\n').map(line => line.trim()).filter(line => line.length > 0);
          const codeCommands = codeLines.map(line => {
            const parts = line.split(' ');
            return [parts[0], ...parts.slice(1).map(Number)];
          });
          commands.push(codeCommands);
        }
        return commands;
      }

      const writeDebugCommand = ()=>{
        getDebugCommand().then((cmd) => {
          fs.writeFile(fdebugPath, cmd + "\n",(err) => {
            if (err) {
              console.error(err);
              return;
            }
          })
        })
        .catch((error) => {
          reject(error);
        });
      }
  
      const loadCodeIndex = (data) =>{
        if(!running){
          return
        }
        const lines = data.split('\n');
        lastLine = lines[lines.length - 2];
        onData({ assmCodeLine: lastLine});
        writeDebugCommand()
      }


      watchFileThenCheck(fcodeIndexPath,(data) =>loadCodeIndex(data))
      watchFileThenCheck(fstackPath, (data) =>{
        parts = data.split('base');
        onData({ 
          stack:parts[0],
          runningStack:{
            stack:parts[0].split('\n').filter(line => line).map(line => parseInt(line)),
            base:parts[1].split('\n').filter(line => line).map(line => parseInt(line))
          }
        })
      });
      watchFileThenCheck(ftablePath,(data)=>{
        let symbolTableList = parseCode(data)
        onData({
          symbolTableList:symbolTableList
        })
      })
    }

    childProcess.stdin.write(inputFilePath + '\n');
    if(debugSwitch){
      childProcess.stdin.write("y" + '\n');
    }
    else{
      childProcess.stdin.write("n" + '\n');
    }
    
  });
}




module.exports = {
  runCompiler: runCompiler
};