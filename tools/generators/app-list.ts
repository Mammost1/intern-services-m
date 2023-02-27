import chalk from "chalk";
import { readFileSync } from "fs";



async function main(){
    let workspace_json = readFileSync(`${process.cwd()}/workspace.json`, 'utf8');
    let workspace = JSON.parse(workspace_json);
    let projects = workspace['projects']
    let apps_path = [] as string[]
    for(let project in projects){
        let path = projects[project] as string
        if(path.includes(`apps/${project}`)){
            apps_path.push(project)
        }
    }
    for(let app of apps_path){
        // read PORT from apps/ketshopweb-products/src/environments/environment.ts
        let port = `${process.cwd()}/apps/${app}/src/environments/environment.prod.ts`
        let port_data = await import(port)
        // console.log(port_data)
        let PORT = port_data.environment.PORT
        // apps_port
        console.log(chalk.blue(`[√] app: ${app} PORT: ${PORT} URL: ${chalk.green(`${port_data.environment.API_URL}/${port_data.environment.global_prefix}`)}`))
    }
}
main()