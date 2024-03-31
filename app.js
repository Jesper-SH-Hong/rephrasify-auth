const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const mysql = require('mysql');
const bcrypt = require('bcrypt');
const VERB = require('./modules/verbEnum');
const ENDPOINT = require('./modules/endpointEnum');
require("dotenv").config();

console.log(VERB.GET);
console.log(ENDPOINT.REGISTER);

const QUESTION_TABLE = 'security_question';
const USER_TABLE = 'user';
const VERB_TABLE = 'verb';
const VERB_CONSUMPTION_TABLE = 'verb_consumption';
const ENDPOINT_TABLE = 'api_endpoint';

queries = {
  getSecurityQuestions: `SELECT * FROM ${QUESTION_TABLE}`,
  getUserSecurityQuestion: `SELECT q.question FROM ${USER_TABLE} u JOIN ${QUESTION_TABLE} q ON u.questionID = q.id WHERE email = ?`,
  getUser: `SELECT * FROM ${USER_TABLE} WHERE email = ? AND password = ?`,
  answerSecurityQuestion: `SELECT * FROM ${USER_TABLE} WHERE email = ? AND answer = ?`,
  changePassword: `UPDATE ${USER_TABLE} SET password = ? WHERE email = ?`,
  deleteUser: `DELETE FROM ${USER_TABLE} WHERE id = ?`,
  updateRole: `UPDATE ${USER_TABLE} SET isAdmin = ? WHERE id = ?`,
  getUsersInfo: `SELECT u.id, u.email, u.isAdmin, COUNT(vc.verbID) AS apiCount FROM ${USER_TABLE} u LEFT JOIN ${VERB_CONSUMPTION_TABLE} vc ON u.id = vc.userID GROUP BY u.id, u.email, u.isAdmin`,
  getUserInfoByEmail: `SELECT u.id, u.email, u.isAdmin, COUNT(vc.verbID) AS apiCount FROM ${USER_TABLE} u LEFT JOIN ${VERB_CONSUMPTION_TABLE} vc ON u.id = vc.userID WHERE u.email = ? GROUP BY u.id, u.email, u.isAdmin`,
  getUserInfoByUserId: `SELECT u.id, u.email, u.isAdmin, COUNT(vc.verbID) AS apiCount FROM ${USER_TABLE} u LEFT JOIN ${VERB_CONSUMPTION_TABLE} vc ON u.id = vc.userID WHERE u.id = ? GROUP BY u.id, u.email, u.isAdmin`,
  createUser: `INSERT INTO ${USER_TABLE} (email, password, questionID, answer, isAdmin) VALUES (?, ?, ?, ?, ?)`,
  getUserByEmail: `SELECT * FROM ${USER_TABLE} WHERE email = ?`,
  getAllUsages: `SELECT v.verb, e.endpoint, COUNT(vc.verbID) AS usageCount FROM ${VERB_CONSUMPTION_TABLE} vc JOIN ${VERB_TABLE} v ON vc.verbID = v.id JOIN ${ENDPOINT_TABLE} e ON vc.endpointID = e.id GROUP BY e.endpoint, v.verb`,
  addUsageWithUserId: `INSERT INTO ${VERB_CONSUMPTION_TABLE} (userID, verbID, endpointID) VALUES (?, ?, ?)`,
  addUsageWithoutUserId: `INSERT INTO ${VERB_CONSUMPTION_TABLE} (verbID, endpointID) VALUES (?, ?)`,
};


const app = express();
const port = process.env.PORT || 3000;

// Body parser middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const db_admin = mysql.createConnection({
  // host: process.env.DB_HOST,
  // user: process.env.DB_USER,
  // password: process.env.DB_PASSWORD,
  // database: process.env.DB_NAME
  host: process.env.DB_LOCAL_HOST,
  user: process.env.DB_LOCAL_USER,
  password: process.env.DB_LOCAL_PASSWORD,
  database: process.env.DB_LOCAL_NAME
});

class User {
  constructor(email, password, questionid, answer) {
    this.email = email;
    this.password = password;
    this.questionId = questionid;
    this.answer = answer;
  }

  register() {
    const values = [this.email, this.password, this.questionId, this.answer, 0];
    return new Promise((resolve, reject) => {
      db_admin.query(queries.createUser, values, (err, result) => {
        if (err) reject(err);
        db_admin.query(queries.getUserInfoByEmail, [this.email], (err, result) => {
          if (err) reject(err);
          resolve(result[0]);
        });
      });
    });
  }

  static getUserByEmail(email) {
    return new Promise((resolve, reject) => {
      db_admin.query(queries.getUserByEmail, [email], (err, result) => {
        if (err) reject(err);
        resolve(result[0]);
      }
      );
    });
  }

  static authenticate(email, password) {
    return new Promise((resolve, reject) => {
      User.getUserByEmail(email).then((user) => {
        bcrypt.compare(password, user.password, (err, res) => {
          if (err) reject(err);
          if (res) {
            db_admin.query(queries.getUserInfoByEmail, [email], (err, result) => {
              if (err) reject(err);
              resolve(result[0]);
            });
          } else {
            resolve(null);
          }
        });
      }).catch((err) => {
        reject(err);
      });
    });
  };

  static validateSecurityQuestion(email, answer) {
    return new Promise((resolve, reject) => {
      User.getUserByEmail(email).then((user) => {
        bcrypt.compare(answer, user.answer, (err, res) => {
          if (err) reject(err);
          if (res) {
            db_admin.query(queries.getUserInfoByEmail, [email], (err, result) => {
              if (err) reject(err);
              resolve(result[0]);
            });
          } else {
            resolve(null);
          }
        });
      }).catch((err) => {
        reject(err);
      });
    });
  }

  static checkUserRole(id) {
    return new Promise((resolve, reject) => {
      db_admin.query(queries.getUserInfoByUserId, [id], (err, result) => {
        if (err) reject(err);
        console.log(result);
        resolve(result[0].isAdmin)
      });
    });
  }
}

app.post('/register', async (req, res) => {
  try {
    addUsage(VERB.POST, ENDPOINT.REGISTER);
  } catch (err) {
    console.error(err);
  }
  
  db_admin.query(queries.getUserByEmail, [req.body.email], async (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).send('Internal server error');
    }
    if (result.length > 0) {
      res.status(400).json({ errorMsg: 'User already exists' });
    } else {
      const { email, password, questionId, answer } = req.body;
      const hashedPassword = await hashPassword(password);
      const hashedAnswer = await hashPassword(answer);
      const user = new User(email, hashedPassword, questionId, hashedAnswer);
      user.register()
        .then(result => {
          const token = jwt.sign({ userId: result.id }, process.env.SECRET_KEY, { expiresIn: '1h' });
          console.log(token);
          res.cookie('token', token, { httpOnly: true });
          res.status(200).json(result);
        })
        .catch((err) => {
          console.error(err);
          res.status(500).send('Internal server error');
        });
    }
  });
});

app.get('/getSecurityQuestions', async (req, res) => {
  try {
    addUsage(VERB.GET, ENDPOINT.GET_SECURITY_QUESTIONS);
  } catch (err) {
    console.error(err);
  }

  db_admin.query(queries.getSecurityQuestions, (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).send('Internal server error');
    }
    const response = {questions: JSON.parse(JSON.stringify(result))};
    res.status(200).send(response);
  });
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  User.authenticate(email, password)
    .then((user) => {
      if (user) {
        const token = jwt.sign({ userId: user.id }, process.env.SECRET_KEY, { expiresIn: '1h' });
        console.log(token);
        res.cookie('token', token, { httpOnly: true });
        res.status(200).json(user);
      } else {
        res.status(401).json({ errorMsg: 'Invalid credentials' });
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Internal server error');
    });
});

app.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.status(200).send('Logged out successfully');
}
);

app.put('/updateRole', async (req, res) => {
  const admin = await User.checkUserRole(req.body.adminId);
  if (!admin) {
    res.status(409).send('Must be an admin to access this endpoint');
  } else {
    const values = [req.body.isAdmin, req.body.userId];
    db_admin.query(queries.updateRole, values, (err, result) => {
      if (err) {
        console.error(err);
        res.status(500).send('Internal server error');
      }
      res.status(200).json({ message: 'Role updated successfully' });
    });
  }
});

app.delete('/deleteUser', async (req, res) => {
  const admin = await User.checkUserRole(req.body.adminId);
  if (!admin) {
    res.status(409).send('Must be an admin to access this endpoint');
  } else {
    db_admin.query(queries.deleteUser, req.body.userId, (err, result) => {
      if (err) {
        console.error(err);
        res.status(500).send('Internal server error');
      }
      res.status(200).json({ message: 'User deleted successfully' });
    });
  }
});

app.get('/getAllUsers', async (req, res) => {
  const admin = await User.checkUserRole(req.query.adminId);
  if (!admin) {
    res.status(409).send('Must be an admin to access this endpoint');
  } else {
    db_admin.query(queries.getUsersInfo, (err, result) => {
      if (err) {
        console.error(err);
        res.status(500).send('Internal server error');
      }
      const response = {users: JSON.parse(JSON.stringify(result))};
      res.status(200).send(response);
    });
  }
});

app.get('/getAllUsages', async (req, res) => {
  const admin = await User.checkUserRole(req.query.adminId);
  if (!admin) {
    res.status(409).send('Must be an admin to access this endpoint');
  } else {
    db_admin.query(queries.getAllUsages, (err, result) => {
      if (err) {
        console.error(err);
        res.status(500).send('Internal server error');
      }
      const response = {data: JSON.parse(JSON.stringify(result))};
      res.status(200).send(response);
    });
  }
});

app.get('/getUserSecurityQuestion', async (req, res) => {
  db_admin.query(queries.getUserSecurityQuestion, req.query.email, (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).send('Internal server error');
    }
    res.status(200).json(result[0]);
  });
});

app.post('/answerSecurityQuestion', async (req, res) => {
  User.validateSecurityQuestion(req.body.email, req.body.answer)
    .then((user) => {
      if (user) {
        res.status(200).json({ isValid: true });
      } else {
        res.status(200).json({ isValid: false });
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Internal server error');
    });
});

app.put('/changePassword', async (req, res) => {
  const hashedPassword = await hashPassword(req.body.password);
  const values = [hashedPassword, req.body.email];
  db_admin.query(queries.changePassword, values, (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).send('Internal server error');
    }
    db_admin.query(queries.getUserInfoByEmail, [req.body.email], (err, result) => {
      if (err) {
        console.error(err);
        res.status(500).send('Internal server error');
      }
      res.status(200).json(result[0]);
    });
  });
});

async function hashPassword(password) {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

function addUsage(verbId, endpointId, userId=null) {
  return new Promise((resolve, reject) => {
    if (userId) {
      db_admin.query(queries.addUsageWithUserId, [userId, verbId, endpointId], (err, result) => {
        if (err) reject(err);
        resolve();
      });
    } else {
      db_admin.query(queries.addUsageWithoutUserId, [verbId, endpointId], (err, result) => {
        if (err) reject(err);
        resolve();
      });
    }
  });
}

// Start server
app.listen(port, () => {
  console.log(`User Authentication service is running on port ${port}`);
});
