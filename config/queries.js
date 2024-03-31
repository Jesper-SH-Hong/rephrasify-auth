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

module.exports = queries;