import Promise from 'bluebird';
import {pick, includes, isEqual} from 'lodash';

class UserService {
  constructor($http, API) {
    this.$http = $http;
    this.API = API.PREFERENCES.USER;
  }

  /*
  * @return {object} data and schema
  *   {array} data
  *   {object} schema
  */
  async getAll() {
    try {
      const resp = await this.$http.get(this.API.GETALL);
      if (resp.status >= 400) {
        throw new Error(resp.data.message || resp.data.error);
      }

      return resp.data.data;
    } catch (err) {
      throw new Error(`fail to get all users: ${err.message}`);
    }
  }

  /*
  * Update/delete multiple users in DB
  *
  * @param {array} data to store
  * @return {object} API confirm
  */
  async batchUpdate(data) {
    try {
      const editor = {
        users: data,
        guids: this._getGuids(data),
      };

      const resp = await this.getAll();

      const db = {
        users: resp.data,
        guids: this._getGuids(resp.data),
      };

      await this._batchDeleteUsers(db.users, editor.guids);
      await this._batchUpdateUsers(editor.users, db.users);
      await this._batchAddUsers(editor.users, db.guids);
    } catch (err) {
      throw new Error(`fail to store users: ${err.message}`);
    }
  }

  async _batchDeleteUsers(dbUsers, editorGuids) {
    try {
      await Promise.each(dbUsers, async (user) => {
        if (this._userDeleted(user.guid, editorGuids)) {
          const resp = await this.delete(user.guid);
          if (resp.status >= 400) {
            throw new Error(resp.data.message || resp.data.error);
          }
        }
      });
    } catch (err) {
      throw new Error(`fail to delete users: ${err.message}`);
    }
  }

  async _batchAddUsers(editorUsers, dbGuids) {
    try {
      await Promise.each(editorUsers, async (user) => {
        if (this._userAdded(user.guid, dbGuids)) {
          const data = pick(user, ['firstname', 'lastname', 'username', 'email', 'password', 'partid', 'usergroup', 'department']);
          const resp = await this.add(data);
          if (resp.status >= 400) {
            throw new Error(resp.data.message || resp.data.error);
          }
        }
      });
    } catch (err) {
      throw new Error(`fail to add users: ${err.message}`);
    }
  }

  async _batchUpdateUsers(editorUsers, dbUsers) {
    try {
      await Promise.each(editorUsers, async (user) => {
        if (this._userUpdated(user, dbUsers)) {
          const data = pick(user, ['guid', 'firstname', 'lastname', 'username', 'email', 'password', 'partid', 'usergroup', 'department']);
          const resp = await this.update(data);
          if (resp.status >= 400) {
            throw new Error(resp.data.message || resp.data.error);
          }
        }
      });
    } catch (err) {
      throw new Error(`fail to update users: ${err.message}`);
    }
  }

  _getGuids(arr) {
    let guids = [];
    arr.forEach((user) => {
      guids.push(user.guid);
    });
    return guids;
  }

  _userDeleted(guid, editorGuids) {
    return includes(editorGuids, guid) ? false : true;
  }

  _passwordUpdated(password) {
    return password && password.length;
  }

  _userUpdated(user, dbUsers) {
    const userToUpdate = dbUsers.filter((u) => u.guid === user.guid)[0];
    if (!userToUpdate) {
      return false;
    }

    if (this._passwordUpdated(user.password)) {
      return true;
    }

    delete user.password;
    delete userToUpdate.password;
    if (!isEqual(userToUpdate, user)) {
      return true;
    }

    return false;
  }

  _userAdded(guid, dbGuids) {
    return !guid || !includes(dbGuids, guid) ? true : false;
  }

  /*
  * @return {object} API confirm
  */
  async add({firstname, lastname, username, email, password, partid, usergroup, department}) {
    try {
      const user = {firstname, lastname, username, email, password, partid, usergroup, department};
      const resp = await this.$http.post(this.API.ADD, user);
      if (resp.status >= 400) {
        throw new Error(resp.data.message || resp.data.error);
      }
    
      return resp;
    } catch (err) {
      throw new Error(`fail to add user: ${err.message}`);
    }
  }

  /*
  * @return {object} API confirm
  */
  async update({guid, firstname, lastname, username, email, password, partid, usergroup, department}) {
    try {
      const user = {firstname, lastname, username, email, password, partid, usergroup, department};
      const resp = await this.$http.put([this.API.UPDATE, guid].join('/'), user);
      if (resp.status >= 400) {
        throw new Error(resp.data.message || resp.data.error);
      }
    
      return resp;
    } catch (err) {
      throw new Error(`fail to update user: ${err.message}`);
    }
  }

  /*
  * @return {object} API confirm
  */
  async delete(guid) {
    try {
      const resp = await this.$http.delete([this.API.DELETE, guid].join('/'));
      if (resp.status >= 400) {
        throw new Error(resp.data.message || resp.data.error);
      }
    
      return resp;
    } catch (err) {
      throw new Error(`fail to delete user: ${err.message}`);
    }
  }
}

export default UserService;
