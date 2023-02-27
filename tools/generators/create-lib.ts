

import inquirer  from 'inquirer';
import figlet from 'figlet';
import chalk from 'chalk';
import { exec } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';

function cmd(command: string) {
    return new Promise((resolve, reject)=> {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(error);
            }
            resolve(stdout);
        });
    });
}

async function getLibName(){
    let service = await inquirer.prompt({
        type: 'input',
        name: 'service',
        message: 'Please input lib name ex: my-services :'
    })
    let serviceNameLower = service.service.toLowerCase() as string
    serviceNameLower = serviceNameLower.trim()
    serviceNameLower = serviceNameLower.replace(/\s/g, '-')
    return serviceNameLower
}

figlet('@CreateLib/CLI', async (err,data) => {
    if (err) {
        return;
    }
    console.log(chalk.green(data))
    const questions = [
       {
        type: 'list',
        name: 'lib',
        message: 'Please select?',
        choices: [
          'ts-lib'
        ]
      }
    ]
    const answers = await inquirer.prompt(questions);
    console.log(answers);
    if(answers.lib === 'ts-lib'){
        // console.log(chalk.green('Create NestJS'));
        // app name
        let libName = await getLibName()
        if(!libName) throw new Error('App name is required')
        // log
        console.log(chalk.green(`Create TypeScript ${libName}`));
        // yes or no
        let createLib = await inquirer.prompt({
            type: 'confirm',
            name: 'createLib',
            message: 'Create lib?'
        })
        if(createLib.createLib){
            // create libs
            await cmd(`${process.cwd()}/node_modules/.bin/nx g @nrwl/js:library ${libName}`)
            let ts_config = readFileSync(`${process.cwd()}/tools/generators/create-lib/tsconfig.json`, 'utf-8')
            writeFileSync(`${process.cwd()}/libs/${libName}/tsconfig.json`, ts_config)
            let project_json = readFileSync(`${process.cwd()}/tools/generators/create-lib/lib.json`, 'utf-8')
            project_json = project_json.replace(/{{libName}}/g, libName)
            writeFileSync(`${process.cwd()}/libs/${libName}/project.json`, project_json)
            setTimeout(async () => {
                console.log(chalk.green('Create TypeScript success!'));
                process.exit()
            },1000)
        }
    }

})

