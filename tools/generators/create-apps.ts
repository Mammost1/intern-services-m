

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

async function getPort(){
    let port = await inquirer.prompt({
        type: 'input',
        name: 'port',
        message: 'Please input port ex: 3000 :'
    })
    let portNumber = port.port.toString()
    portNumber = portNumber.trim()
    portNumber = portNumber.replace(/\s/g, '')
    return portNumber
}
async function getAppName(){
    let appName = await inquirer.prompt({
        type: 'input',
        name: 'appName',
        message: 'Please input app name ex: my-app :'
    })
    let appNameLower = appName.appName.toLowerCase() as string
    appNameLower = appNameLower.trim()
    appNameLower = appNameLower.replace(/\s/g, '-')
    return appNameLower
}

figlet('@CreateApps/CLI', async (err,data) => {
    if (err) {
        return;
    }
    console.log(chalk.green(data))
    const questions = [
       {
        type: 'list',
        name: 'apps',
        message: 'Please select?',
        choices: [
          'nest'
        ]
      }
    ]
    const answers = await inquirer.prompt(questions);
    console.log(answers);
    if(answers.apps === 'nest'){
        // console.log(chalk.green('Create NestJS'));
        // app name
        let appName = await getAppName()
        if(!appName) throw new Error('App name is required')
        let PORT = await getPort() || 3000
        // log
        console.log(chalk.green(`Create NestJS ${appName} on port ${PORT}`));
        // create app
        // yes or no
        let createApp = await inquirer.prompt({
            type: 'confirm',
            name: 'createApp',
            message: 'Create app?'
        })
        if(createApp.createApp){
            // create app
            await cmd(`${process.cwd()}/node_modules/.bin/nx g @nrwl/nest:app ${appName}`)
            let app_config = readFileSync(`${process.cwd()}/tools/generators/create-app/app.json`, 'utf-8')
            // replace {{app_name}}
            app_config = app_config.replace(/{{app_name}}/g, appName)
            // console.log(app_config)
            // save to ${process.cwd()}/apps/${appName}/project.json
            writeFileSync(`${process.cwd()}/apps/${appName}/project.json`, app_config)
            // delete folder ${process.cwd()}/apps/${appName}/src/app   
            await cmd(`rm -rf ${process.cwd()}/apps/${appName}/src/app`)  
            // cp main.tmpts to ${process.cwd()}/apps/${appName}/src/main.ts
            await cmd(`cp ${process.cwd()}/tools/generators/create-app/main.tmpts ${process.cwd()}/apps/${appName}/src/main.ts`)
            // read routes.tmpts
            let routes = readFileSync(`${process.cwd()}/tools/generators/create-app/routes.tmpts`, 'utf-8')
            // replace {{app_name}}
            routes = routes.replace(/{{app_name}}/g, appName)
            // write to ${process.cwd()}/apps/${appName}/src/routes.ts
            writeFileSync(`${process.cwd()}/apps/${appName}/src/routes.ts`, routes)
            // cp folder environments to ${process.cwd()}/apps/${appName}/src/environments
            await cmd(`cp -r ${process.cwd()}/tools/generators/create-app/environments ${process.cwd()}/apps/${appName}/src/`)
            // read ${process.cwd()}/apps/${appName}/src/environments/environment.prod.ts
            // replace {{app_name}} and {{app_port}}
            let prod = readFileSync(`${process.cwd()}/apps/${appName}/src/environments/environment.prod.ts`, 'utf-8')
            prod = prod.replace(/{{app_name}}/g, appName)
            prod = prod.replace(/{{app_port}}/g, PORT)
            // write to ${process.cwd()}/apps/${appName}/src/environments/environment.prod.ts
            writeFileSync(`${process.cwd()}/apps/${appName}/src/environments/environment.prod.ts`, prod)
            // read ${process.cwd()}/apps/${appName}/src/environments/environment.ts
            // replace {{app_name}} and {{app_port}}
            let dev = readFileSync(`${process.cwd()}/apps/${appName}/src/environments/environment.ts`, 'utf-8')
            dev = dev.replace(/{{app_name}}/g, appName)
            dev = dev.replace(/{{app_port}}/g, PORT)
            // write to ${process.cwd()}/apps/${appName}/src/environments/environment.ts
            writeFileSync(`${process.cwd()}/apps/${appName}/src/environments/environment.ts`, dev)
            // cp packages to ${process.cwd()}/apps/${appName}/src/packages
            await cmd(`cp -r ${process.cwd()}/tools/generators/create-app/packages ${process.cwd()}/apps/${appName}/src/`)
            // add add to pm2.json
            let pm2 = readFileSync(`${process.cwd()}/pm2.json`, 'utf-8')
            let pm2_json = JSON.parse(pm2)
            pm2_json.apps.push({
                "name": `${appName}:serve`,
                "script": `yarn run ${appName}:serve`,
                "instances": 1,
                "exec_mode": "fork",
                "watch": false,
                "max_memory_restart": "4096M",
                "kill_timeout": 60000,
                "ignore_watch": [
                  "node_modules"
                ],
                "log_date_format": "YYYY-MM-DD HH:mm Z"
            })
            // save to ${process.cwd()}/pm2.json
            writeFileSync(`${process.cwd()}/pm2.json`, JSON.stringify(pm2_json,null,4))
            // add script to package.json
            // "${appName}:serve": "nx run ${appName}:serve",
            let _package = readFileSync(`${process.cwd()}/package.json`, 'utf-8')
            let package_json = JSON.parse(_package)
            package_json.scripts[`${appName}:serve`] = `nx run ${appName}:serve`
            //"build:${appName}": "nx run ${appName}:build:production",
            package_json.scripts[`${appName}:build:production`] = `nx run ${appName}:build:production`
            // save to ${process.cwd()}/package.json
            writeFileSync(`${process.cwd()}/package.json`, JSON.stringify(package_json,null,4))
            setTimeout(async () => {
                console.log(chalk.green('Create NestJS success!'));
                process.exit()
            },1000)
        }
    }

})

