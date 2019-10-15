const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

var db;
var db_file = './db/MyVideos107.db';
// var openingDate = '2017-07-01';
// var sql = `select * from movie where premiered >= '${openingDate}'`;

var sql;

// open the database connection
const db_open = () => {
  //open the database
  db = new sqlite3.Database(db_file, sqlite3.OPEN_READONLY, err => {
    if (err) {
      return console.error(err.message);
    } else {
      console.log('Connected to the ' + db_file);
    }
  });
};

// close the database connection
const db_close = () => {
  db.close(err => {
    if (err) {
      return console.error(err.message);
    } else {
      console.log('Close the database connection');
    }
  });
};

// tes db with options
// options must be Object even if it is empty
// options are
// total : return total items;
// id : return item which id equal id
// name : return items which match name with name field
// limit : add limit clause at the end of sql query statement
// offset : return items with location of offsets;
const test_db = options => {
  // query
  // id, name, limit, offset
  var isTotal = false;

  console.log('options is below');
  console.log(options);
  if (Object.keys(options).length === 0) {
    // no query
    sql = `select idMovie, c00, c08, c20 from movie_view order by premiered desc limit 20 offset 0`;
  } else {
    const query = Object.keys(options);
    console.log(query);
    // console.log(options["name"]);
    // if (query[0] === "id") console.log(options[query[0]]);
    // isTotal = true;
    // sql = `select count(idMovie) as total from movie`;
    sql = '';

    query.map(item => {
      if (item === 'name') {
        sql += `select idMovie, c00, c08, c20 from movie where c00 like '%${
          options[item]
        }%' order by idMovie desc`;
      }

      if (item === 'all') {
        sql += `select idMovie, c00, c01, c03, c08, c16, c19, c20, premiered, strPath,rating, uniqueid_value from movie_view order by premiered desc`;
      }

      if (item === 'id') {
        sql += `select * from movie_view where idMovie = ${options[item]}`;
      }

      if (item === 'limit') {
        if (sql === '') {
          sql += `select idMovie, c00, c08, c20, premiered, rating from movie_view order by premiered desc limit ${
            options[item]
          }`;
        } else {
          sql += ` limit ${options[item]}`;
        }
      }

      if (item === 'offset') {
        if (sql === '') {
          sql += `select idMovie, c00, c08, c20, premiered, rating from movie_view order by premiered desc offset ${
            options[item]
          }`;
        } else {
          sql += ` offset ${options[item]}`;
        }
      }

      if (item === 'total') {
        sql = `select count(idMovie) as total from movie`;
        isTotal = true;
      }
    }); // end of query.map
    console.log(sql);
  }

  db_open();
  if (isTotal) {
    db.all(sql, [], (err, movies) => {
      if (err) {
        //throw err;
        console.log('DB SQL query error: Please request correct sql query');
      } else {
        console.log(movies[0]);
      }
    });
  } else {
    db.all(sql, [], (err, movies) => {
      if (err) {
        //throw err;
        console.log('DB SQL query error: Please request correct sql query');
      } else {
        // movies.c08, c20 is the type of xml
        // movies is array
        movies.forEach(row => {
          const parser = require('xml2json-light');

          if (row.c08 !== '') {
            var poster = parser.xml2json(row.c08);
            // console.log(poster);
            var poster_temp = [];

            if (Array.isArray(poster.thumb)) {
              poster.thumb.map(i => {
                if (i.aspect === 'poster') {
                  poster_temp.push(i);
                } else if (i.aspect === undefined) {
                  poster_temp.push(i);
                }
                // console.log(poster_temp);
              });
            } else {
              poster_temp.push(poster.thumb);
            }

            row.c08 = poster_temp[0].preview;
          }

          if (row.c20 !== '') {
            var fanart = parser.xml2json(row.c20);
            // console.log(fanart);
            var fanart_temp = [];

            if (Array.isArray(fanart.fanart.thumb)) {
              fanart.fanart.thumb.map(i => {
                if (i.aspect === 'fanart') {
                  fanart_temp.push(i);
                } else if (i.aspect === undefined) {
                  fanart_temp.push(i);
                }
              });
            } else {
              fanart_temp.push(fanart.fanart.thumb);
            }

            // console.log(fanart_temp);
            row.c20 = fanart_temp[0].preview;
          }
        });

        if (Object.keys(movies).length === 0) {
          console.log('No data found');
        } else {
          console.log(movies);
          let data = JSON.stringify(movies);
          fs.writeFileSync('movies-data.json', data);
        }
      }
    });
  }
  db_close();
};

// test_db({
//   name: 'star',
//   limit: 10,
// });

test_db({
    all: true
})