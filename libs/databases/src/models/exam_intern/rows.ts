// import Bluebird from "bluebird";
// import Bookshelf from "bookshelf";
//import * as moment from "moment";
import { db_dev_intern_connect } from "../../connect/exam_intern";
import { RowsAttributes, RowsEntity } from "./entities/RowsEntity";

export class Rows extends db_dev_intern_connect.Model<Rows> {


    override get tableName() { return 'rows'; }
    override get hasTimestamps() { return false; }
    get requireFetch() { return false; }

    override toJSON(): RowsEntity {
        var attrs = db_dev_intern_connect.Model.prototype.toJSON.apply(this, arguments as any) as RowsEntity

        return attrs;
    }

}