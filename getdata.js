var fs = require('fs');
var SQL = require('sql.js');

const dbFileName = require('./dbconfig');

// SQL().then(SQL => {
//   // Create a database
//   var db = new SQL.Database(filebuffer);

//   var res = db.exec(`select idMovie, c00, c08, c20 from movie where c00 like '%star%' order by idMovie desc limit 2`);
//   res = _rowsFromSqlDataObject(res[0]);
//   // console.log(res[0].values[0][3]);
//   console.log(res[0]);
//   console.log(typeof res[0]);

//   db.close();
// });

/*
  SQL.js returns a compact object listing the columns separately from the
  values or rows of data. This function joins the column names and
  values into a single objects and collects these together by row id.
  {
    0: {first_name: "Jango", last_name: "Reinhardt", person_id: 1},
    1: {first_name: "Svend", last_name: "Asmussen", person_id: 2},
  }
  This format makes updating the markup easy when the DOM input id attribute
  is the same as the column name. See view.showPeople() for an example.
*/
let _rowsFromSqlDataObject = function(object) {
  let data = {};
  let i = 0;
  let j = 0;
  for (let valueArray of object.values) {
    data[i] = {};
    j = 0;
    for (let column of object.columns) {
      Object.assign(data[i], { [column]: valueArray[j] });
      j++;
    }
    i++;
  }
  return data;
};

let _rowsFromSqlDataArray = function(object) {
  let data = [];
  let i = 0;
  let j = 0;
  for (let valueArray of object.values) {
    data[i] = {};
    j = 0;
    for (let column of object.columns) {
      Object.assign(data[i], { [column]: valueArray[j] });
      j++;
    }
    i++;
  }
  return data;
};

const sqlFilterXml2Json = movies => {
  // movies.c08, c20 is the type of xml
  // movies is array
  // if movies is object, below is error
  const parser = require('xml2json-light');

  movies.forEach(row => {
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
    // console.log('return movies');
    return movies;
  }
};

const findAll = (stmt, callback) => {
  SQL().then(SQL => {
    SQL.dbOpen = function(databaseFileName) {
      try {
        return new SQL.Database(fs.readFileSync(databaseFileName));
      } catch (error) {
        console.log("Can't open database file.", error.message);
        return null;
      }
    };

    // SQL.dbClose = function(databaseHandle, databaseFileName) {
    //   try {
    //     let data = databaseHandle.export();
    //     let buffer = Buffer.alloc(data.length, data);
    //     fs.writeFileSync(databaseFileName, buffer);
    //     databaseHandle.close();
    //     return true;
    //   } catch (error) {
    //     console.log("Can't close database file.", error);
    //     return null;
    //   }
    // };

    let db = SQL.dbOpen(dbFileName);
    var res = db.exec(stmt);

    res = _rowsFromSqlDataArray(res[0]);
    res = sqlFilterXml2Json(res);
    callback(res);
    db.close();
  });
};

const getData = query => {
  var stmt = `select idMovie, c00, c01, c03, c08, c16, c19, c20, premiered, strPath,rating, uniqueid_value from movie_view where c00 like '%${query}%' order by idMovie desc limit 2`;
  console.log(stmt);
  return new Promise((resolve) => {
    findAll(stmt, res => resolve(res));
  });
};

module.exports = getData;
