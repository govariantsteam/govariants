import { getDb } from "./db";
import { UserResponse } from "@ogfcommunity/variants-shared";
import { Collection, WithId, ObjectId, UpdateResult } from "mongodb";
import { randomBytes, scrypt } from "node:crypto";

export interface GuestUser extends UserResponse {
  token: string;
  login_type: "guest";
  rating?: number;
}

// Not currently used, but the plan is to use LocalStrategy from Password.js
// eventually, so I want to make sure this type is considered from the start
export interface PersistentUser extends UserResponse {
  username: string;
  password_hash: string;
  login_type: "persistent";
  rating?: number;
}

export async function updateUserRating(
  user_id: string,
  new_rating: number,
): Promise<UpdateResult<GuestUser | PersistentUser>> {
  return usersCollection().updateOne(
    { _id: new ObjectId(user_id) },
    { $set: { rating: new_rating } },
  );
}

function usersCollection(): Collection<GuestUser | PersistentUser> {
  return getDb().db().collection<GuestUser | PersistentUser>("users");
}

export async function getUserByName(username: string): Promise<PersistentUser> {
  const db_user = (await usersCollection().findOne({
    username: { $eq: username },
  })) as WithId<PersistentUser>;

  if (!db_user) {
    return undefined;
  }

  return {
    id: db_user._id.toString(),
    username: db_user.username,
    password_hash: db_user.password_hash,
    login_type: db_user.login_type,
  };
}

export async function getUserByUserID(
  user_id: string,
): Promise<PersistentUser> {
  const db_user = (await usersCollection().findOne({
    _id: { $eq: new ObjectId(user_id) },
  })) as WithId<PersistentUser>;

  if (!db_user) {
    return undefined;
  }

  return {
    username: db_user.username,
    password_hash: db_user.password_hash,
    login_type: db_user.login_type,
    rating: db_user.rating,
  };
}

export async function getUserBySessionId(
  session_id: string,
): Promise<GuestUser | undefined> {
  const db_user = (await usersCollection().findOne({
    token: { $eq: session_id },
  })) as WithId<GuestUser>;

  if (!db_user) {
    return undefined;
  }

  return {
    id: db_user._id.toString(),
    token: db_user.token,
    login_type: db_user.login_type,
  };
}

function hashPassword(password: string): Promise<string> {
  const N = 16384; // cost; power of 2
  const r = 8; // blockSize
  const p = 1; // parallelization
  const saltLength = 16; // in bytes
  const keyLength = 64; // in bytes

  return new Promise((resolve, reject) => {
    randomBytes(saltLength, (error, saltBuffer) => {
      if (error) reject(error);
      const saltString = saltBuffer.toString("base64");
      scrypt(
        password,
        saltBuffer,
        keyLength,
        { N, r, p },
        (error, derivedKey) => {
          if (error) reject(error);
          const keyString = derivedKey.toString("base64");
          resolve(`s$N${N}$r${r}$p${p}$${saltString}$${keyString}`);
        },
      );
    });
  });
}

function comparePassword(
  password: string,
  passwordHash: string,
): Promise<boolean> {
  const regex =
    /^s\$N(\d+)\$r(\d+)\$p(\d+)\$([a-zA-Z0-9+/]+=?=?)\$([a-zA-Z0-9+/]+)(=?=?)$/;
  const [match, NStr, rStr, pStr, saltString, keyString, keyPadding] =
    passwordHash.match(regex);

  const [N, r, p] = [Number(NStr), Number(rStr), Number(pStr)];
  const saltBuffer = Buffer.from(saltString, "base64");
  const keyLength = Math.floor(keyString.length * 0.75);

  return new Promise((resolve, reject) => {
    if (!match) reject("Unexpected password hash");
    scrypt(
      password,
      saltBuffer,
      keyLength,
      { N, r, p },
      (error, derivedKey) => {
        if (error) reject(error);
        resolve(keyString + keyPadding === derivedKey.toString("base64"));
      },
    );
  });
}

export async function createUserWithUsernameAndPassword(
  username: string,
  password: string,
): Promise<UserResponse> {
  const password_hash = await hashPassword(password);

  const user: PersistentUser = {
    username,
    password_hash,
    login_type: "persistent",
  };

  const result = await usersCollection().insertOne(user);
  return { id: result.insertedId.toString(), login_type: "persistent" };
}

export async function authenticateUser(
  username: string,
  password: string,
): Promise<UserResponse | null> {
  const result = await getUserByName(username);

  if (!result) throw new Error("user not found");

  if (await comparePassword(password, result.password_hash)) {
    return { id: result.id.toString(), login_type: "persistent" };
  }

  throw new Error("invalid password");
}

export async function createUserWithSessionId(id: string): Promise<GuestUser> {
  const result = await usersCollection().insertOne({
    token: id,
    login_type: "guest",
  });
  return { id: result.insertedId.toString(), token: id, login_type: "guest" };
}

export async function getUser(id: string): Promise<UserResponse> {
  const db_user = await usersCollection().findOne({
    _id: new ObjectId(id),
  });

  if (!db_user) {
    return undefined;
  }

  return outwardFacingUser(db_user);
}

function outwardFacingUser(
  db_user: WithId<GuestUser | PersistentUser>,
): UserResponse {
  return {
    id: db_user._id.toString(),
    login_type: db_user.login_type,
    ...(db_user.login_type === "persistent" && { username: db_user.username }),
  };
}

export function deleteUser(id: string) {
  usersCollection()
    .deleteOne({
      _id: new ObjectId(id),
    })
    .catch(console.error);
}

export function checkUsername(username: string): void {
  if (!/^.{4,20}$/.test(username)) {
    throw "Username must be between 4 and 20 characters long.";
  }
  if (!/^[a-zA-Z0-9]*$/.test(username)) {
    throw "Username can only have alphanumeric characters.";
  }
}
