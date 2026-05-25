const oracledb = require('oracledb');

const dbConfig = {
    hrPool: {
        user          : "demonode",
        password      : "123",
        connectString : "localhost/xepdb1",
        poolMax : 10,
    }
};

async function initialize() {
  try {
    await oracledb.createPool(dbConfig.hrPool);
    console.log("database connected!!");
  } catch (error) {
    console.log(error);
  }
}

module.exports.initialize = initialize;

async function close() {
  await oracledb.getPool().close();
}

module.exports.close = close;

function simpleExecute(statement, binds = [], opts = {}) {
  return new Promise(async (resolve, reject) => {
    let conn;

    opts.outFormat = oracledb.OBJECT;
    opts.autoCommit = true;

    try {
      conn = await oracledb.getConnection();

      const result = await conn.execute(statement, binds, opts);

      resolve(result);
    } catch (err) {
      reject(err);
    } finally {
      if (conn) { // conn assignment worked, need to close
        try {
          await conn.close();
        } catch (err) {
          console.log(err);
        }
      }
    }
  });
}

module.exports.simpleExecute = simpleExecute;

initialize();
