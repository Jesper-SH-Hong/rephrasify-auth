const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const VERB = require('./enums/verbEnum');
const ENDPOINT = require('./enums/endpointEnum');
const db_admin = require('./config/db');
const User = require('./models/user');
const queries = require('./config/queries');
const hashPassword = require('./utils/hashPassword');
const ERROR = require('./enums/errorEnum');
const MESSAGES = require('./lang/messages/en/user');
const cors = require('cors');
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

app.post('/register', async (req, res) => {
  try {
    User.addUsage(VERB.POST, ENDPOINT.REGISTER);
  } catch (err) {
    console.error(err);
  }
  
  db_admin.query(queries.getUserByEmail, [req.body.email], async (err, result) => {
    if (err) {
      console.error(err);
      res.status(ERROR.INTERNAL_SERVER_ERROR).send(MESSAGES.INTERNAL_SERVER_ERROR);
    }
    if (result.length > 0) {
      res.status(ERROR.CONFLICT).send(MESSAGES.USER_EXISTS);
    } else {
      const { email, password, questionId, answer } = req.body;
      const hashedPassword = await hashPassword(password);
      const hashedAnswer = await hashPassword(answer);
      const user = new User(email, hashedPassword, questionId, hashedAnswer);
      user.register()
        .then(result => {
          const token = jwt.sign({ userId: result.id }, process.env.SECRET_KEY, { expiresIn: '1h' });
          res.cookie('token', token, { httpOnly: true });
          res.status(ERROR.SUCCESS).json(result);
        })
        .catch((err) => {
          console.error(err);
          res.status(ERROR.INTERNAL_SERVER_ERROR).send(MESSAGES.INTERNAL_SERVER_ERROR);
        });
    }
  });
});

app.get('/getSecurityQuestions', async (req, res) => {
  try {
    User.addUsage(VERB.GET, ENDPOINT.GET_SECURITY_QUESTIONS);
  } catch (err) {
    console.error(err);
  }

  db_admin.query(queries.getSecurityQuestions, (err, result) => {
    if (err) {
      console.error(err);
      res.status(ERROR.INTERNAL_SERVER_ERROR).send(MESSAGES.INTERNAL_SERVER_ERROR);
    }
    const response = {questions: JSON.parse(JSON.stringify(result))};
    res.status(ERROR.SUCCESS).send(response);
  });
});

app.post('/login', async (req, res) => {
  try {
    User.addUsage(VERB.POST, ENDPOINT.LOGIN);
  } catch (err) {
    console.error(err);
  }

  const { email, password } = req.body;
  User.authenticate(email, password)
    .then((user) => {
      if (user) {
        const token = jwt.sign({ userId: user.id }, process.env.SECRET_KEY, { expiresIn: '1h' });
        res.cookie('token', token, { httpOnly: true });
        res.status(ERROR.SUCCESS).json(user);
      } else {
        res.status(ERROR.UNAUTHORIZED).send(MESSAGES.INVALID_CREDENTIALS);
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(ERROR.INTERNAL_SERVER_ERROR).send(MESSAGES.INTERNAL_SERVER_ERROR);
    });
});

app.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.status(ERROR.SUCCESS).send(MESSAGES.LOGOUT);
}
);

app.put('/updateRole', async (req, res) => {
  try {
    User.addUsage(VERB.PUT, ENDPOINT.UPDATE_ROLE, req.body.adminId);
  } catch (err) {
    console.error(err);
  }

  const admin = await User.checkUserRole(req.body.adminId);
  if (!admin) {
    res.status(ERROR.FORBIDDEN).send(MESSAGES.ADMIN_ONLY);
  } else {
    const values = [req.body.isAdmin, req.body.userId];
    db_admin.query(queries.updateRole, values, (err, result) => {
      if (err) {
        console.error(err);
        res.status(ERROR.INTERNAL_SERVER_ERROR).send(MESSAGES.INTERNAL_SERVER_ERROR);
      }
      res.status(ERROR.SUCCESS).send(MESSAGES.ROLE_UPDATED);
    });
  }
});

app.delete('/deleteUser', async (req, res) => {
  try {
    User.addUsage(VERB.DELETE, ENDPOINT.DELETE_USER, req.body.adminId);
  } catch (err) {
    console.error(err);
  }

  const admin = await User.checkUserRole(req.body.adminId);
  if (!admin) {
    res.status(ERROR.FORBIDDEN).send(MESSAGES.ADMIN_ONLY);
  } else {
    db_admin.query(queries.deleteUser, req.body.userId, (err, result) => {
      if (err) {
        console.error(err);
        res.status(ERROR.INTERNAL_SERVER_ERROR).send(MESSAGES.INTERNAL_SERVER_ERROR);
      }
      res.status(ERROR.SUCCESS).send(MESSAGES.USER_DELETED);
    });
  }
});

app.get('/getAllUsers', async (req, res) => {
  try {
    User.addUsage(VERB.GET, ENDPOINT.GET_ALL_USERS, req.query.adminId);
  } catch (err) {
    console.error(err);
  }

  const admin = await User.checkUserRole(req.query.adminId);
  if (!admin) {
    res.status(ERROR.FORBIDDEN).send(MESSAGES.ADMIN_ONLY);
  } else {
    db_admin.query(queries.getUsersInfo, (err, result) => {
      if (err) {
        console.error(err);
        res.status(ERROR.INTERNAL_SERVER_ERROR).send(MESSAGES.INTERNAL_SERVER_ERROR);
      }
      const response = {users: JSON.parse(JSON.stringify(result))};
      res.status(ERROR.SUCCESS).send(response);
    });
  }
});

app.get('/getAllUsages', async (req, res) => {
  try {
    User.addUsage(VERB.GET, ENDPOINT.GET_ALL_USERS, req.query.adminId);
  } catch (err) {
    console.error(err);
  }

  const admin = await User.checkUserRole(req.query.adminId);
  if (!admin) {
    res.status(ERROR.FORBIDDEN).send(MESSAGES.ADMIN_ONLY);
  } else {
    db_admin.query(queries.getAllUsages, (err, result) => {
      if (err) {
        console.error(err);
        res.status(ERROR.INTERNAL_SERVER_ERROR).send(MESSAGES.INTERNAL_SERVER_ERROR);
      }
      const response = {data: JSON.parse(JSON.stringify(result))};
      res.status(ERROR.SUCCESS).send(response);
    });
  }
});

app.get('/getUserSecurityQuestion', async (req, res) => {
  try {
    User.addUsage(VERB.GET, ENDPOINT.GET_USER_SECURITY_QUESTIONS);
  } catch (err) {
    console.error(err);
  }

  db_admin.query(queries.getUserSecurityQuestion, req.query.email, (err, result) => {
    if (err) {
      console.error(err);
      res.status(ERROR.INTERNAL_SERVER_ERROR).send(MESSAGES.INTERNAL_SERVER_ERROR);
    }
    if (result.length > 0) {
      res.status(ERROR.SUCCESS).json(result[0]);
    } else {
      res.status(ERROR.NOT_FOUND).send(MESSAGES.USER_NOT_FOUND);
    }
  });
});

app.post('/answerSecurityQuestion', async (req, res) => {
  try {
    User.addUsage(VERB.POST, ENDPOINT.ANSWER_SECURITY_QUESTION);
  } catch (err) {
    console.error(err);
  }

  User.validateSecurityQuestion(req.body.email, req.body.answer)
    .then((user) => {
      if (user) {
        res.status(ERROR.SUCCESS).json({ isValid: true });
      } else {
        res.status(ERROR.SUCCESS).json({ isValid: false });
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(ERROR.INTERNAL_SERVER_ERROR).send(MESSAGES.INTERNAL_SERVER_ERROR);
    });
});

app.put('/changePassword', async (req, res) => {
  try {
    User.addUsage(VERB.PUT, ENDPOINT.CHANGE_PASSWORD);
  } catch (err) {
    console.error(err);
  }
  
  const hashedPassword = await hashPassword(req.body.password);
  const values = [hashedPassword, req.body.email];
  db_admin.query(queries.changePassword, values, (err, result) => {
    if (err) {
      console.error(err);
      res.status(ERROR.INTERNAL_SERVER_ERROR).send(MESSAGES.INTERNAL_SERVER_ERROR);
    }
    db_admin.query(queries.getUserInfoByEmail, [req.body.email], (err, result) => {
      if (err) {
        console.error(err);
        res.status(ERROR.INTERNAL_SERVER_ERROR).send(MESSAGES.INTERNAL_SERVER_ERROR);
      }
      res.status(ERROR.SUCCESS).json(result[0]);
    });
  });
});

// Start server
app.listen(port, () => {
  console.log(`User Authentication service is running on port ${port}`);
});
