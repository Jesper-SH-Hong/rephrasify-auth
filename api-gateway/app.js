const http = require("http");
const url = require("url");

// const STATUS = {
//   OK: 200,
//   BAD_REQUEST: 400,
//   NOT_FOUND: 404,
// };

const mysql = require("mysql");
const db_admin = mysql.createConnection({
  host: "localhost",
  user: "jesperho_u3_admin",
  password: "u3_admin",
  database: "jesperho_u3mysql",
});

class Server {
  constructor() {
    this.port = process.env.PORT || 3000;
    this.db_admin = db_admin;

    this.db_admin.connect(function (err) {
      if (err) throw err;
      console.log("db admin Connected!");
    });
  }

  start() {
    const server = http.createServer((req, res) => {
      const q = url.parse(req.url, true);

      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

      res.writeHead(200, { "Content-Type": "text/plain" });
      let message = "It works! JESPER CUSTOM MESSAGE\n";
      let version = "NodeJS " + process.versions.node + "\n";
      let response = [message, version].join("\n");
      res.end(response);

        // if (q.pathname == `${lab5Path}/post`) {
        //   console.log("Recieved POST request");
        //   // handle preflight request for POST
        //   if (req.headers["access-control-request-method"]) {
        //     res.setHeader("Access-Control-Allow-Methods", "POST");
        //     res.end();
        //   } else {
        //     let body = "";
        //     req.on("data", (chunk) => {
        //       body += chunk;
        //     });
        //     req.on("end", () => {
        //       console.log(`server recieved post request body: ${body}`);
        //       this.db_admin.query(body, (err, result) => {
        //         if (err) {
        //           const errorMessage = err.message || "Internal Server Error";
        //           const errorResponse = {
        //             status: "error",
        //             message: errorMessage,
        //           };
        //           res.writeHead(500, { "Content-Type": "application/json" });
        //           res.write(JSON.stringify(errorResponse));
        //           res.end();
        //         } else {
        //           res.writeHead(STATUS.OK);
        //           res.end(JSON.stringify({ status: "success", data: result }));
        //         }
        //       });
        //     });
        //   }
        // }
    });

    // close db_admin connection when server is closed
    // server.on("close", () => {
    //   this.db_admin.end((err) => {
    //     if (err) throw err;
    //     console.log("DB Connection closed.");
    //   });
    // });

    server.listen(this.port);
  }
}

const server = new Server();
server.start();
