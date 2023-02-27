

// let POOLS = process.env['POOLS'] ? Number(process.env['POOLS']) : 5
// const pools = {
//     min: 5,
//     max: POOLS,
//     propagateCreateError: false,
//     afterCreate: function (conn: any, done: any) {
//         // do the second query...
//         conn.query('SELECT 1;', function (err: any) {
//             // if err is not falsy, connection is discarded from pool
//             // if connection aquire was triggered by a query the error is passed to query promise
//             done(err, conn);
//         });
//     }
// }

// export const config = {
//   database: {
//     dev_intern: {
//       client: 'mysql',
//       connection: {
//           host: '203.156.124.188',
//           user: 'dev_intern',
//           password: 'g1ZqK2oOWG',
//           database: 'dev_intern'
//       },
//       pools: pools
//     }
//   },
//   jwt_expire: '30s',
//   jwt_expire_refresh: '30d'
// }
