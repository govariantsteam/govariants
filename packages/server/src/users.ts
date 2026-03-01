import { getDb } from "./db";
import {
  UserResponse,
  UserRankings,
  UserRole,
} from "@ogfcommunity/variants-shared";
import { Collection, WithId, ObjectId } from "mongodb";
import { randomBytes, scrypt } from "node:crypto";
import { deleteAllNotificationsOfUser } from "./notifications/notifications";

export interface GuestUser extends UserResponse {
  token: string;
  login_type: "guest";
  ranking?: UserRankings;
}

// Not currently used, but the plan is to use LocalStrategy from Password.js
// eventually, so I want to make sure this type is considered from the start
export interface PersistentUser extends UserResponse {
  username: string;
  password_hash: string;
  login_type: "persistent";
  ranking?: UserRankings;
  email?: string;
}

export async function updateUserRanking(
  user_id: string,
  new_ranking: UserRankings,
): Promise<void> {
  const update_result = await usersCollection().updateOne(
    { _id: new ObjectId(user_id) },
    { $set: { ranking: new_ranking } },
  );
  if (update_result.matchedCount === 0) {
    throw new Error("User not found");
  }
}

type DbUser = Omit<GuestUser, "id"> | Omit<PersistentUser, "id">;

function usersCollection(): Collection<DbUser> {
  return getDb().db().collection<DbUser>("users");
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
    ranking: db_user.ranking,
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
  email?: string,
): Promise<UserResponse> {
  const password_hash = await hashPassword(password);

  const user: Omit<PersistentUser, "id"> = {
    username,
    password_hash,
    login_type: "persistent",
    ranking: {},
    ...(email && { email }),
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

export async function createUserWithSessionId(
  session_id: string,
): Promise<GuestUser> {
  const result = await usersCollection().insertOne({
    token: session_id,
    login_type: "guest",
  });
  return {
    id: result.insertedId.toString(),
    token: session_id,
    login_type: "guest",
  };
}

export async function getUser(user_id: string): Promise<UserResponse> {
  const db_user = await usersCollection().findOne({
    _id: new ObjectId(user_id),
  });

  if (!db_user) {
    return undefined;
  }

  return outwardFacingUser(db_user);
}

function outwardFacingUser(db_user: WithId<DbUser>): UserResponse {
  return {
    id: db_user._id.toString(),
    login_type: db_user.login_type,
    ...(db_user.login_type === "persistent" && { username: db_user.username }),
    ranking: db_user.ranking || {},
    role: db_user.role,
  };
}

export async function getUserEmail(
  user_id: string,
): Promise<string | undefined> {
  const db_user = await usersCollection().findOne({
    _id: new ObjectId(user_id),
  });

  if (!db_user) {
    throw new Error("User not found");
  }

  return (db_user as Omit<PersistentUser, "id">).email;
}

export function deleteUser(user_id: string) {
  usersCollection()
    .deleteOne({
      _id: new ObjectId(user_id),
    })
    .catch(console.error);
  void deleteAllNotificationsOfUser(user_id);
}

export function checkUsername(username: string): void {
  if (!/^.{4,20}$/.test(username)) {
    throw new Error("Username must be between 4 and 20 characters long.");
  }
  if (!/^[a-zA-Z0-9]*$/.test(username)) {
    throw new Error("Username can only have alphanumeric characters.");
  }
}

export async function setUserRole(
  user_id: string,
  role: UserRole,
): Promise<void> {
  const update_result = await usersCollection().updateOne(
    { _id: new ObjectId(user_id) },
    { $set: { role: role } },
  );
  if (update_result.matchedCount === 0) {
    throw new Error("User not found");
  }
}

export async function setUserEmail(
  user_id: string,
  email: string,
): Promise<void> {
  const user = await usersCollection().findOne({
    _id: new ObjectId(user_id),
  });
  if (!user) {
    throw new Error("User not found");
  }
  if (user.login_type === "guest") {
    throw new Error("Guest users cannot have an email address");
  }

  email = email.trim();
  const update_result = await usersCollection().updateOne(
    { _id: new ObjectId(user_id) },
    email.trim() === ""
      ? { $unset: { email: "" } }
      : { $set: { email: email } },
  );
  if (update_result.matchedCount === 0) {
    throw new Error("User not found");
  }
}
