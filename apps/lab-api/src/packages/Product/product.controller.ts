/*
https://docs.nestjs.com/controllers#controllers
*/
import { exam_intern } from '@internship/databases';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Logger,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { Res } from '@nestjs/common/decorators';
import { Knex } from 'knex';
import { WorkloadEntity, TopicprojectEntity } from '@internship/databases';
import moment = require('moment');
import {
  AuthGuard,
  encryptPassword,
  signToken,
  signTokenrefresh,
  validateEmail,
} from '@internship/authorization';
import { JwtService } from '@nestjs/jwt';
import * as fs from 'fs';
import { BadRequestException } from '@nestjs/common/exceptions';
import { MailerService } from '@nestjs-modules/mailer';
import { TransformationInterceptor } from './transform.interceptor';





@Controller()
export class ProductController {
  constructor(
    private jwtService: JwtService,
    private mailerService: MailerService
  ) {}
  index() {
    return {
      service_name: 'ProductController',
    };
  }

  @UseGuards(AuthGuard)
  @Get('user')
  async getuser() {
    const product = await new exam_intern.models.Userdata().fetchAll();
    //console.log(product);

    return product.toJSON();
  }

  @UseGuards(AuthGuard)
  @Get('project')
  async getproject() {
    const project = await new exam_intern.models.Topicproject()
      .where('Disabled', 1)
      .fetchAll();
    //console.log(product);

    return project.toJSON();
  }
  @UseGuards(AuthGuard)
  @Get('getprojectAdmin')
  async getprojectAdmin() {
    const project = await new exam_intern.models.Topicproject().fetchAll();
    //console.log(product);
    //  throw new HttpException("error", 404)
    return project.toJSON();
  }

  @UseGuards(AuthGuard)
  @Post('work/:Page')
  async getwork(
    @Param('Page', ParseIntPipe) Page: number,
    @Body()
    input: {
      search_day: string;
      search_name: string;
      search_project: string;
      role: string;
    }
  ) {
    const search_day = Object.prototype.hasOwnProperty.call(input, 'search_day')
      ? input.search_day
      : null;
    const search_name = Object.prototype.hasOwnProperty.call(
      input,
      'search_name'
    )
      ? input.search_name
      : null;
    const role = Object.prototype.hasOwnProperty.call(input, 'role')
      ? input.role
      : null;
    const search_project = Object.prototype.hasOwnProperty.call(
      input,
      'search_project'
    )
      ? input.search_project
      : null;
    let sql;
    let day;
    let lastday;
    day = moment().format('YYYY-MM-DD');
    lastday = moment().subtract(1, 'month').format('YYYY-MM-DD');

    const workloadQuery = await new exam_intern.models.Workload().query(
      (qb: Knex.QueryBuilder) => {
        qb.select([
          'workload.id',
          'workload.user_id',
          'workload.date',
          'workload.work_id',
          'userdata.Username',
          'userdata.Position',
        ]);
        qb.leftJoin(`userdata`, `workload.user_id`, '=', 'userdata.id');
        qb.groupBy('workload.date', 'workload.user_id');
        qb.select(
          exam_intern.db.knex.raw(
            'sum(timestampdiff(MINUTE,' +
              "'" +
              day +
              " 00:00:00', CONCAT('" +
              day +
              " ', time))) as times"
          )
        );
        qb.orderBy('workload.date', 'desc');
        if (search_day !== null && search_day != '') {
          const start = moment(search_day[0]).format('YYYY/MM/DD');
          const end = moment(search_day[1]).format('YYYY/MM/DD');
          qb.whereBetween('date', [start, end]);
        }
        if (role != 'Admin') {
          if (search_day == null || search_day == '') {
            const start = moment().subtract(1, 'month').format('YYYY-MM-DD');

            const end = moment().format('YYYY-MM-DD');
            qb.whereBetween('date', [start, end]);
          }
        }
        if (search_name !== null && search_name != '') {
          qb.where('userdata.Username', 'LIKE', `%${search_name}%`);
        }
        if (search_project !== null && search_project != '') {
          // console.log(search_project);

          qb.where('workload.work_id', 'LIKE', `%${search_project}%`);
        }
        sql = qb.toString();
      }
    );
    const workloadModels_count = await new exam_intern.models.Workload()
      .query((qb) => {
        qb.count('pp.id as count');
        qb.from(exam_intern.db.knex.raw('(' + sql + ') AS  `pp`'));
        // sql2 = qb.toString()
      })
      .fetch();

    const workloadModels_pageAll = await workloadQuery.clone().fetchAll({});

    const workloadModels_page = await workloadQuery.clone().fetchPage({
      page: Page,
      pageSize: 10,
    });

    const workloads = workloadModels_page.toJSON() as WorkloadEntity[];

    const workTopics = [] as (WorkloadEntity & {
      projects: TopicprojectEntity[];
      details: WorkloadEntity[];
    })[];
    for (let index = 0; index < workloads.length; index++) {
      const detailsQuery = new exam_intern.models.Workload().query(
        (qb: Knex.QueryBuilder) => {
          qb.select(['workload.details', 'workload.time', 'topicproject.work']);
          qb.leftJoin(
            `topicproject`,
            `workload.work_id`,
            '=',
            'topicproject.id'
          );
          qb.where(`workload.date`, workloads[index].date);
          qb.where(`workload.user_id`, workloads[index].user_id);
          qb.orderBy('workload.work_id');
          sql = qb.toString();
        }
      );
      const detailsModels = await detailsQuery.clone().fetchAll();
      const details = detailsModels.toJSON() as WorkloadEntity[];
      workTopics;

      const workTopic = {
        ...workloads[index],
        details: details,
      } as typeof workTopics[number];

      workTopics.push(workTopic);
    }

    return {
      workTopics: workTopics,
      count: workloadModels_count.toJSON(),
      workloadModels_pageAll: workloadModels_pageAll.toJSON(),
    };
  }

  @UseGuards(AuthGuard)
  @Post('addwork')
  async addwork(
    @Body()
    input: {
      user: number;
      date: Date;
      datawork: number[];
      datatime: number[];
      detadetails: string[];
    }
  ) {
    const { user, date, datawork, datatime, detadetails } = input;
    // console.log(datatime);
    let sql;

    const detailsQuery = new exam_intern.models.Workload().query(
      (qb: Knex.QueryBuilder) => {
        qb.select(['workload.date']);
        qb.where(`workload.user_id`, user);
        sql = qb.toString();
      }
    );
    const dates = await detailsQuery.fetchAll();
    const datest = dates.toJSON();
    let num = 0;

    for (let index = 0; index < datest.length; index++) {
      if (moment(date).format('YYYY-MM-DD') == datest[index].date) {
        num++;
      }
    }
    if (num == 0) {
      for (let index = 0; index < datawork.length; index++) {
        const model = {
          user_id: user,
          date: date,
          work_id: datawork[index],
          time: datatime[index],
          details: detadetails[index],
        };
        const rs = await new exam_intern.models.Workload(model).save();
      }
      return { error: ' สำเร็จ', Number: 1 };
    } else {
      return { error: 'error วันที่นี้มีการเพิ่ม ไปแล้ว', Number: 2 };
    }
  }
  @UseGuards(AuthGuard)
  @Put('edit_work')
  async edit_work(
    @Body()
    input: {
      id: number;
      user: number;
      date: Date;
      datawork: number[];
      datatime: string[];
      detadetails: string[];
    }
  ) {
    const { id, user, date, datawork, datatime, detadetails } = input;
    const worktrst = await new exam_intern.models.Workload()
      .query((qb: Knex.QueryBuilder) => {
        qb.select('workload.work_id ', 'workload.id ');
        qb.where('workload.date', date);
        qb.where('workload.user_id', user);
      })
      .fetchAll();

    const b = worktrst.toJSON();

    for (let index = 0; index < b.length; index++) {
      // console.log(b[index].work_id);
      let asd = false;
      for (let i = 0; i < datawork.length; i++) {
        if (b[index].work_id == datawork[i]) {
          asd = true;
          break;
        }
      }
      if (asd == false) {
        const datalist = await new exam_intern.models.Workload()
          .where('id', b[index].id)
          .fetch();
        if (!datalist)
          throw new HttpException('data Not Found', HttpStatus.NOT_FOUND);
        await datalist.destroy({ require: false });
      }
    }

    for (let index = 0; index < datawork.length; index++) {
      // console.log(datawork[index].work);
      const work = await new exam_intern.models.Workload()
        .query((qb: Knex.QueryBuilder) => {
          qb.select('workload.* ', 'topicproject.work');
          qb.leftJoin(
            `topicproject`,
            `workload.work_id`,
            '=',
            'topicproject.id'
          );
          qb.where('workload.work_id', datawork[index]);
          qb.where('workload.date', date);
          qb.where('workload.user_id', user);

          const sql = qb.toString();
        })
        .fetch();

      if (work) {
        const model_update = {
          time: datatime[index],
          details: detadetails[index],
        };
        const rs = await work.save(model_update, {
          method: 'update',
          patch: true,
          require: false,
        });
      } else {
        const model = {
          user_id: user,
          date: date,
          work_id: datawork[index],
          time: datatime[index],
          details: detadetails[index],
        };
        const rs = await new exam_intern.models.Workload(model).save();
      }
    }
  }
  @UseGuards(AuthGuard)
  @Post('Work_All/:Page')
  async Work_All(
    @Param('Page', ParseIntPipe) Page: number,
    @Body()
    input: {
      search_day: string;
      search_name: string;
      search_project: string;
      Searchseason: string;
      Sort: number;
    }

  ) {
    const search_day = Object.prototype.hasOwnProperty.call(input, 'search_day')
      ? input.search_day
      : null;
    const Searchseason = Object.prototype.hasOwnProperty.call(
      input,
      'Searchseason'
    )
      ? input.Searchseason
      : null;
    const search_name = Object.prototype.hasOwnProperty.call(
      input,
      'search_name'
    )
      ? input.search_name
      : null;
    const search_project = Object.prototype.hasOwnProperty.call(
      input,
      'search_project'
    )
      ? input.search_project
      : null;
    const Sort = Object.prototype.hasOwnProperty.call(input, 'Sort')
      ? input.Sort
      : null;
    let sql;

    const workloadQuery = await new exam_intern.models.Workload().query(
      (qb: Knex.QueryBuilder) => {
        qb.select(['workload.*', 'userdata.Username', 'userdata.Position']);
        qb.leftJoin(`userdata`, `workload.user_id`, '=', 'userdata.id');
        qb.groupBy('workload.date', 'workload.user_id');
        if (Sort == 1 || Sort == 0) {
          qb.orderBy('workload.date', 'desc');
        }
        if (Sort == 2) {
          qb.orderBy('workload.date', 'asc');
        }
        if (search_name !== null && search_name != 'All'&& search_name != '') {
          qb.where('userdata.Username', 'LIKE', `%${search_name}%`);
        }
        if (search_day !== null && search_day != '') {
          if (Searchseason == 'date') {
            const start = moment(search_day[0]).format('YYYY/MM/DD');
            const end = moment(search_day[1]).format('YYYY/MM/DD');
            qb.whereBetween('date', [start, end]);
          }
          if (Searchseason == 'month') {
            const start = moment(search_day[0]).format('YYYY/MM/01');
            const end = moment(search_day[1]).format('YYYY/MM/31');
            qb.whereBetween('date', [start, end]);
          }
          if (Searchseason == 'year') {
            const start = moment(search_day[0]).format('YYYY/01/01');
            const end = moment(search_day[1]).format('YYYY/12/31');
            qb.whereBetween('date', [start, end]);
          }
        }
        sql = qb.toString();
      }
    );
    let day = moment().format('YYYY-MM-DD');

    // -----------------ชั่วโมงรวม
    const workloadModels_count = await new exam_intern.models.Workload()

      .query((qb) => {
        qb.leftJoin(`userdata`, `workload.user_id`, '=', 'userdata.id');
        qb.count('workload.id as count');
        // qb.sum('workload.time as times');

        qb.select(
          exam_intern.db.knex.raw(
            'sum(timestampdiff(MINUTE,' +
              "'" +
              day +
              " 00:00:00', CONCAT('" +
              day +
              " ', time))) as times"
          )
        );
        // sql2 = qb.toString()
        if (search_name !== null && search_name != 'All'&& search_name != '') {
          qb.where('userdata.Username', 'LIKE', `%${search_name}%`);
        }
        if (search_day !== null && search_day != '') {
          if (Searchseason == 'date') {
            const start = moment(search_day[0]).format('YYYY/MM/DD');
            const end = moment(search_day[1]).format('YYYY/MM/DD');
            qb.whereBetween('workload.date', [start, end]);
          }
          if (Searchseason == 'month') {
            const start = moment(search_day[0]).format('YYYY/MM/01');
            const end = moment(search_day[1]).format('YYYY/MM/31');
            qb.whereBetween('workload.date', [start, end]);
          }
          if (Searchseason == 'year') {
            const start = moment(search_day[0]).format('YYYY/01/01');
            const end = moment(search_day[1]).format('YYYY/12/31');
            qb.whereBetween('workload.date', [start, end]);
          }
        }
      })
      .fetch();

    const project = await new exam_intern.models.Topicproject().fetchAll();
    const a = project.toJSON();

    //-----------------------------------------------------------------------------

    const Users = await new exam_intern.models.Userdata()

      .query((qb) => {
        qb.select(
          `userdata.id`,
          `userdata.Username`,
          `userdata.Position`,
          `userdata.email`
        );
        qb.whereExists(function () {
          this.select('id').from('workload');
          this.whereRaw('`userdata`.`id` = `workload`.`user_id`');
          if (search_name !== null && search_name != 'All'&& search_name != '') {
            this.whereRaw(
              '`userdata`.`id` = `workload`.`user_id`and  `userdata`.`Username` =' +
                "'" +
                search_name +
                "'"
            );
          }
        });
      })
      .fetchPage({ page: Page, pageSize: 10 });
    let spl4;
    // console.log(search_name);

    const b = Users.toJSON();
    const workloadModels_count_topics: any[] = [];
    for (let index = 0; index < a.length; index++) {
      const workloadModels_count_topic = await new exam_intern.models.Workload()

        .query((qb) => {
          qb.select(['workload.*', 'topicproject.work', 'userdata.Username']);
          qb.leftJoin(
            `topicproject`,
            `topicproject.id`,
            '=',
            'workload.work_id'
          );

          qb.leftJoin(`userdata`, `userdata.id`, '=', 'workload.user_id');
          qb.where('workload.work_id', a[index].id);
          if (search_name !== null && search_name != 'All'&& search_name != '') {
            qb.where('Username', search_name);
          }

          if (search_day !== null && search_day != '') {
            if (Searchseason == 'date') {
              const start = moment(search_day[0]).format('YYYY/MM/DD');
              const end = moment(search_day[1]).format('YYYY/MM/DD');
              qb.whereBetween('workload.date', [start, end]);
            }
            if (Searchseason == 'month') {
              const start = moment(search_day[0]).format('YYYY/MM/01');
              const end = moment(search_day[1]).format('YYYY/MM/31');
              qb.whereBetween('workload.date', [start, end]);
            }
            if (Searchseason == 'year') {
              const start = moment(search_day[0]).format('YYYY/01/01');
              const end = moment(search_day[1]).format('YYYY/12/31');
              qb.whereBetween('workload.date', [start, end]);
            }
          }
          qb.select(
            exam_intern.db.knex.raw(
              'sum(timestampdiff(MINUTE,' +
                "'" +
                day +
                " 00:00:00', CONCAT('" +
                day +
                " ', time))) as times"
            )
          );
        })
        .fetch();
      const f: any[] = [];
      f.push(workloadModels_count_topic.toJSON());

      if (f[0].work != null) {
        workloadModels_count_topics.push(workloadModels_count_topic.toJSON());
      }
    }

    const Topics_model = [] as (WorkloadEntity & {
      projects: TopicprojectEntity[];
    })[];
    for (let index = 0; index < b.length; index++) {
      const Topic_Query = new exam_intern.models.Workload().query(
        (qb: Knex.QueryBuilder) => {
          qb.column([
            'workload.work_id',
            'workload.date',
            'topicproject.work',
            {
              moss: exam_intern.db.knex.raw(
                'sum(timestampdiff(MINUTE,' +
                  "'" +
                  day +
                  " 00:00:00', CONCAT('" +
                  day +
                  " ', time))) "
              ),
            },
          ]);

          qb.leftJoin(
            `topicproject`,
            `topicproject.id`,
            '=',
            'workload.work_id'
          );
          qb.whereExists(function () {
            this.select('id')
              .from('userdata')
              .whereRaw(
                '`workload`.`user_id` = `userdata`.`id` and  `workload`.`user_id` =' +
                  "'" +
                  b[index].id +
                  "'"
              );
          });
          if (search_day !== null && search_day != '') {
            if (Searchseason == 'date') {
              const start = moment(search_day[0]).format('YYYY/MM/DD');
              const end = moment(search_day[1]).format('YYYY/MM/DD');
              qb.whereBetween('workload.date', [start, end]);
            }
            if (Searchseason == 'month') {
              const start = moment(search_day[0]).format('YYYY/MM/01');
              const end = moment(search_day[1]).format('YYYY/MM/31');
              qb.whereBetween('workload.date', [start, end]);
            }
            if (Searchseason == 'year') {
              const start = moment(search_day[0]).format('YYYY/01/01');
              const end = moment(search_day[1]).format('YYYY/12/31');
              qb.whereBetween('workload.date', [start, end]);
            }
          }
          qb.groupBy('work_id');
        }
      );

      const workTopics = [] as (WorkloadEntity & {
        projects: TopicprojectEntity[];
      })[];
      const Topic_Models = await Topic_Query.clone().fetchAll();

      const projects = Topic_Models.toJSON() as WorkloadEntity[];
      const workTopic = {
        ...b[index],
        projects: projects,
      } as typeof workTopics[number];

      Topics_model.push(workTopic);
    }
    //  --------------page

    const total_count = await new exam_intern.models.Userdata()

      .query((qb) => {
        if (search_name !== null && search_name != 'All'&& search_name != '') {
          qb.where('userdata.Username', 'LIKE', `%${search_name}%`);
        }
        qb.count('userdata.id as count');
      })
      .fetch();

    return {
      page: total_count.toJSON(),
      count: workloadModels_count.toJSON(),
      Topics_model: Topics_model,
      workloadModels_count_topics: workloadModels_count_topics,
    };
  }


  // -------------------------------------------------------------------------   user
  @UseGuards(AuthGuard)
  @Post('Get_user/:user')
  async Get_user(
    @Param('user') user: string,
    @Body()
    input: {
      search_day: string;
      Searchseason: string;
      selectedValue: string;
      page: number;
    }
  ) {
    const search_day = Object.prototype.hasOwnProperty.call(input, 'search_day')
      ? input.search_day
      : null;
    const selectedValue = Object.prototype.hasOwnProperty.call(
      input,
      'selectedValue'
    )
      ? input.selectedValue
      : null;
    const Searchseason = Object.prototype.hasOwnProperty.call(
      input,
      'Searchseason'
    )
      ? input.Searchseason
      : null;
    const page = Object.prototype.hasOwnProperty.call(input, 'page')
      ? input.page
      : null;
      let day = moment().format('YYYY-MM-DD');
    const Users = await new exam_intern.models.Userdata()

      .query((qb) => {
        qb.select(
          `userdata.id`,
          `userdata.Username`,
          `userdata.Position`,
          `userdata.email`,
          `userdata.image`,
          `userdata.phone`
        );

        qb.whereExists(function () {
          this.select('id').from('workload');
          this.whereRaw('`userdata`.`id` = `workload`.`user_id`');
          this.whereRaw(
            '`userdata`.`id` = `workload`.`user_id`and  `userdata`.`Username` =' +
              "'" +
              user +
              "'"
          );


        });
      })
      .fetchPage({ page: page, pageSize: 10 });
    let sql;


    const workloadQuery = await new exam_intern.models.Workload().query(
      (qb: Knex.QueryBuilder) => {
        qb.select(['workload.*', 'userdata.Username', 'userdata.Position']);
        qb.leftJoin(`userdata`, `workload.user_id`, '=', 'userdata.id');
        // qb.groupBy('workload.work_id',);
        qb.where('userdata.Username', 'LIKE', `%${user}%`);

        sql = qb.toString();


      }
    );
    // console.log(selectedValue);

    const b = Users.toJSON();

    const project = await new exam_intern.models.Topicproject().fetchAll();
    const a = project.toJSON();

    const workloadModels_count_topics: any[] = [];
    for (let index = 0; index < a.length; index++) {
      const workloadModels_count_topic = await new exam_intern.models.Workload()

        .query((qb) => {
          qb.select(['topicproject.work', 'userdata.Username']);
          qb.leftJoin(`topicproject`, `topicproject.id`, '=', 'pp.work_id');
          qb.leftJoin(`userdata`, `userdata.id`, '=', 'pp.user_id');
          qb.from(exam_intern.db.knex.raw('(' + sql + ') AS  `pp`'));
          qb.where('pp.work_id', a[index].id);
          qb.where('pp.Username', user);
          qb.select(
            exam_intern.db.knex.raw(
              'sum(timestampdiff(MINUTE,' +
                "'" +
                day +
                " 00:00:00', CONCAT('" +
                day +
                " ', time))) as times"
            )
          )
          if (selectedValue !== null && selectedValue != '') {
            qb.where('topicproject.work', 'LIKE', `%${selectedValue}%`);
          }
          if (search_day !== null && search_day != '') {
            if (Searchseason == 'date') {
              const start = moment(search_day[0]).format('YYYY/MM/DD');
              const end = moment(search_day[1]).format('YYYY/MM/DD');
              qb.whereBetween('pp.date', [start, end]);
            }
            if (Searchseason == 'month') {
              const start = moment(search_day[0]).format('YYYY/MM/01');
              const end = moment(search_day[1]).format('YYYY/MM/31');
              qb.whereBetween('pp.date', [start, end]);
            }
            if (Searchseason == 'year') {
              const start = moment(search_day[0]).format('YYYY/01/01');
              const end = moment(search_day[1]).format('YYYY/12/31');
              qb.whereBetween('pp.date', [start, end]);
            }
          }
          qb.count('topicproject.work as count');
        })
        .fetch();
      const f: any[] = [];
      f.push(workloadModels_count_topic.toJSON());

      if (f[0].work != null) {
        workloadModels_count_topics.push(workloadModels_count_topic.toJSON());
      }
    }

    // console.log(user);
    // console.log(b[0].Username);
    const Topics_model = [] as (WorkloadEntity & {
      projects: TopicprojectEntity[];
    })[];
    for (let index = 0; index < b.length; index++) {
      let sql;
      const Topic_Query = new exam_intern.models.Workload().query(
        (qb: Knex.QueryBuilder) => {
          qb.column([
            'workload.work_id',
            'workload.date',
            'topicproject.work',
            'workload.time',
            'workload.details',
            'userdata.Username',
          ]);

          qb.leftJoin(`userdata`, `userdata.id`, '=', 'workload.user_id');
          qb.leftJoin(
            `topicproject`,
            `topicproject.id`,
            '=',
            'workload.work_id'
          );

        qb.select(
          exam_intern.db.knex.raw(
            '(timestampdiff(MINUTE,' +
              "'" +
              day +
              " 00:00:00', CONCAT('" +
              day +
              " ', time))) as times"
          )
        );
          qb.where('userdata.Username', user);
          if (selectedValue !== null && selectedValue != '') {
            qb.where('topicproject.work', 'LIKE', `%${selectedValue}%`);
          }
          if (search_day !== null && search_day != '') {
            if (Searchseason == 'date') {
              const start = moment(search_day[0]).format('YYYY/MM/DD');
              const end = moment(search_day[1]).format('YYYY/MM/DD');
              qb.whereBetween('workload.date', [start, end]);
            }
            if (Searchseason == 'month') {
              const start = moment(search_day[0]).format('YYYY/MM/01');
              const end = moment(search_day[1]).format('YYYY/MM/31');
              qb.whereBetween('workload.date', [start, end]);
            }
            if (Searchseason == 'year') {
              const start = moment(search_day[0]).format('YYYY/01/01');
              const end = moment(search_day[1]).format('YYYY/12/31');
              qb.whereBetween('workload.date', [start, end]);
            }
          }
        }
      );

      const workTopics = [] as (WorkloadEntity & {
        projects: TopicprojectEntity[];
      })[];
      const Topic_Models = await Topic_Query.clone().fetchAll();

      const projects = Topic_Models.toJSON() as WorkloadEntity[];
      const workTopic = {
        ...b[index],
        projects: projects,
      } as typeof workTopics[number];

      Topics_model.push(workTopic);
    }

    return {
      Topics_model: Topics_model,
      workloadModels_count_topics: workloadModels_count_topics,
    };
  }
  @UseGuards(AuthGuard)
  @Delete('delete/:data')
  async deleteCategoryByID(@Param('data') data: number) {
    const datalist = await new exam_intern.models.Workload()
      .where('id', data)
      .fetch();
    if (!datalist)
      throw new HttpException('data Not Found', HttpStatus.NOT_FOUND);
    await datalist.destroy({ require: false });
    return { status: true, message: 'complete' };
  }

  // --------------------------------------   Login    ------------------------------------------------------------------
  @Post('Login')
  async Login(
    @Body()
    input: {
      userName: string;
      password: string;
    }
  ) {
    const { userName, password } = input;

    // -----------------------------------email----------------------------
    if (!validateEmail(userName)) {
      throw new Error('Invalid email.');
    }
    if (!password) {
      throw new Error('Require password.');
    }
    const passwords = encryptPassword(input.password);
    // check

    const user = await new exam_intern.models.Userdata()


      .query((qb: Knex.QueryBuilder) => {
        qb.select(
          `rows.name_row`,
          `userdata.id`,
          `userdata.Username`,
          `userdata.Position`,
          `userdata.email`,
          `userdata.image`
        );
        qb.leftJoin(`rows`, `rows.id`, '=', 'userdata.user_role');
        qb.where('email', userName);
        qb.where('password', passwords);
        qb.where('workstatus', 1);
        const sql = qb.toString();


      })

      .fetch();

    if (!user) {
      return { status: false, message: 'incorrect email/password.' };
    } else {
      const users = user.toJSON() as any;
      const token = signToken({
        id: users.id,
        name: users.Username,
        role: users.name_row,
        image: users.image,
      });
      const tokenrefresh = signTokenrefresh({
        id: users.id,
        name: users.Username,
        role: users.name_row,
      });

      return {
        access_token: token,
        refresh_token: tokenrefresh,
        status: true,
        message: 'success',
      };
    }
  }


  @Post('logout')
  async logout(
    @Body()
    input: {
      role: string;
    }
  ) {
    const {role } = input;
      return {
        status: true,
        message: 'success',
      };
  }

  @Post('refreshToken')
  async refreshToken(
    @Body()
    input: {
      refreshToken: string;
    }
  ) {
    const { refreshToken } = input;

    const cert = fs.readFileSync('./cert/privatetokenrefresh.key', {
      encoding: 'utf-8',
    }) as any;
    const token = refreshToken;

    try {
      const data = this.jwtService.verify(token, {
        algorithms: ['RS512'],
        publicKey: cert,
      });

      const user = await new exam_intern.models.Userdata()
        .query((qb: Knex.QueryBuilder) => {
          qb.select(
            `rows.name_row`,
            `userdata.id`,
            `userdata.Username`,
            `userdata.Position`,
            `userdata.email`
          );
          qb.leftJoin(`rows`, `rows.id`, '=', 'userdata.user_role');
          qb.where('userdata.id', data.id);
        })
        .fetch();

      const users = user.toJSON() as any;
      const maintoken = signToken({
        id: users.id,
        name: users.Username,
        role: users.name_row,
        image: users.image,
      });
      const tokenrefresh = signTokenrefresh({
        id: users.id,
        name: users.Username,
        role: users.name_row,
      });

      return { access_token: maintoken, refresh_token: tokenrefresh };
    } catch {
      throw new HttpException('You!', HttpStatus.UNAUTHORIZED);
    }
  }
  @UseGuards(AuthGuard)
  @Post('Createproject/:Page')
  async Createproject(
    @Param('Page', ParseIntPipe) Page: number,
    @Body() input: { search_name: string }
  ) {
    let name = input.hasOwnProperty('search_name') ? input.search_name : null;
    let query = await new exam_intern.models.Topicproject().query(
      (qb: Knex.QueryBuilder) => {
        qb.select(['topicproject.*']);
        qb.orderBy('topicproject.id');
        if (name !== null) {
          if (name !== null && name != '') {
            qb.where('topicproject.work', 'LIKE', `%${name}%`);
          }
        }
      }
    );
    let Createproject = await query
      .clone()
      .fetchPage({ page: Page, pageSize: 5 });
    let count = await query.clone().count();

    return { count, Createproject: Createproject.toJSON() };
  }
  @UseGuards(AuthGuard)
  @Delete('Deleteproject/:data')
  async Deleteproject(@Param('data') data: number) {
    const checktopic = await new exam_intern.models.Workload()
      .where('work_id', data)
      .fetch();
    if (!checktopic) {
      const datalist = await new exam_intern.models.Topicproject()
        .where('id', data)
        .fetch();

      if (!datalist)
        throw new HttpException('data Not Found', HttpStatus.NOT_FOUND);
      await datalist.destroy({ require: false });
      return { status: true, message: 'ลบ สำเร็จ' };
    } else {
      return {
        status: false,
        message: 'หัวข้อนี้ถูกใช้งานอยู่ ไม่สามารถ ลบได้',
      };
    }
  }
  @UseGuards(AuthGuard)
  @Put('Editproject/:id')
  async Editproject(
    @Body() input: { work: string },

    @Param('id') id: number
  ) {
    let { work } = input;
    let Editproject = await new exam_intern.models.Topicproject()
      .where('id', id)
      .fetch();

    if (!Editproject)
      throw new HttpException('Product Not Found', HttpStatus.NOT_FOUND);

    let model_update = {
      work: work,
    };
    await Editproject.save(model_update, {
      method: 'update',
      patch: true,
      require: false,
    });

    return { status: true, message: 'complete' };
  }
  @UseGuards(AuthGuard)
  @Post('Createtopic')
  async Createtopic(@Body() input: { work: string[] }) {
    let works = input.hasOwnProperty('work') ? input.work : [];

    for (let index = 0; index < works.length; index++) {
      if (works[index].trim()) {
        const checktopic = await new exam_intern.models.Topicproject()
          .where('work', works[index])
          .fetch();

        if (!checktopic) {
          const model = {
            work: works[index],
          };
          const rs = await new exam_intern.models.Topicproject(model)
            .save()
            .catch((err) => {
              throw new HttpException(err, 404);
            });
        }
      }
    }
    return { status: true, message: 'complete' };
  }
  @UseGuards(AuthGuard)
  @Post('checktopic')
  async checktopic(@Body() input: { work: string[] }) {
    let works = input.hasOwnProperty('work') ? input.work : [];

    for (let index = 0; index < works.length; index++) {
      if (works[index].trim()) {
        const checktopic = await new exam_intern.models.Topicproject()
          .where('work', works[index])
          .fetch();

        if (checktopic) {
          return { status: false, message: 'มีหัวข้อนี้แล้วในระบบ' };
        }
      }
      return { status: true, message: 'สำเร็จ' };
    }
  }

  @Post('Register')
  async Register(@Body() input: { from: any }) {
    let from = input.hasOwnProperty('from') ? input.from : null;
    const checkuser = await new exam_intern.models.Userdata()
      .query((qb: Knex.QueryBuilder) => {
        qb.where('email', from.email);
      })

      .fetch();
    if (checkuser == null) {
      const passwords = encryptPassword(from.password);
      const model = {
        Username: from.nickname,
        phone: from.phoneNumber,
        password: passwords,
        email: from.email,
        user_role: 2,
        Position: from.job,
      };
      const rs = await new exam_intern.models.Userdata(model).save();
      return { status: true, message: 'สมัครสำเร็จ' };
    } else {
      return { status: false, message: 'email นี้ถูกใช้ในระบบแล้ว' };
    }
  }
  // -------------------------------------------------------------------
  @UseGuards(AuthGuard)
  @Post('Createrole/:Page')
  async Createrole(
    @Param('Page', ParseIntPipe) Page: number,
    @Body()
    input: {
      search_name: string;
      search_email: string;
      search_job: string;
      search_role: string;
    }
  ) {
    let name = input.hasOwnProperty('search_name') ? input.search_name : null;
    let email = input.hasOwnProperty('search_email')
      ? input.search_email
      : null;
    let job = input.hasOwnProperty('search_job') ? input.search_job : null;
    let role = input.hasOwnProperty('search_role') ? input.search_role : null;
    let query = await new exam_intern.models.Userdata().query(
      (qb: Knex.QueryBuilder) => {
        qb.select([
          'userdata.id',
          'userdata.user_role',
          'userdata.Username',
          'userdata.email',
          'userdata.Position',
          'userdata.phone',
          'userdata.image',
          'userdata.workstatus',
          'rows.name_row',
        ]);
        qb.leftJoin(`rows`, `rows.id`, '=', 'userdata.user_role');
        qb.orderBy('userdata.id');
        if (name !== null && name != '') {
          qb.where('userdata.Username', 'LIKE', `%${name}%`);
        }
        if (email !== null && email != '') {
          qb.where('userdata.email', 'LIKE', `%${email}%`);
        }
        if (job !== null && job != '') {
          qb.where('userdata.Position', 'LIKE', `%${job}%`);
        }
        if (role !== null && role != '') {
          qb.where('rows.name_row', 'LIKE', `%${role}%`);
        }
      }
    );
    let Createrole = await query.clone().fetchPage({ page: Page, pageSize: 5 });
    let count = await query.clone().count();

    return { count, Createrole: Createrole.toJSON() };
  }
  @UseGuards(AuthGuard)
  @Delete('Deleterole/:data')
  async Deleterole(@Param('data') data: number) {
    const checkuser = await new exam_intern.models.Workload()
      .where('user_id', data)
      .fetch();
    if (!checkuser) {
      const datalist = await new exam_intern.models.Userdata()
        .where('id', data)
        .fetch();

      if (!datalist)
        throw new HttpException('data Not Found', HttpStatus.NOT_FOUND);
      await datalist.destroy({ require: false });
      return { status: true, message: 'ลบ สำเร็จ' };
    } else {
      return {
        status: false,
        message: '`ชื่อนี้ถูกใช้งานอยู่ ไม่สามารถ ลบได้',
      };
    }
  }
  @UseGuards(AuthGuard)
  @Put('Editrole/:id')
  async Editrole(
    @Body()
    input: {
      Username: string;
      email: string;
      phone: string;
      Position: string;
      name_row: string;
      image: string;
    },

    @Param('id') id: number
  ) {
    let { Username, email, phone, Position, name_row, image } = input;
    let Editproject = await new exam_intern.models.Userdata()
      .where('id', id)
      .fetch();

    if (!Editproject)
      throw new HttpException('Product Not Found', HttpStatus.NOT_FOUND);

    let model_update = {
      Username: Username,
      email: email,
      phone: phone,
      Position: Position,
      user_role: name_row,
      image: image,
    };
    await Editproject.save(model_update, {
      method: 'update',
      patch: true,
      require: false,
    });

    return { status: true, message: 'complete' };
  }
  @UseGuards(AuthGuard)
  @Get('role')
  async getrole() {
    const role = await new exam_intern.models.Rows().fetchAll();
    //console.log(product);

    return role.toJSON();
  }
  @UseGuards(AuthGuard)
  @Post('upload/:id')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: 'uploads',

        filename: (req, file, callback) => {
          const uniqueSuffix = file.originalname;
          // Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          // const filename = `${uniqueSuffix}${ext}`;
          const filename = `${uniqueSuffix}`;
          callback(null, filename);
        },
      }),
    })
  )
  async uploadFile(
    @Param('id') id: number,
    @UploadedFile() file: Express.Multer.File
  ) {
    if (!file) {
      throw new BadRequestException('throw new BadRequestException()');
    } else {
      // const response = {
      //   image: file.originalname,
      //   url: `http://localhost:3445/services/lab-api/product/showimage/${file.filename}`,
      // };
      // console.log(response);
    }
  }
  @UseGuards(AuthGuard)
  @Get('showimage/:filename')
  async Image(@Param('filename') filename, @Res() res: any) {
    res.sendFile(filename, { root: './uploads' });
  }
  @UseGuards(AuthGuard)
  @Post('userid')
  async userid(
    @Body()
    input: {
      id: string;
    }
  ) {
    let { id } = input;
    const product = await new exam_intern.models.Userdata()
      .query((qb: Knex.QueryBuilder) => {
        qb.select(
          'userdata.id',
          'userdata.Username',
          'userdata.Position',
          'userdata.phone',
          'userdata.email',
          'userdata.image',
          'userdata.user_role',
          'rows.name_row'
        );
        qb.leftJoin(`rows`, `rows.id`, '=', 'userdata.user_role');
        qb.where('userdata.id', id);
      })
      .fetchAll();

    return product.toJSON();
  }

  @Post('postmail')
  async postmail(  @Body()
  input: {
    email: string;
  }) {
    let { email } = input;
    let pass = Math.floor(Math.random() * 1000000 + 1);
    await this.mailerService.sendMail({
      to: email,
      from: 'kosefefe@gmail.com',
      subject: 'รหัสรยืนยีน Web .....',
      text: 'รหัสที่ใช้ในการยืนยีน อีเมล  คือ' + pass,
    });
    return pass;
  }

  @Put('forget')
  async forget(
    @Body()
    input: {
      email: string;
      password: string;
    }
  ) {
    let { email, password } = input;
    const passwords = encryptPassword(password);
    let Editproject = await new exam_intern.models.Userdata()
      .where('email', email)
      .fetch();

    if (!Editproject)
      throw new HttpException('Product Not Found', HttpStatus.NOT_FOUND);

    let model_update = {
      password: passwords,
    };
    await Editproject.save(model_update, {
      method: 'update',
      patch: true,
      require: false,
    });

    return { status: true, message: 'complete' };
  }

  @UseGuards(AuthGuard)
  @Post('useremail')
  async useremail(
    @Body()
    input: {
      email: string;
    }
  ) {
    let { email } = input;
    const product = await new exam_intern.models.Userdata()
      .where('email', email)
      .fetch();
    if (product) {
      return true;
    } else {
      return false;
    }
  }

  @UseGuards(AuthGuard)
  @Put('Disabledtopic')
  async Disabledtopic(
    @Body()
    input: {
      Disabled: string;
      id: number;
    }
  ) {
    let { Disabled, id } = input;
    let Disabledtopic = await new exam_intern.models.Topicproject()
      .where('id', id)
      .fetch();

    if (!Disabledtopic)
      throw new HttpException('Product Not Found', HttpStatus.NOT_FOUND);

    let model_update = {
      Disabled: Disabled,
    };
    await Disabledtopic.save(model_update, {
      method: 'update',
      patch: true,
      require: false,
    });

    return { status: true, message: 'complete' };
  }


  @UseGuards(AuthGuard)
  @Put('Disabledstatus')
  async Disabledstatus(
    @Body()
    input: {
      Disabled: string;
      id: number;
    }
  ) {
    let { Disabled, id } = input;
    let Disabledstatus = await new exam_intern.models.Userdata()
      .where('id', id)
      .fetch();

    if (!Disabledstatus)
      throw new HttpException('Product Not Found', HttpStatus.NOT_FOUND);

    let model_update = {
      workstatus: Disabled,
    };
    await Disabledstatus.save(model_update, {
      method: 'update',
      patch: true,
      require: false,
    });

    return { status: true, message: 'complete' };
  }









  @Post('Exportexcel')
  async Exportexcel(
    @Res() res,
    @Body()
    input: {
      search_day: string;
      search_name: string;
      search_project: string;
      role: string;
    }
  ) {
    const search_day = Object.prototype.hasOwnProperty.call(input, 'search_day')
      ? input.search_day
      : null;
    const search_name = Object.prototype.hasOwnProperty.call(
      input,
      'search_name'
    )
      ? input.search_name
      : null;
    const role = Object.prototype.hasOwnProperty.call(input, 'role')
      ? input.role
      : null;
    const search_project = Object.prototype.hasOwnProperty.call(
      input,
      'search_project'
    )
      ? input.search_project
      : null;
    let sql;
    let day;
    let lastday;
    day = moment().format('YYYY-MM-DD');
    lastday = moment().subtract(1, 'month').format('YYYY-MM-DD');

    const workloadQuery = await new exam_intern.models.Workload().query(
      (qb: Knex.QueryBuilder) => {
        qb.select([
          'workload.id',
          'workload.user_id',
          'workload.date',
          'workload.work_id',
          'userdata.Username',
          'userdata.Position',
        ]);
        qb.leftJoin(`userdata`, `workload.user_id`, '=', 'userdata.id');
        qb.groupBy('workload.date', 'workload.user_id');
        qb.select(
          exam_intern.db.knex.raw(
            'sum(timestampdiff(MINUTE,' +
              "'" +
              day +
              " 00:00:00', CONCAT('" +
              day +
              " ', time))) as times"
          )
        );
        qb.orderBy('workload.date');
        if (search_day !== null && search_day != '') {
          const start = moment(search_day[0]).format('YYYY/MM/DD');
          const end = moment(search_day[1]).format('YYYY/MM/DD');
          qb.whereBetween('date', [start, end]);
        }
        if (role != 'Admin') {
          if (search_day == null || search_day == '') {
            const start = moment().subtract(1, 'month').format('YYYY-MM-DD');
            const end = moment().format('YYYY-MM-DD');
            qb.whereBetween('date', [start, end]);
          }
        }


        if (search_name !== null && search_name != '') {
          qb.where('userdata.Username', 'LIKE', `%${search_name}%`);
        }
        if (search_project !== null && search_project != '') {
          // console.log(search_project);

          qb.where('workload.work_id', 'LIKE', `%${search_project}%`);
        }
        sql = qb.toString();
      }
    );

    const workloadModels_pageAll = await workloadQuery.clone().fetchAll({});

    const workloads = workloadModels_pageAll.toJSON() as WorkloadEntity[];

    const workTopics = [] as (WorkloadEntity & {
      projects: TopicprojectEntity[];
      details: WorkloadEntity[];
    })[];
    for (let index = 0; index < workloads.length; index++) {
      const detailsQuery = new exam_intern.models.Workload().query(
        (qb: Knex.QueryBuilder) => {
          qb.select([
            'workload.details',
            'workload.time',
            'topicproject.id',
            'topicproject.work',
          ]);

          qb.leftJoin(
            `topicproject`,
            `workload.work_id`,
            '=',
            'topicproject.id'
          );
          qb.where(`workload.date`, workloads[index].date);
          qb.where(`workload.user_id`, workloads[index].user_id);
          qb.orderBy('workload.work_id');

          qb.select(
            exam_intern.db.knex.raw(
              '(timestampdiff(MINUTE,' +
                "'" +
                day +
                " 00:00:00', CONCAT('" +
                day +
                " ', time))) as times"
            )
          );
        }
      );
      const detailsModels = await detailsQuery.clone().fetchAll();
      const details = detailsModels.toJSON() as WorkloadEntity[];
      workTopics;

      const workTopic = {
        ...workloads[index],
        details: details,
      } as typeof workTopics[number];

      workTopics.push(workTopic);
    }

    const project = await new exam_intern.models.Topicproject().fetchAll();
    var xl = require('excel4node');
    var wb = new xl.Workbook();
    var ws = wb.addWorksheet('Sheet 1');

    var Style = wb.createStyle({
      alignment: {
        wrapText: true,
        horizontal: 'center',
        vertical: 'center',
      },
      font: {
        bold: true,
      },
    });

    var ProjectStyle = wb.createStyle({
      alignment: {
        wrapText: true,
        horizontal: 'center',
        vertical: 'center',
      },
      font: {
        color: '#EFD530',
        size: 12,
        bold: true,
      },
    });
    var myStyle = wb.createStyle({
      alignment: {
        horizontal: 'center',
        wrapText: true,
        vertical: 'center',
      },
      font: {
        size: 12,
      },
    });

    var Styles = wb.createStyle({
      alignment: {
        horizontal: 'center',
        wrapText: true,
        vertical: 'center',
      },
      font: {
        size: 12,
      },
      numberFormat: '[hh]:mm:ss',
    });

    var Styletotal = wb.createStyle({
      alignment: {
        horizontal: 'center',
        wrapText: true,
        vertical: 'center',
      },
      font: {
        size: 12,
        color: '#111dbf',
      },
      numberFormat: '[hh]:mm:ss',
    });

    var percentStyles = wb.createStyle({
      alignment: {
        horizontal: 'center',
        wrapText: true,
        vertical: 'center',
      },
      font: {
        size: 12,
      },

      numberFormat: '0.00%',
    });
    let projects = project.toJSON();

    ws.cell(1, 2, 2, 2, true).string('DATE').style(Style);
    ws.cell(1, 3, 2, 3, true).string('Total Hours').style(Style);
    ws.cell(1, 4, 2, 4, true).string('Note & CommentDetails').style(Style);
    ws.column(4).setWidth(50);
    ws.row(1).setHeight(30);
    ws.row(2).setHeight(30);
    ws.cell(1, 5, 1, 5 + projects.length - 1, true)
      .string('projects')
      .style(Style);
    for (let index = 0; index < projects.length; index++) {
      ws.cell(2, 5 + index, 2, 5 + index, true)
        .string(projects[index].work)
        .style(ProjectStyle);
      ws.column(5 + index).setWidth(20);
      let letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
      ws.cell(
        4 + workTopics.length,
        5 + index,
        4 + workTopics.length,
        5 + index
      )
        .formula(
          'SUBTOTAL(9,' +
            letters[4 + index] +
            '3:' +
            letters[4 + index] +
            (workTopics.length + 3) +
            ')'
        )
        .style(Styletotal);

      let def = letters[4 + index] + (workTopics.length + 4);
      let totaltime = 'C' + (4 + workTopics.length);
      ws.cell(
        5 + workTopics.length,
        5 + index,
        5 + workTopics.length,
        5 + index
      )
        .formula(def + '/' + totaltime)
        .style(percentStyles);
    }

    let projectlist: any = workTopics;

    let check = false;
    for (let index = 0; index < projects.length; index++) {
      for (let i = 0; i < projectlist.length; i++) {
        for (let j = 0; j < projectlist[i].details.length; j++) {
          if (projectlist[i].details[j].work == projects[index].work) {
            j = projectlist[index].details;
            check = true;
          }
        }
        if (check == false) {
          projectlist[i].details.push({
            id: projects[index].id,
            work: projects[index].work,
            times: 0,
          });
        }
        check = false;
      }
    }
    for (let i = 0; i < projects.length; i++) {
      for (let index = 0; index < projectlist[i].details.length; index++) {
        projectlist[index].details.sort((a: any, b: any) => {
          // for (let index = 0; index < this.time.length; index++) {
          const nameA = a.id;
          const nameB = b.id;

          if (nameA < nameB) {
            return -1;
          }
          if (nameA > nameB) {
            return 1;
          }

          // }
          return 0;
        });
      }
    }

    for (let index = 0; index < workTopics.length; index++) {
      let hours =
        moment.duration(projectlist[index].times, 'minutes').asHours() / 24;
      //day
      ws.cell(3 + index, 1, 3 + index, 1, true)
        .string(moment(workTopics[index].date).format('ddd'))
        .style(myStyle);
      //`วันที่่
      ws.cell(3 + index, 2, 3 + index, 2, true)
        .string(moment(workTopics[index].date).format('DD/MM/YYYY'))
        .style(myStyle);
      //เวลารวม
      ws.cell(3 + index, 3, 3 + index, 3, true)
        .number(hours)
        .style(Styles);
      //

      //////////////////// detail

      let detail = ``;
      for (let i = 0; i < projectlist[index].details.length; i++) {
        if (projectlist[index].details[i].details) {
          detail =
            detail +
            projectlist[index].details[i].work +
            ' : ' +
            projectlist[index].details[i].details +
            '\n';
          ws.row(3 + index).setHeight(projectlist[index].details.length * 20);
        }
        ws.cell(3 + index, 5 + i, 3 + index, 5 + i, true)
          .number(
            moment
              .duration(projectlist[index].details[i].times, 'minutes')
              .asHours() / 24
          )
          .style(Styles);
      }
      ws.cell(3 + index, 4, 3 + index, 4, true)
        .string(detail)
        .style(myStyle);
    }
    ws.cell(4 + workTopics.length, 3, 4 + workTopics.length, 3)
      .formula('SUBTOTAL(9,C3:C' + (workTopics.length + 3) + ')')
      .style(Styles);

    // ws.cell(4+workTopics.length, 5,4+workTopics.length, 5).formula('SUBTOTAL(9,E3:E'+(workTopics.length+3)+')').style(Styles);
    wb.write('myfirstexcel.xlsx', res);
  }
}
