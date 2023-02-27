


import * as crypto from 'crypto';
import * as fs from 'fs';
import * as jwt from 'jsonwebtoken';
const encryptKey = process.env.ENCRYPT_KEY
class Utils {

    validateEmail(email){
        const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(email).toLowerCase());
    }

    encryptPassword(password){
        return crypto.createHash('sha256').update(`${encryptKey}${password}`).digest('hex');
    }

    signToken(data, expire = process.env.jwt_expire){
      const cert = fs.readFileSync(`${process.cwd()}/cert/private.key`);
      const access_token = jwt.sign(data, cert, { expiresIn: expire, algorithm: 'RS512' });
        return access_token
    }

}

module.exports = Utils
