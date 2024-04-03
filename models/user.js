
const db_admin = require('../config/db');
const bcrypt = require('bcrypt');
const queries = require('../config/queries');

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
                if (result.length > 0) {
                    resolve(result[0]);
                } else {
                    resolve(null);
                }
            }
            );
        });
    }

    static authenticate(email, password) {
        return new Promise((resolve, reject) => {
            User.getUserByEmail(email).then((user) => {
                if (user) {
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
                } else {
                    resolve(null);
                }
            }).catch((err) => {
                reject(err);
            });
        });
    };

    static validateSecurityQuestion(email, answer) {
        return new Promise((resolve, reject) => {
            User.getUserByEmail(email).then((user) => {
                if (user) {
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
                } else {
                    resolve(null);
                }
            }).catch((err) => {
                reject(err);
            });
        });
    }

    static checkUserRole(id) {
        return new Promise((resolve, reject) => {
            db_admin.query(queries.getUserInfoByUserId, [id], (err, result) => {
                if (err) reject(err);
                if (result.length > 0) {
                    resolve(result[0].isAdmin)
                } else {
                    resolve(false);
                }
            });
        });
    }

    static getUserInfo(id) {
        return new Promise((resolve, reject) => {
            db_admin.query(queries.getUserInfoByUserId, [id], (err, result) => {
                if (err) reject(err);
                if (result.length > 0) {
                    resolve(result[0]);
                } else {
                    resolve(null);
                }
            });
        })
    }

    static addUsage(verbId, endpointId, userId = null) {
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
}

module.exports = User;