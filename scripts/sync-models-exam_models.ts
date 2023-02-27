

import sqlts from './sql-ts';
import * as fs from 'fs';
import { config } from '../libs/config/src/config';
import knex from 'knex';

// config
let db_models = 'exam_intern'
let path = `libs/databases/src/models/${db_models}`
let db_connect = 'db_dev_intern_connect'

const configsql = {
  // "client": config.database.ket_staff.client,
  // "connection": config.database.ket_staff.connection,
  "schemas": [
    config.database.dev_intern.connection.database
  ],
  "interfaceNameFormat": "${table}Entity",
  "enumNameFormat": "${name}Enum",
  "tableNameCasing": "pascal",
  "typeMap": {
    "string": ["date","time","datetime", "varchar", "char", "text", "mediumtext", "longtext", "tinytext", "mediumblob", "blob", "longblob", "tinyblob"],
  }
}

let db = knex(config.database.dev_intern)

async function main(){
  // const tsString = await sqlts.toTypeScript(configsql);
  const toObject = await sqlts.toObject(configsql,db);
  // console.log(JSON.stringify(toObject, null, 4));
  for(let table of toObject.tables){
    console.log(table.interfaceName);
    let model: any = {
      tables: [],
      enums: [],
    }
    let attributes: any[] = []
    for(let attribute of table.columns){
      attributes.push(attribute.name);
    }
    model.tables.push(table);
    let tsString = sqlts.fromObject(model, configsql);
    let attributesString = `export const ${table.interfaceName.replace('Entity', 'Attributes')} = ${JSON.stringify(attributes, null,4)};`
    tsString+=`\n\n${attributesString}`
    // write to file
    let fileName = `${table.interfaceName}.ts`;
    let filePath = `${__dirname}/../${path}/entities/${fileName}`;
    // check if file exists
    let tableName = table.interfaceName.replace('Entity', '');
    // pascal to snake
    tableName = tableName.replace(/([A-Z])/g, '_$1').toLowerCase();
    // remove _
    tableName = tableName.replace('_', '');
    let model_path = `${__dirname}/../${path}/${tableName}.ts`;
    if(!fs.existsSync(model_path)){
      let created_at = attributes.find(item => item.toLowerCase() === 'created_at');
      let updated_at = attributes.find(item => item.toLowerCase() === 'updated_at');
      let tmp = `// import Bluebird from "bluebird";
// import Bookshelf from "bookshelf";
${created_at || updated_at?'':'//'}import * as moment from "moment";
import { ${db_connect} } from "../../connect/${db_models}";
import { ${table.interfaceName.replace('Entity', 'Attributes')}, ${table.interfaceName} } from "./entities/${table.interfaceName}";

export class ${table.interfaceName.replace('Entity', '')} extends ${db_connect}.Model<${table.interfaceName.replace('Entity', '')}> {


    override get tableName() { return '${tableName}'; }
    override get hasTimestamps() { return ${created_at?'true':'false'}; }
    get requireFetch() { return false; }

    override toJSON(): ${table.interfaceName} {
        var attrs = ${db_connect}.Model.prototype.toJSON.apply(this, arguments as any) as ${table.interfaceName}
`
      // find created_at from attributes
      // let created_at = attributes.find(item => item.toLowerCase() === 'created_at');
      if(created_at){
tmp+=`        if (attrs.created_at) {
          attrs.created_at = moment(this.get('created_at')).format('YYYY-MM-DD HH:mm:ss');
          attrs.created_at = (attrs.created_at == "Invalid date") ? null : attrs.created_at;
        }`
      }
      // find updated_at from attributes
      // let updated_at = attributes.find(item => item.toLowerCase() === 'updated_at');
      if(updated_at){
tmp+=`
        if (attrs.updated_at) {
          attrs.updated_at = moment(this.get('updated_at')).format('YYYY-MM-DD HH:mm:ss');
          attrs.updated_at = (attrs.updated_at == "Invalid date") ? null : attrs.updated_at;
        }`
      }

tmp+=`
        return attrs;
    }

}`
    fs.writeFileSync(model_path, tmp);
    }
    fs.writeFileSync(filePath, tsString);
  }

// create file models.ts
let models_ts = `import { ${db_connect} } from "../../connect/${db_models}";
`
let EntityIndex = ``

for(let table of toObject.tables){
  EntityIndex+=`export * from "./${table.interfaceName}";\n`

  let tableName = table.interfaceName.replace('Entity', '');
  // pascal to snake
  tableName = tableName.replace(/([A-Z])/g, '_$1').toLowerCase();
  // remove _
  tableName = tableName.replace('_', '');
  let model_path = `${tableName}`;
models_ts+=`import { ${table.interfaceName.replace('Entity', '')} } from './${model_path}';\n`
}
models_ts+=`
export const ${db_models} = {
    db: ${db_connect},
    models: {\n`
for(let table of toObject.tables){
models_ts+=`        ${table.interfaceName.replace('Entity', '')},
`
}
models_ts+=`    }
}`
fs.writeFileSync(`${path}/models.ts`, models_ts);
fs.writeFileSync(`${path}/entities/index.ts`, EntityIndex);
setTimeout(()=>{
  process.exit(0)
},100)
}
main()
