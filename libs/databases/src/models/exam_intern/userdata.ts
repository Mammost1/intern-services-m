// import Bluebird from "bluebird";
// import Bookshelf from "bookshelf";
//import * as moment from "moment";
import { db_dev_intern_connect } from "../../connect/exam_intern";
import { UserdataAttributes, UserdataEntity } from "./entities/UserdataEntity";

export class Userdata extends db_dev_intern_connect.Model<Userdata> {


    override get tableName() { return 'userdata'; }
    override get hasTimestamps() { return false; }
    get requireFetch() { return false; }

    override toJSON(): UserdataEntity {
        var attrs = db_dev_intern_connect.Model.prototype.toJSON.apply(this, arguments as any) as UserdataEntity

        return attrs;
    }

}
