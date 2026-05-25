const oracledb = require('oracledb');
async function runApp() {
  let connection;
  try {
    connection = await oracledb.getConnection({ user: "demonode", password: "123", connectionString: "localhost/xepdb1" });
    console.log("Successfully connected to Oracle Database");

    // Create a table
    var profile_id = "habib", email = "hr665102@gmail.com";
    var resutl = await connection.execute(`SELECT *
    FROM (
      SELECT M.TITLE
      FROM MOVIE_WATCH MW, MOVIE M
      WHERE M.MOVIE_ID = MW.MOVIE_ID AND MW.PROFILE_ID = '${profile_id}' AND MW.EMAIL = '${email}'
      ORDER BY TIME DESC
    )
    WHERE ROWNUM = 1`);
    console.log(resutl);


  } catch (err) {
    console.error(err);
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error(err);
      }
    }
  }
}
runApp();