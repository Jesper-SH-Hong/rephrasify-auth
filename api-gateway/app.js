const http = require("http");
const url = require("url");
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
      let message = "THIS IS API-GATEWAY APP\n";
      let version = "NodeJS " + process.versions.node + "\n";
      let response = [message, version].join("\n");
      res.end(response);
    });

    server.listen(this.port);
  }
}

const server = new Server();
server.start();
