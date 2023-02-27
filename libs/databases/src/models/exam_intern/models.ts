import { db_dev_intern_connect } from "../../connect/exam_intern";
import { Rows } from './rows';
import { Topicproject } from './topicproject';
import { Userdata } from './userdata';
import { Workload } from './workload';

export const exam_intern = {
    db: db_dev_intern_connect,
    models: {
        Rows,
        Topicproject,
        Userdata,
        Workload,
    }
}