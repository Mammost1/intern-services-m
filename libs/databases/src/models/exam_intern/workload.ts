// import Bluebird from "bluebird";
// import Bookshelf from "bookshelf";
import * as moment from "moment";
import { db_dev_intern_connect } from "../../connect/exam_intern";
import { WorkloadAttributes, WorkloadEntity } from "./entities/WorkloadEntity";
import { Topicproject } from "./topicproject";

export class Workload extends db_dev_intern_connect.Model<Workload> {


    override get tableName() { return 'workload'; }
    override get hasTimestamps() { return false; }
    get requireFetch() { return false; }

    override toJSON(): WorkloadEntity {
        var attrs = db_dev_intern_connect.Model.prototype.toJSON.apply(this, arguments as any) as WorkloadEntity
        if (attrs.date) {
          attrs.date = moment(this.get('date')).format('YYYY-MM-DD');
          attrs.date = (attrs.date == "Invalid date") ? null : attrs.date;

        }
        return attrs

    }
     Work() {
      return this.hasMany(Topicproject, 'id', 'work_id')
    }
}
