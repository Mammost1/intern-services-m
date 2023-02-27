// import Bluebird from "bluebird";
// import Bookshelf from "bookshelf";
import * as moment from "moment";
import { db_dev_intern_connect } from "../../connect/exam_intern";
import { TopicprojectAttributes, TopicprojectEntity } from "./entities/TopicprojectEntity";

export class Topicproject extends db_dev_intern_connect.Model<Topicproject> {


    override get tableName() { return 'topicproject'; }
    override get hasTimestamps() { return false; }
    get requireFetch() { return false; }

    override toJSON(): TopicprojectEntity {
        var attrs = db_dev_intern_connect.Model.prototype.toJSON.apply(this, arguments as any) as TopicprojectEntity
        // if (attrs.created_at) {
        //   attrs.created_at = moment(this.get('created_at')).format('YYYY-MM-DD HH:mm:ss');
        //   attrs.created_at = (attrs.created_at == "Invalid date") ? null : attrs.created_at;
        // }
        // if (attrs.updated_at) {
        //   attrs.updated_at = moment(this.get('updated_at')).format('YYYY-MM-DD HH:mm:ss');
        //   attrs.updated_at = (attrs.updated_at == "Invalid date") ? null : attrs.updated_at;
        // }
        return attrs;
    }

}
