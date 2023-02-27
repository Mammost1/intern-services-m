import * as crypto from 'crypto';
import * as fs from 'fs';
import * as jwt from 'jsonwebtoken';
import {config} from '@internship/config'

const encryptKey = process.env.ENCRYPT_KEY
export function authorization(): string {
  return 'authorization';
}

export function validateEmail(email) {
  const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}

export function encryptPassword(password) {
  return crypto.createHash('sha256').update(`${encryptKey}${password}`).digest('hex');
}


export function signToken(data, expire = config.jwt_expire) {
  const cert = fs.readFileSync(`${process.cwd()}/cert/private.key`);
  const access_token = jwt.sign(data, cert, { expiresIn: expire, algorithm: 'RS512' });
  return access_token
}
export function signTokenrefresh(data, expire = config.jwt_expire_refresh) {
  const cert = fs.readFileSync(`${process.cwd()}/cert/privatetokenrefresh.key`);
  const access_token = jwt.sign(data, cert, { expiresIn: expire, algorithm: 'RS512' });
  return access_token
}

export function checkTokenrefresh(data, expire = config.jwt_expire) {
  const cert = fs.readFileSync(`${process.cwd()}/cert/PUBLICREFRESH.key`);
  const access_token = jwt.sign(data, cert, { expiresIn: expire, algorithm: 'RS512' });
  return access_token
}


export function verifyJWT(req, res, next){
  try {
      req.headers['authorization'] = req.headers['authorization'] || ""
      const token = req.headers['authorization'].replace(/Bearer /, "")
      // console.log('token', token)
      const cert = fs.readFileSync(`${process.cwd()}/cert/public.key`);
      const decoded = jwt.verify(token, cert);

      // add request data
      req.authen = decoded

      next()
  }catch(err){
      res.status(400).json({
          message: err.message
      })
  }
}
